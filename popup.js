(async function applyTheme() {
    let cfg = window.BETTER_TAB_CONFIG ?? {};
    if (typeof BetterTabFileConfig !== "undefined") {
        const fileCfg = await BetterTabFileConfig.loadConfig().catch(() => null);
        if (fileCfg) cfg = fileCfg;
    }

    const pref = (cfg.popupTheme ?? "match").toLowerCase();

    let resolved;
    if (pref === "dark" || pref === "light") {
        resolved = pref;
    } else if (pref === "match") {
        // Mirror the main app theme setting.
        const appTheme = (cfg.theme ?? "system").toLowerCase();
        if (appTheme === "dark" || appTheme === "light") {
            resolved = appTheme;
        } else {
            resolved = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
        }
    } else {
        // "system" or unrecognised
        resolved = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }

    document.documentElement.dataset.theme = resolved;
})();

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

(async function init() {
    const [tab] = await new Promise(resolve =>
        chrome.tabs.query({ active: true, currentWindow: true }, resolve)
    );
    currentTab = tab;

    // When a config directory is linked, read bookmarks from bookmarks.json.
    // Fall back to chrome.storage.local if not linked or file unavailable.
    let fileBookmarks = null;
    if (typeof BetterTabFileConfig !== "undefined") {
        fileBookmarks = await BetterTabFileConfig.getStoredBookmarks().catch(() => null);
    }
    storageBookmarks = fileBookmarks ?? await new Promise(resolve =>
        chrome.storage.local.get(["bookmarks"], (r) =>
            resolve(Array.isArray(r.bookmarks) ? r.bookmarks : [])
        )
    );

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
})();

// --- Render states ---

function renderState(state) {
    statusBadge.hidden = true;
    actionsEl.innerHTML = "";

    if (state === "stored") {
        showBadge("Saved in Better Tab", "accent");
        addButton("Update bookmark", "primary", handleUpdate);
        addButton("Remove bookmark", "danger", handleRemove);

    } else if (state === "config") {
        showBadge("Saved in config.js", "muted");

    } else {
        addButton("Save bookmark", "primary", handleSave);
    }

    addButton("Save to notes", "secondary full", handleSaveToNotes);
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

function handleSaveToNotes(e) {
    const btn = e.currentTarget;
    const url = urlInput.value.trim() || currentTab?.url || "";
    if (!url) return;
    chrome.storage.local.get(["notesContent"], (result) => {
        const existing = (result.notesContent ?? "").trimEnd();
        const updated = existing ? `${existing}\n- [${url}](${url})` : `- [${url}](${url})`;
        chrome.storage.local.set({ notesContent: updated }, () => {
            setFeedback(btn, "Saved to notes!", 900, true);
        });
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

function persist(callback) {
    // Always write to chrome.storage.local as a fallback.
    chrome.storage.local.set({ bookmarks: storageBookmarks }, callback);
    // Mirror to bookmarks.json in the linked config directory if available.
    if (typeof BetterTabFileConfig !== "undefined") {
        BetterTabFileConfig.saveStoredBookmarks(storageBookmarks).catch(() => {});
    }
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
