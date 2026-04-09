// Notes panel — toggleable markdown notes persisted via chrome.storage.local

const notesPanel     = document.getElementById("notes-panel");
const notesPreview   = document.getElementById("notes-preview");
const notesTextarea  = document.getElementById("notes-textarea");
const notesToggleBtn = document.getElementById("notes-toggle");

let saveTimer   = null;
let taskCounter = 0; // reset before each render, used to map checkboxes → source lines

// --- Init ---

chrome.storage.local.get(["notesContent", "notesOpen"], (result) => {
    const content = result.notesContent ?? "";
    notesTextarea.value = content;
    renderPreview(content);
    if (result.notesOpen) {
        notesPanel.classList.add("open");
        notesToggleBtn.classList.add("active");
    }
});

// --- Toggle ---

notesToggleBtn.addEventListener("click", () => {
    const open = notesPanel.classList.toggle("open");
    notesToggleBtn.classList.toggle("active", open);
    if (!open) showPreviewMode();
    chrome.storage.local.set({ notesOpen: open });
});

// --- Edit / preview ---

notesPreview.addEventListener("click", (e) => {
    if (e.target.type === "checkbox") {
        toggleTask(parseInt(e.target.dataset.taskIndex), e.target.checked);
        return;
    }
    const link = e.target.closest("a");
    if (link) {
        e.preventDefault();
        window.location.href = link.href;
        return;
    }
    showEditMode();
});

notesTextarea.addEventListener("input", () => {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
        chrome.storage.local.set({ notesContent: notesTextarea.value });
    }, 400);
});

notesTextarea.addEventListener("blur", showPreviewMode);

notesTextarea.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
        e.preventDefault();
        notesTextarea.blur();
    }
    // Propagation is intentionally NOT stopped — window-level shortcuts work while editing.
});

// --- Action buttons ---

document.getElementById("notes-copy-btn").addEventListener("click", (e) => {
    const btn = e.currentTarget;
    navigator.clipboard.writeText(notesTextarea.value).then(() => {
        const orig = btn.textContent;
        btn.textContent = "Copied!";
        setTimeout(() => (btn.textContent = orig), 1500);
    });
});

document.getElementById("notes-download-btn").addEventListener("click", () => {
    const blob = new Blob([notesTextarea.value], { type: "text/markdown" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = "notes.md";
    a.click();
    URL.revokeObjectURL(url);
});

document.getElementById("notes-clear-btn").addEventListener("click", () => {
    if (!notesTextarea.value || confirm("Clear all notes?")) {
        notesTextarea.value = "";
        chrome.storage.local.set({ notesContent: "" });
        renderPreview("");
        if (!notesTextarea.hidden) notesTextarea.focus();
    }
});

// --- Mode helpers ---

function showEditMode() {
    notesTextarea.style.height = notesPreview.offsetHeight + "px";
    notesPreview.hidden = true;
    notesTextarea.hidden = false;
    notesTextarea.focus();
}

function showPreviewMode() {
    notesTextarea.hidden = true;
    notesPreview.hidden = false;
    renderPreview(notesTextarea.value);
    chrome.storage.local.set({ notesContent: notesTextarea.value });
}

function renderPreview(content) {
    if (!content.trim()) {
        notesPreview.classList.add("empty");
        notesPreview.innerHTML = "";
        return;
    }
    notesPreview.classList.remove("empty");
    taskCounter = 0;
    notesPreview.innerHTML = parseMarkdown(content);
}

function toggleTask(index, checked) {
    const lines = notesTextarea.value.split("\n");
    let count = 0;
    for (let i = 0; i < lines.length; i++) {
        if (/^[*\-+] \[[ xX]\] /.test(lines[i])) {
            if (count === index) {
                lines[i] = lines[i].replace(/^([*\-+] )\[[ xX]\] /, `$1[${checked ? "x" : " "}] `);
                break;
            }
            count++;
        }
    }
    notesTextarea.value = lines.join("\n");
    chrome.storage.local.set({ notesContent: notesTextarea.value });
}

// Keyboard shortcuts (textarea's stopPropagation naturally blocks these while editing).
window.addEventListener("keydown", (e) => {
    if (!e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key.toLowerCase() !== "n") return;

    e.preventDefault();
    if (e.shiftKey) {
        // Ctrl+Shift+N: toggle notes panel
        notesToggleBtn.click();
    } else {
        // Ctrl+N: blur textarea if active; open+focus if hidden; focus if open but not editing
        if (!notesTextarea.hidden) {
            notesTextarea.blur();
        } else if (!notesPanel.classList.contains("open")) {
            notesPanel.classList.add("open");
            notesToggleBtn.classList.add("active");
            chrome.storage.local.set({ notesOpen: true });
            showEditMode();
        } else {
            showEditMode();
        }
    }
});

// Expose so script.js can check whether the textarea is active
window._notesTextareaActive = () => !notesTextarea.hidden;

// --- Markdown parser ---

function parseMarkdown(md) {
    const lines = md.split("\n");
    let html = "";
    let i = 0;

    while (i < lines.length) {
        const line = lines[i];

        if (!line.trim()) { html += '<div class="notes-spacer"></div>'; i++; continue; }

        // Fenced code block
        if (line.startsWith("```")) {
            let code = "";
            i++;
            while (i < lines.length && !lines[i].startsWith("```")) {
                code += esc(lines[i]) + "\n";
                i++;
            }
            html += `<pre><code>${code.trimEnd()}</code></pre>`;
            i++; continue;
        }

        // Heading
        const hm = line.match(/^(#{1,6}) (.+)/);
        if (hm) {
            html += `<h${hm[1].length}>${inline(hm[2])}</h${hm[1].length}>`;
            i++; continue;
        }

        // Horizontal rule
        if (/^[-*_]{3,}$/.test(line.trim())) {
            html += "<hr>";
            i++; continue;
        }

        // Blockquote
        if (line.startsWith("> ")) {
            let bq = "";
            while (i < lines.length && lines[i].startsWith("> ")) {
                bq += lines[i].slice(2) + "\n";
                i++;
            }
            html += `<blockquote>${parseMarkdown(bq.trim())}</blockquote>`;
            continue;
        }

        // Unordered list (including task list items)
        if (/^[*\-+] /.test(line)) {
            html += "<ul>";
            while (i < lines.length && /^[*\-+] /.test(lines[i])) {
                const content = lines[i].replace(/^[*\-+] /, "");
                const task = content.match(/^\[([ xX])\] (.+)/);
                if (task) {
                    const checked = task[1].toLowerCase() === "x";
                    html += `<li class="task-item"><input type="checkbox" data-task-index="${taskCounter++}"${checked ? " checked" : ""}>${inline(task[2])}</li>`;
                } else {
                    html += `<li>${inline(content)}</li>`;
                }
                i++;
            }
            html += "</ul>";
            continue;
        }

        // Ordered list
        if (/^\d+\. /.test(line)) {
            html += "<ol>";
            while (i < lines.length && /^\d+\. /.test(lines[i])) {
                html += `<li>${inline(lines[i].replace(/^\d+\. /, ""))}</li>`;
                i++;
            }
            html += "</ol>";
            continue;
        }

        // Paragraph — collect consecutive non-block lines
        const para = [];
        while (
            i < lines.length &&
            lines[i].trim() &&
            !lines[i].startsWith("#") &&
            !lines[i].startsWith("```") &&
            !lines[i].startsWith("> ") &&
            !/^[*\-+] /.test(lines[i]) &&
            !/^\d+\. /.test(lines[i]) &&
            !/^[-*_]{3,}$/.test(lines[i].trim())
        ) {
            para.push(lines[i]);
            i++;
        }
        if (para.length) html += `<p>${para.map(inline).join("<br>")}</p>`;
    }

    return html;
}

function inline(text) {
    return esc(text)
        .replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>")
        .replace(/___(.+?)___/g,         "<strong><em>$1</em></strong>")
        .replace(/\*\*(.+?)\*\*/g,       "<strong>$1</strong>")
        .replace(/__(.+?)__/g,           "<strong>$1</strong>")
        .replace(/\*(.+?)\*/g,           "<em>$1</em>")
        .replace(/_(.+?)_/g,             "<em>$1</em>")
        .replace(/~~(.+?)~~/g,           "<del>$1</del>")
        .replace(/`(.+?)`/g,             "<code>$1</code>")
        .replace(/\[(.+?)\]\((.+?)\)/g, (_, t, url) => {
            const safe = /^https?:|^\/|^mailto:/.test(url) ? url : "#";
            return `<a href="${safe}">${t}</a>`;
        });
}

function esc(s) {
    return s
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}
