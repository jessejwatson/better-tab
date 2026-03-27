const nameInput = document.getElementById("name");
const urlInput  = document.getElementById("url");
const tagsInput = document.getElementById("tags");
const statusBadge = document.getElementById("status-badge");
const actionsEl = document.getElementById("actions");

const configBookmarks = window.BETTER_TAB_CONFIG?.bookmarks ?? [];

let currentTab = null;
let storageBookmarks = [];
let storageMatchIndex = -1;

// --- Init ---

chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    currentTab = tab;

    chrome.storage.local.get(["bookmarks"], (result) => {
        storageBookmarks = Array.isArray(result.bookmarks) ? result.bookmarks : [];
        storageMatchIndex = storageBookmarks.findIndex((b) => b.url === tab.url);

        const configMatch = configBookmarks.find((b) => b.url === tab.url);

        if (storageMatchIndex >= 0) {
            prefill(storageBookmarks[storageMatchIndex]);
            renderState("stored");
        } else if (configMatch) {
            prefill(configMatch);
            renderState("config");
        } else {
            nameInput.value = tab.title ?? "";
            urlInput.value  = tab.url  ?? "";
            nameInput.select();
            renderState("new");
        }
    });
});

// --- Render states ---

function renderState(state) {
    statusBadge.hidden = true;
    actionsEl.innerHTML = "";

    if (state === "stored") {
        showBadge("Saved in Better Tab", "accent");
        addButton("Update bookmark", "primary", handleUpdate);
        addButton("Copy entry", "secondary", handleCopy);
        addButton("Remove bookmark", "danger", handleRemove);

    } else if (state === "config") {
        showBadge("Saved in config.js", "muted");
        addButton("Copy update entry", "secondary full", handleCopy);

    } else {
        addButton("Save bookmark", "primary", handleSave);
        addButton("Copy entry", "secondary", handleCopy);
    }
}

function showBadge(text, style) {
    statusBadge.textContent = text;
    statusBadge.className = `status-badge status-badge--${style}`;
    statusBadge.hidden = false;
}

function addButton(label, classes, handler) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = label;
    btn.className = classes;
    btn.addEventListener("click", handler);
    actionsEl.appendChild(btn);
    return btn;
}

// --- Handlers ---

function handleSave(e) {
    const bookmark = buildBookmark();
    if (!bookmark) return;
    const btn = e.currentTarget;
    storageBookmarks.push(bookmark);
    persist(() => setFeedback(btn, "Saved!", 900, true));
}

function handleUpdate(e) {
    const bookmark = buildBookmark();
    if (!bookmark) return;
    const btn = e.currentTarget;
    storageBookmarks[storageMatchIndex] = bookmark;
    persist(() => setFeedback(btn, "Updated!", 900, true));
}

function handleRemove(e) {
    if (!confirm(`Remove "${storageBookmarks[storageMatchIndex]?.name}" from Better Tab?`)) return;
    const btn = e.currentTarget;
    storageBookmarks.splice(storageMatchIndex, 1);
    persist(() => setFeedback(btn, "Removed!", 800, true));
}

function handleCopy(e) {
    const bookmark = buildBookmark();
    if (!bookmark) return;
    const btn = e.currentTarget;
    navigator.clipboard.writeText(formatEntry(bookmark)).then(() => {
        setFeedback(btn, "Copied!", 1500);
    });
}

// --- Helpers ---

function prefill({ name, url, tags }) {
    nameInput.value = name ?? "";
    urlInput.value  = url  ?? "";
    tagsInput.value = Array.isArray(tags) ? tags.join(", ") : "";
}

function buildBookmark() {
    const name = nameInput.value.trim();
    const url  = urlInput.value.trim();
    if (!name || !url) return null;
    const tags = tagsInput.value.split(",").map((t) => t.trim()).filter(Boolean);
    return { name, url, tags };
}

function formatEntry({ name, url, tags }) {
    const tagsStr = tags.length ? `["${tags.join('", "')}"]` : "[]";
    return `            {\n                name: "${name}",\n                url: "${url}",\n                tags: ${tagsStr},\n            },`;
}

function persist(callback) {
    chrome.storage.local.set({ bookmarks: storageBookmarks }, callback);
}

function setFeedback(btn, message, duration, closeAfter = false) {
    const original = btn.textContent;
    btn.textContent = message;
    btn.disabled = true;
    setTimeout(() => {
        if (closeAfter) { window.close(); return; }
        btn.textContent = original;
        btn.disabled = false;
    }, duration);
}
