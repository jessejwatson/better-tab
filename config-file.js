/**
 * config-file.js — File System Access API integration for Better Tab.
 *
 * Lets power users link a local directory (e.g. ~/.config/better-tab/) so the
 * extension reads config.js from there instead of the bundled copy. The
 * FileSystemDirectoryHandle is stored in IndexedDB so the user only picks the
 * directory once; permission is silently restored on each subsequent page load.
 *
 * Public API:  window.BetterTabFileConfig
 *   .link()        — open a directory picker, store the handle
 *                    returns { configCreated: boolean }
 *   .unlink()      — remove the stored handle
 *   .loadConfig()  — resolve to a config object, or null if not linked / unavailable
 *   .isLinked()    — resolve to true if a handle is stored
 *   .getDirName()  — resolve to the directory name string, or null
 */
(function () {
    "use strict";

    const DB_NAME    = "better-tab";
    const DB_VERSION = 1;
    const STORE      = "handles";
    const KEY        = "configDir";

    // Default files written to a newly-linked directory.
    // JSONC format — line comments (//) and trailing commas are supported.
    //
    // Bookmarks and powerups live in their own sidecar files so that popup
    // saves (which write clean JSON) never overwrite config.json comments.
    const DEFAULT_CONFIG = `// Better Tab — configuration file
// Edit this file and open a new tab to see changes (no extension reload needed).
// Supports // line comments and trailing commas.
// Bookmarks → bookmarks.json  |  Powerups → powerups.json

{
    // ── Editor ──────────────────────────────────────────────────────────────
    // The "Edit config" button copies a terminal command to open this file.
    "editor": "nano",

    // ── Theme ───────────────────────────────────────────────────────────────
    // "system" (default) | "dark" | "light"
    "theme": "system",

    // Theme for the browser action popup: "match" | "system" | "dark" | "light"
    "popupTheme": "match",

    // ── Wallpaper ────────────────────────────────────────────────────────────
    // Place an image in this config directory and reference it by filename.
    // "wallpaper": "wallpaper.jpg",

    // ── Clock ────────────────────────────────────────────────────────────────
    // "showClock": true,
    // "clockFormat": "12h",
    // "clockSize": "md",

}
`;

    const DEFAULT_BOOKMARKS = `// Better Tab — bookmarks
// Each entry: { "name", "url", "tags"? }
// Bookmarks can also be saved via the browser action popup.
[
    { "name": "GitHub",       "url": "https://github.com",       "tags": ["code", "dev"] },
    { "name": "Gmail",        "url": "https://mail.google.com",  "tags": ["email"] },
    { "name": "Google Drive", "url": "https://drive.google.com", "tags": ["files"] },
    { "name": "YouTube",      "url": "https://youtube.com",      "tags": ["video"] },
    { "name": "Notion",       "url": "https://notion.so",        "tags": ["notes"] },
    { "name": "Figma",        "url": "https://figma.com",        "tags": ["design"] }
]
`;

    const DEFAULT_POWERUPS = `// Better Tab — powerups
// type "search": { "name", "type": "search", "url" (use {search}), "tags"?, "color"?, "promoted"?, "placeholder"? }
// type "app":    { "name", "type": "app", "url" (app URL scheme e.g. "claude://"), "color"? }
[
    { "name": "YouTube",     "type": "search", "url": "https://www.youtube.com/results?search_query={search}", "color": "#ff0000" },
    { "name": "GitHub",      "type": "search", "url": "https://github.com/search?q={search}", "color": "#6e76f0" },
    { "name": "Google Maps", "type": "search", "url": "https://www.google.com/maps/search/{search}", "color": "#34a853" }
]
`;

    // --- IndexedDB helpers ---

    function openDB() {
        return new Promise((resolve, reject) => {
            const req = indexedDB.open(DB_NAME, DB_VERSION);
            req.onupgradeneeded = ({ target: { result: db } }) => {
                if (!db.objectStoreNames.contains(STORE)) {
                    db.createObjectStore(STORE);
                }
            };
            req.onsuccess = ({ target: { result } }) => resolve(result);
            req.onerror   = ({ target: { error } })  => reject(error);
        });
    }

    async function storeHandle(handle) {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE, "readwrite");
            tx.objectStore(STORE).put(handle, KEY);
            tx.oncomplete = resolve;
            tx.onerror    = ({ target: { error } }) => reject(error);
        });
    }

    async function loadHandle() {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const tx  = db.transaction(STORE, "readonly");
            const req = tx.objectStore(STORE).get(KEY);
            req.onsuccess = ({ target: { result } }) => resolve(result ?? null);
            req.onerror   = ({ target: { error } })  => reject(error);
        });
    }

    async function clearHandle() {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE, "readwrite");
            tx.objectStore(STORE).delete(KEY);
            tx.oncomplete = resolve;
            tx.onerror    = ({ target: { error } }) => reject(error);
        });
    }

    // --- JSONC parser ---

    // Parses JSON that may contain // line comments and trailing commas.
    // Uses a character-level state machine so that // inside string values
    // (e.g. URLs like "https://...") is never mistaken for a comment.
    function parseJsonc(text) {
        let out = "";
        let inString = false;
        let escaped = false;

        for (let i = 0; i < text.length; i++) {
            const ch = text[i];

            if (escaped) { out += ch; escaped = false; continue; }

            if (inString) {
                if (ch === "\\") { escaped = true; out += ch; }
                else if (ch === '"') { inString = false; out += ch; }
                else { out += ch; }
                continue;
            }

            // Outside a string — check for comments
            if (ch === "/" && text[i + 1] === "/") {
                while (i < text.length && text[i] !== "\n") i++;
                continue;
            }
            if (ch === "/" && text[i + 1] === "*") {
                i += 2;
                while (i < text.length && !(text[i] === "*" && text[i + 1] === "/")) i++;
                i++; // skip closing /
                continue;
            }

            if (ch === '"') inString = true;
            out += ch;
        }

        // Strip trailing commas before ] or }
        out = out.replace(/,(\s*[}\]])/g, "$1");

        return JSON.parse(out);
    }

    // --- File System Access helpers ---

    async function ensureReadPermission(handle) {
        const opts = { mode: "read" };
        if (await handle.queryPermission(opts) === "granted") return true;
        if (await handle.requestPermission(opts) === "granted") return true;
        return false;
    }

    async function ensureWritePermission(handle) {
        const opts = { mode: "readwrite" };
        if (await handle.queryPermission(opts) === "granted") return true;
        if (await handle.requestPermission(opts) === "granted") return true;
        return false;
    }

    /**
     * Ensure config.json, bookmarks.json, and powerups.json exist in the
     * directory, creating them from defaults if absent.
     * Returns true if config.json was created (new directory), false otherwise.
     * Requires readwrite permission on the handle.
     */
    async function ensureConfigExists(dirHandle) {
        let configCreated = false;
        try {
            await dirHandle.getFileHandle("config.json", { create: false });
        } catch {
            const fh = await dirHandle.getFileHandle("config.json", { create: true });
            const w  = await fh.createWritable();
            await w.write(DEFAULT_CONFIG);
            await w.close();
            configCreated = true;
        }
        for (const [name, content] of [
            ["bookmarks.json", DEFAULT_BOOKMARKS],
            ["powerups.json",  DEFAULT_POWERUPS],
        ]) {
            try {
                await dirHandle.getFileHandle(name, { create: false });
            } catch {
                const fh = await dirHandle.getFileHandle(name, { create: true });
                const w  = await fh.createWritable();
                await w.write(content);
                await w.close();
            }
        }
        return configCreated;
    }

    async function readJsoncFile(dirHandle, filename) {
        const fileHandle = await dirHandle.getFileHandle(filename);
        const file       = await fileHandle.getFile();
        return parseJsonc(await file.text());
    }

    async function readJsoncFileSafe(dirHandle, filename) {
        try { return await readJsoncFile(dirHandle, filename); }
        catch { return null; }
    }

    async function readConfigFromDir(dirHandle) {
        const cfg       = await readJsoncFile(dirHandle, "config.json");
        const bookmarks = await readJsoncFileSafe(dirHandle, "bookmarks.json");
        const powerups  = await readJsoncFileSafe(dirHandle, "powerups.json");
        if (Array.isArray(bookmarks)) cfg.bookmarks = bookmarks;
        if (Array.isArray(powerups))  cfg.powerups  = powerups;
        return cfg;
    }

    // --- Public API ---

    window.BetterTabFileConfig = {
        /**
         * Open a directory picker and persist the chosen handle.
         *
         * - Uses readwrite mode so we can create config.json if the directory is
         *   empty (subsequent loadConfig() calls only need read).
         * - If a handle is already stored, it is passed as `startIn` so the
         *   picker opens in the previously-selected location on re-link.
         *
         * Returns { configCreated: boolean } — true if config.json was created.
         */
        async link() {
            const existing = await loadHandle().catch(() => null);
            const opts = { mode: "readwrite" };
            if (existing) opts.startIn = existing;

            const handle = await window.showDirectoryPicker(opts);
            const configCreated = await ensureConfigExists(handle);
            await storeHandle(handle);
            return { configCreated };
        },

        /** Remove the stored handle. */
        async unlink() {
            await clearHandle();
        },

        /**
         * Restore the stored handle, ensure read permission, read config.js,
         * and return the parsed config object.  Returns null on any failure.
         */
        async loadConfig() {
            const handle = await loadHandle();
            if (!handle) return null;
            const ok = await ensureReadPermission(handle).catch(() => false);
            if (!ok) return null;
            return readConfigFromDir(handle).catch(() => null);
        },

        /** Returns true if a directory handle has been stored. */
        async isLinked() {
            const handle = await loadHandle();
            return handle !== null;
        },

        /** Returns the stored directory name (e.g. "better-tab"), or null. */
        async getDirName() {
            const handle = await loadHandle();
            return handle?.name ?? null;
        },

        /**
         * Read the bookmarks array from bookmarks.json in the linked directory.
         * Returns the array, or null if not linked / file absent / unreadable.
         */
        async getStoredBookmarks() {
            const handle = await loadHandle();
            if (!handle) return null;
            const ok = await ensureReadPermission(handle).catch(() => false);
            if (!ok) return null;
            return readJsoncFileSafe(handle, "bookmarks.json");
        },

        /**
         * Write an updated bookmarks array to bookmarks.json.
         * config.json is never touched, so its comments are preserved.
         * Returns true on success, false if not linked or permission denied.
         */
        async saveStoredBookmarks(bookmarks) {
            const handle = await loadHandle();
            if (!handle) return false;
            const ok = await ensureWritePermission(handle).catch(() => false);
            if (!ok) return false;
            try {
                const fileHandle = await handle.getFileHandle("bookmarks.json", { create: true });
                const writable   = await fileHandle.createWritable();
                await writable.write(JSON.stringify(bookmarks, null, 4));
                await writable.close();
                return true;
            } catch {
                return false;
            }
        },

        /**
         * Resolve a wallpaper filename (e.g. "wallpaper.jpg") relative to the
         * linked config directory and return a blob: URL for use in CSS.
         * Returns null if not linked, file absent, or permission denied.
         */
        async getWallpaperUrl(filename) {
            const handle = await loadHandle();
            if (!handle) return null;
            const ok = await ensureReadPermission(handle).catch(() => false);
            if (!ok) return null;
            try {
                const fileHandle = await handle.getFileHandle(filename);
                const file       = await fileHandle.getFile();
                return URL.createObjectURL(file);
            } catch {
                return null;
            }
        },
    };
})();
