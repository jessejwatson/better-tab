/**
 * Configuration is loaded from `config.js` via the global `window.BETTER_TAB_CONFIG`.
 * This keeps the app working under `file://` (no imports / no fetch).
 */
let config = window.BETTER_TAB_CONFIG ?? {
    bookmarks: [],
    powerups: [],
};

const isMac = /Mac/i.test(navigator.platform);

// Apply theme — resolves "system" to the actual OS preference so CSS can use
// a single data-theme attribute selector instead of @media queries.
(function applyTheme() {
    const pref = (config.theme ?? "system").toLowerCase();
    let resolved;
    if (pref === "dark" || pref === "light") {
        resolved = pref;
    } else {
        resolved = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    document.documentElement.dataset.theme = resolved;
    // Keep in sync if system theme changes and user chose "system".
    if (pref === "system") {
        window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
            document.documentElement.dataset.theme = e.matches ? "dark" : "light";
        });
    }
})();

// Peek feature — hold Ctrl+H to hide UI elements and see the wallpaper.
// Called once when a wallpaper is first activated (bundled or file config).
let peekInitialised = false;
function enableWallpaperPeek() {
    if (peekInitialised) return;
    peekInitialised = true;

    const peekHint = document.createElement("div");
    peekHint.className = "peek-hint";
    peekHint.innerHTML = `<kbd>${isMac ? "⌃H" : "Alt+H"}</kbd> Hide elements`;
    document.body.appendChild(peekHint);

    let peeking = false;
    window.addEventListener("keydown", (e) => {
        if (peeking) return;
        const modOk = isMac
            ? (e.ctrlKey && !e.shiftKey && !e.metaKey && !e.altKey)
            : (e.altKey  && !e.shiftKey && !e.metaKey && !e.ctrlKey);
        if (e.key === "h" && modOk) {
            e.preventDefault();
            peeking = true;
            document.body.classList.add("wallpaper-peek");
        }
    });
    const endPeek = () => {
        peeking = false;
        document.body.classList.remove("wallpaper-peek");
    };
    window.addEventListener("keyup", (e) => { if (e.key === "h") endPeek(); });
    window.addEventListener("blur", endPeek);
}

if (config.wallpaper) {
    document.body.classList.add("has-wallpaper");
    // Set wallpaper via custom property so ::after can own the layer (enabling zoom transition).
    document.documentElement.style.setProperty("--wallpaper-url", `url("${config.wallpaper}")`);
    enableWallpaperPeek();
}

const searchInput = document.getElementById("search");
const suggestionsList = document.getElementById("suggestions");
const searchWrapper = document.getElementById("search-wrapper");
const powerupChip = document.getElementById("active-powerup");
const searchHint = document.querySelector(".search-hint");

// Chrome enforces address-bar focus for new tabs at the browser level —
// page JavaScript cannot override it, even inside an extension.
// Workaround: press Escape to release the address bar, which returns focus
// to the page and triggers the listener below.
// Clock — initialised via initClock() so it can be re-run after file config loads.
let _clockTimeout = null;
let _clockInterval = null;

function initClock() {
    clearTimeout(_clockTimeout);
    clearInterval(_clockInterval);

    const clockEl = document.getElementById("clock");
    if (config.showClock === false) {
        clockEl.hidden = true;
        return;
    }

    const use24h = (config.clockFormat ?? "12h") === "24h";
    const clockSize = config.clockSize ?? "md";
    clockEl.className = clockEl.className.replace(/\bclock--\S+/g, "").trim();
    clockEl.classList.add(`clock--${clockSize}`);
    clockEl.hidden = false;

    function updateClock() {
        const now = new Date();
        let h = now.getHours();
        const m = String(now.getMinutes()).padStart(2, "0");
        if (use24h) {
            clockEl.textContent = `${String(h).padStart(2, "0")}:${m}`;
        } else {
            const ampm = h >= 12 ? "pm" : "am";
            h = h % 12 || 12;
            clockEl.innerHTML = `${h}:${m}<span class="clock-ampm">${ampm}</span>`;
        }
    }

    updateClock();
    // Sync to the next minute boundary then tick every minute.
    _clockTimeout = setTimeout(() => {
        updateClock();
        _clockInterval = setInterval(updateClock, 60000);
    }, (60 - new Date().getSeconds()) * 1000);
}

initClock();

// Once popIn animation ends, replace animation-held values with static inline
// styles so CSS transitions (e.g. wallpaper peek) can take over cleanly.
const container = document.querySelector(".container");
container.addEventListener("animationend", () => {
    container.style.opacity = "1";
    container.style.transform = "translateY(2px)";
    container.style.animation = "none";
}, { once: true });

// Ctrl+S (Mac) / Alt+S (Windows) focuses the search bar from anywhere.
// Notes textarea blocks this via stopPropagation while editing.
window.addEventListener("keydown", (e) => {
    const modOk = isMac
        ? (e.key === "s" && e.ctrlKey && !e.shiftKey && !e.metaKey && !e.altKey)
        : (e.key === "s" && e.altKey  && !e.shiftKey && !e.metaKey && !e.ctrlKey);
    if (modOk) {
        e.preventDefault();
        searchInput.focus();
    }
});

// Update static shortcut labels for non-Mac platforms.
if (!isMac) {
    const searchHintKbd = document.querySelector(".search-hint");
    if (searchHintKbd) searchHintKbd.textContent = "Alt+S";

    const notesKbd = document.querySelector(".notes-shortcut");
    if (notesKbd) notesKbd.textContent = "Alt+N";

    const notesToggleKbd = document.querySelector("#notes-toggle .dev-btn-shortcut");
    if (notesToggleKbd) notesToggleKbd.textContent = "Alt+⇧N";

    const notesToggleBtn = document.getElementById("notes-toggle");
    if (notesToggleBtn) notesToggleBtn.title = "Toggle notes (Alt+Shift+N) · Focus/open notes (Alt+N)";
}

searchInput.focus();
window.addEventListener("focus", () => {
    if (window._notesTextareaActive?.()) return;
    searchInput.focus();
});

let bookmarks = Array.isArray(config.bookmarks) ? config.bookmarks : [];
let powerups = Array.isArray(config.powerups) ? config.powerups : [];
let fileConfigApplied = false;

// Merge bookmarks saved via the popup, skipping any URLs already in config.
// When file config has been applied, bookmarks already come from config.json —
// nothing more to do. Otherwise falls back to chrome.storage.local.
async function mergeStorageBookmarks() {
    if (fileConfigApplied) return;
    if (chrome.storage?.local) {
        chrome.storage.local.get(["bookmarks"], (result) => {
            const stored = Array.isArray(result.bookmarks) ? result.bookmarks : [];
            const configUrls = new Set(bookmarks.map((b) => b.url));
            bookmarks = [...bookmarks, ...stored.filter((b) => !configUrls.has(b.url))];
        });
    }
}
mergeStorageBookmarks().catch(() => {});

// If a config directory has been linked via the File System Access API, read
// config.json from that directory and reinitialise bookmarks/powerups/theme.
//
// This is a named function (not an IIFE) so it can be retried on first user
// interaction, which provides the gesture needed for requestPermission() after
// an extension reload has cleared the File System Access permission.
async function applyFileConfig() {
    if (fileConfigApplied || typeof BetterTabFileConfig === "undefined") return;
    const fileConfig = await BetterTabFileConfig.loadConfig();
    if (!fileConfig) return;
    fileConfigApplied = true;

    config = fileConfig;

    // Re-apply theme in case it differs from the bundled config.
    const pref = (config.theme ?? "system").toLowerCase();
    const resolved =
        pref === "dark" || pref === "light"
            ? pref
            : window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    document.documentElement.dataset.theme = resolved;

    // Re-apply wallpaper — resolve the filename relative to the config directory.
    if (config.wallpaper) {
        document.body.classList.add("has-wallpaper");
        const blobUrl = await BetterTabFileConfig.getWallpaperUrl(config.wallpaper).catch(() => null);
        if (blobUrl) {
            document.documentElement.style.setProperty("--wallpaper-url", `url("${blobUrl}")`);
            enableWallpaperPeek();
        }
    }

    // Re-apply clock (format/size may differ from bundled config).
    initClock();

    // Reinitialise bookmarks and powerups from the file config, then re-merge
    // any bookmarks that were saved dynamically via the popup.
    bookmarks = Array.isArray(config.bookmarks) ? config.bookmarks : [];
    powerups  = Array.isArray(config.powerups)  ? config.powerups  : [];
    await mergeStorageBookmarks();
}

applyFileConfig().catch(() => {});
let currentIndex = -1;
let activePowerup = null;
let originalQuery = "";  // preserves typed text while arrowing through suggestions

searchInput.addEventListener("input", handleInput);
searchInput.addEventListener("keydown", handleKeyNavigation);

function positionSuggestions() {
    const rect = searchWrapper.getBoundingClientRect();
    suggestionsList.style.top = `${rect.bottom + 10}px`;
    suggestionsList.style.left = `${rect.left}px`;
    suggestionsList.style.width = `${rect.width}px`;
}

positionSuggestions();
window.addEventListener("resize", positionSuggestions);

function handleInput() {
    if (activePowerup) {
        suggestionsList.innerHTML = "";
        return;
    }
    updateSuggestions();
    // TODO: fetch search suggestions and call appendSuggestionItems(suggestions)
}

// Scaffolding for future search suggestions provider integration.
// appendSuggestionItems() renders results from an autocomplete API into the
// shared suggestions list alongside local bookmarks/powerups.
function makeSuggestionIcon() {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", "13");
    svg.setAttribute("height", "13");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "2");
    svg.setAttribute("stroke-linecap", "round");
    svg.setAttribute("stroke-linejoin", "round");
    svg.setAttribute("aria-hidden", "true");
    svg.innerHTML = `
        <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
        <path d="M5 3v4"/><path d="M19 17v4"/>
        <path d="M3 5h4"/><path d="M17 19h4"/>`;
    return svg;
}

function appendSuggestionItems(suggestions) {
    // Replace only API suggestion items — local items stay untouched.
    suggestionsList.querySelectorAll(".suggestion-item").forEach((el) => el.remove());

    suggestions.slice(0, 5).forEach((phrase) => {
        const li = document.createElement("li");
        li.classList.add("suggestion-item");
        li._suggestion = true;
        li._query = phrase;

        const icon = makeSuggestionIcon();
        icon.classList.add("suggestion-icon");
        li.appendChild(icon);

        const nameSpan = document.createElement("span");
        nameSpan.className = "suggestion-name";
        nameSpan.textContent = phrase;
        li.appendChild(nameSpan);

        li.addEventListener("mousedown", (e) => e.preventDefault());
        li.addEventListener("click", () => {
            chrome.search.query({ text: phrase, disposition: "CURRENT_TAB" });
        });

        suggestionsList.appendChild(li);
    });

    updateCmdHint();
}

function updateSuggestions() {
    const query = searchInput.value.trim().toLowerCase();
    currentIndex = -1;
    originalQuery = query;
    positionSuggestions();

    if (!query) {
        suggestionsList.innerHTML = "";
        return;
    }

    // Score bookmarks: 2 = name match, 1 = tag match.
    const scoredBookmarks = bookmarks
        .map((bookmark) => {
            const name = (bookmark?.name ?? "").toString().toLowerCase();
            const tags = Array.isArray(bookmark?.tags)
                ? bookmark.tags
                      .map((t) => (t ?? "").toString().toLowerCase())
                      .filter(Boolean)
                : [];
            const nameMatch = name.includes(query);
            const tagsMatch = tags.some((t) => t.includes(query));
            const score = nameMatch ? 2 : tagsMatch ? 1 : 0;
            return { item: bookmark, score, type: "bookmark" };
        })
        .filter((x) => x.score > 0);

    // Score powerups: same rules as bookmarks, but promoted ones get +2
    // so they sort above bookmarks (unless promoted: false).
    const scoredPowerups = powerups
        .map((powerup) => {
            const name = (powerup?.name ?? "").toString().toLowerCase();
            const tags = Array.isArray(powerup?.tags)
                ? powerup.tags
                      .map((t) => (t ?? "").toString().toLowerCase())
                      .filter(Boolean)
                : [];
            const nameMatch = name.includes(query);
            const tagsMatch = tags.some((t) => t.includes(query));
            const baseScore = nameMatch ? 2 : tagsMatch ? 1 : 0;
            if (baseScore === 0) return { item: powerup, score: 0, type: "powerup" };
            const promoted = powerup.promoted !== false;
            const score = promoted ? baseScore + 2 : baseScore;
            return { item: powerup, score, type: "powerup" };
        })
        .filter((x) => x.score > 0);

    const all = [...scoredBookmarks, ...scoredPowerups].sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        const an = (a.item?.name ?? "").toString();
        const bn = (b.item?.name ?? "").toString();
        return an.localeCompare(bn);
    });

    // Replace only local items — API suggestions stay visible until their update arrives.
    suggestionsList.querySelectorAll(".local-item").forEach((el) => el.remove());

    const fragment = document.createDocumentFragment();
    all.forEach(({ item, type }) => {
        const li = document.createElement("li");
        li.classList.add("local-item");

        const nameSpan = document.createElement("span");
        nameSpan.className = "suggestion-name";
        nameSpan.textContent = item.name;
        li.appendChild(nameSpan);

        if (type === "powerup") {
            const badge = document.createElement("span");
            badge.className = "powerup-badge";
            badge.textContent = getPowerupLabel(item);
            if (item.color) {
                badge.classList.add("powerup-badge--colored");
                badge.style.setProperty("--powerup-color", item.color);
            }
            li.appendChild(badge);
            li.classList.add("powerup-suggestion");
            li._powerup = item;
            li.addEventListener("mousedown", (e) => e.preventDefault());
            li.addEventListener("click", () => activatePowerup(item));
        } else {
            li.dataset.url = item.url;
            li.addEventListener("mousedown", (e) => e.preventDefault());
            li.addEventListener("click", () => openUrl(item.url));
        }

        fragment.appendChild(li);
    });

    // Prepend local items before any existing API suggestions.
    suggestionsList.prepend(fragment);
    updateCmdHint();
}

function updateCmdHint() {
    suggestionsList.querySelectorAll(".cmd-hint").forEach((el) => el.remove());
    const first = suggestionsList.querySelector("li");
    if (first) {
        const hint = document.createElement("span");
        hint.className = "cmd-hint";
        hint.innerHTML = isMac ? "<kbd>⌘</kbd><kbd>↵</kbd>" : "<kbd>Ctrl</kbd><kbd>↵</kbd>";
        first.appendChild(hint);
    }
}

function getPowerupLabel(powerup) {
    if (powerup.type === "search") return "Search";
    if (powerup.type === "app") return "Open App";
    return powerup.type ?? "Action";
}

function activatePowerup(powerup) {
    // App powerups open the URL and close this new-tab page.
    // The delay gives the OS time to dispatch the protocol handler before the tab is removed.
    if (powerup.type === "app") {
        chrome.tabs.getCurrent((tab) => {
            window.location.href = powerup.url;
            setTimeout(() => { if (tab) chrome.tabs.remove(tab.id); }, 500);
        });
        return;
    }

    activePowerup = powerup;
    powerupChip.textContent = powerup.name;
    if (powerup.color) {
        powerupChip.classList.add("powerup-chip--colored");
        powerupChip.style.setProperty("--powerup-color", powerup.color);
    }
    powerupChip.hidden = false;
    searchHint.hidden = true;
    searchInput.value = "";
    searchInput.placeholder = powerup.placeholder ?? `Search ${powerup.name}…`;
    suggestionsList.innerHTML = "";
    currentIndex = -1;
    searchInput.focus();
}

function deactivatePowerup() {
    activePowerup = null;
    powerupChip.hidden = true;
    searchHint.hidden = false;
    powerupChip.textContent = "";
    powerupChip.classList.remove("powerup-chip--colored");
    powerupChip.style.removeProperty("--powerup-color");
    searchInput.value = "";
    searchInput.placeholder = "Search or enter URL";
    suggestionsList.innerHTML = "";
    currentIndex = -1;
}

function handleKeyNavigation(event) {
    // --- Powerup mode ---
    if (activePowerup) {
        if (event.key === "Escape") {
            deactivatePowerup();
            return;
        }
        if (event.key === "Backspace" && searchInput.value === "") {
            deactivatePowerup();
            return;
        }
        if (event.key === "Enter") {
            event.preventDefault();
            const query = searchInput.value.trim();
            if (!query) return;
            const url = buildPowerupUrl(activePowerup, query);
            if (url) openUrl(url);
            return;
        }
        return;
    }

    // --- Normal mode ---
    const items = suggestionsList.querySelectorAll("li");

    if (event.key === "ArrowDown" || (event.key === "Tab" && !event.shiftKey)) {
        if (items.length === 0) return;
        if (currentIndex === -1) originalQuery = searchInput.value.trim();
        currentIndex = (currentIndex + 1) % items.length;
        updateHighlight();
        event.preventDefault();
        return;
    }

    if (event.key === "ArrowUp" || (event.key === "Tab" && event.shiftKey)) {
        if (items.length === 0) return;
        if (currentIndex === -1) originalQuery = searchInput.value.trim();
        currentIndex = (currentIndex - 1 + items.length) % items.length;
        updateHighlight();
        event.preventDefault();
        return;
    }

    if (event.key === "Escape") {
        suggestionsList.innerHTML = "";
        currentIndex = -1;
        return;
    }

    if (event.key === "Enter") {
        event.preventDefault();

        // Cmd+Enter (Mac) / Ctrl+Enter (Windows): open first suggestion without arrowing.
        if (
            (isMac ? event.metaKey : event.ctrlKey) &&
            (currentIndex < 0 || currentIndex >= items.length) &&
            items.length > 0
        ) {
            activateSuggestion(items[0]);
            return;
        }

        // Highlighted suggestion.
        if (currentIndex >= 0 && currentIndex < items.length) {
            activateSuggestion(items[currentIndex]);
            return;
        }

        // No suggestion selected — treat as URL or search query.
        const raw = searchInput.value.trim();
        if (!raw) return;

        const url = normalizeToUrlIfPossible(raw);
        if (url) {
            openUrl(url);
            return;
        }

        searchWrapper.classList.add("loading");
        chrome.search.query({ text: raw, disposition: "CURRENT_TAB" });
    }
}

function activateSuggestion(li) {
    if (li._powerup) {
        activatePowerup(li._powerup);
    } else {
        openUrl(li.dataset.url);
    }
}

function updateHighlight() {
    const items = suggestionsList.querySelectorAll("li");
    items.forEach((item, index) => {
        item.classList.toggle("highlight", index === currentIndex);
    });
    searchInput.value = originalQuery;
}

function buildPowerupUrl(powerup, query) {
    if (powerup.type === "search") {
        return powerup.url.replace("{search}", encodeURIComponent(query));
    }
    return null;
}

// Configure button — copies an editor command for the linked config.json to clipboard.
// Only shown when a config directory is linked.
const configureBtn = document.getElementById("configure-btn");
configureBtn.addEventListener("click", () => {
    const editor = config.editor ?? "nano";
    chrome.storage.local.get(["linkedConfigDirPath"], (result) => {
        const dirPath = result.linkedConfigDirPath;
        if (!dirPath) {
            setDevBtnFeedback(configureBtn, "No config dir linked", 2000);
            return;
        }
        chrome.runtime.getPlatformInfo((info) => {
            const sep = info.os === "win" ? "\\" : "/";
            navigator.clipboard.writeText(`${editor} ${dirPath}${sep}config.json`).then(() => {
                setDevBtnFeedback(configureBtn, "Copied — paste in terminal", 2000);
            });
        });
    });
});

// Reload button — opens the Extensions page for this extension.
const reloadBtn = document.getElementById("reload-btn");
reloadBtn.addEventListener("click", () => {
    chrome.tabs.create({ url: "chrome://extensions/?id=" + chrome.runtime.id });
});

// Link config dir button — lets power users point the extension at a local
// config directory (e.g. ~/.config/better-tab/) so their config.js is read
// from there instead of the bundled copy.
const linkConfigBtn = document.getElementById("link-config-btn");

async function updateLinkBtn() {
    // chrome.storage is the fast, reliable source for whether a dir is linked.
    // IndexedDB dir name is a bonus for the tooltip.
    const linkedPath = await new Promise(resolve =>
        chrome.storage.local.get(["linkedConfigDirPath"], (r) => resolve(r.linkedConfigDirPath ?? null))
    );
    const dirName = linkedPath
        ? await BetterTabFileConfig.getDirName().catch(() => null)
        : null;

    if (linkedPath) {
        const sep = linkedPath.includes("\\") ? "\\" : "/";
        const label = dirName ?? linkedPath.split(sep).pop();
        linkConfigBtn.title = `"${label}" linked — click to unlink`;
        configureBtn.hidden = false;
    } else {
        chrome.runtime.getPlatformInfo((info) => {
            const defaultPath = info.os === "win"
                ? "%APPDATA%\\better-tab"
                : "~/.config/better-tab";
            linkConfigBtn.title = `Link config directory (${defaultPath})`;
        });
        configureBtn.hidden = true;
    }
}

if (linkConfigBtn && typeof BetterTabFileConfig !== "undefined") {
    updateLinkBtn();
    linkConfigBtn.addEventListener("click", async () => {
        const linked = await BetterTabFileConfig.isLinked().catch(() => false);
        if (linked) {
            if (!confirm("Unlink config directory? Better Tab will fall back to its built-in defaults.")) return;
            await BetterTabFileConfig.unlink();
            await new Promise(resolve => chrome.storage.local.remove("linkedConfigDirPath", resolve));
            setDevBtnFeedback(linkConfigBtn, "Unlinked", 2000);
            await updateLinkBtn();
        } else {
            try {
                const { configCreated } = await BetterTabFileConfig.link();
                const dirName = await BetterTabFileConfig.getDirName();
                const platformInfo = await new Promise(resolve => chrome.runtime.getPlatformInfo(resolve));
                const defaultPath = platformInfo.os === "win"
                    ? `%APPDATA%\\${dirName}`
                    : `~/.config/${dirName}`;
                const dirPath = window.prompt(
                    `Enter the full path to the "${dirName}" directory (used for the Edit config button):`,
                    defaultPath
                );
                if (dirPath) {
                    await new Promise(resolve => chrome.storage.local.set({ linkedConfigDirPath: dirPath }, resolve));
                }
                const msg = configCreated ? "config.json created — reload to apply" : "Linked — reload to apply";
                setDevBtnFeedback(linkConfigBtn, msg, 3000);
                await updateLinkBtn();
            } catch (err) {
                // User cancelled the picker (AbortError) — don't show an error.
                if (err?.name !== "AbortError") {
                    setDevBtnFeedback(linkConfigBtn, "Failed to link", 2000);
                }
            }
        }
    });
}

// Retry loading the file config on the first user interaction.
// After an extension reload, the File System Access permission is cleared and
// requestPermission() requires a user gesture — a keypress or click qualifies.
if (typeof BetterTabFileConfig !== "undefined") {
    const onFirstInteraction = () => {
        applyFileConfig().catch(() => {});
        window.removeEventListener("keydown", onFirstInteraction, true);
        window.removeEventListener("pointerdown", onFirstInteraction, true);
    };
    window.addEventListener("keydown", onFirstInteraction, true);
    window.addEventListener("pointerdown", onFirstInteraction, true);
}

function setDevBtnFeedback(btn, message, duration) {
    const original = btn.innerHTML;
    btn.textContent = message;
    setTimeout(() => { btn.innerHTML = original; }, duration);
}

function openUrl(url) {
    if (!url) return;
    searchWrapper.classList.add("loading");
    window.open(url, "_self");
}

function normalizeToUrlIfPossible(input) {
    // Anything with whitespace is a search query, not a URL.
    if (/\s/.test(input)) return null;

    // If it already looks like a URL with scheme, accept it.
    if (/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(input)) {
        try {
            return new URL(input).toString();
        } catch {
            return null;
        }
    }

    // If it looks like a domain or localhost, assume https:// (or http:// for localhost).
    const looksLikeDomain =
        input.includes(".") ||
        input.startsWith("localhost") ||
        /^[0-9.]+(:\d+)?(\/.*)?$/.test(input);

    if (!looksLikeDomain) return null;

    const scheme =
        input.startsWith("localhost") || input.startsWith("127.0.0.1")
            ? "http://"
            : "https://";

    try {
        return new URL(scheme + input).toString();
    } catch {
        return null;
    }
}
