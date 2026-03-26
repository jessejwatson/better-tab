/**
 * Configuration is loaded from `config.js` via the global `window.BETTER_TAB_CONFIG`.
 * This keeps the app working under `file://` (no imports / no fetch).
 */
const config = window.BETTER_TAB_CONFIG ?? {
    searchEngineBaseUrl: "https://duckduckgo.com/",
    bookmarks: [],
    powerups: [],
};

const searchInput = document.getElementById("search");
const suggestionsList = document.getElementById("suggestions");
const searchWrapper = document.getElementById("search-wrapper");
const powerupChip = document.getElementById("active-powerup");

// Chrome enforces address-bar focus for new tabs at the browser level —
// page JavaScript cannot override it, even inside an extension.
// Workaround: press Escape to release the address bar, which returns focus
// to the page and triggers the listener below.
searchInput.focus();
window.addEventListener("focus", () => searchInput.focus());

let bookmarks = Array.isArray(config.bookmarks) ? config.bookmarks : [];
let powerups = Array.isArray(config.powerups) ? config.powerups : [];
let currentIndex = -1;
let activePowerup = null;

searchInput.addEventListener("input", handleInput);
searchInput.addEventListener("keydown", handleKeyNavigation);

function handleInput() {
    if (activePowerup) {
        // In powerup mode the input is the search query — don't show suggestions.
        suggestionsList.innerHTML = "";
        return;
    }
    updateSuggestions();
}

function updateSuggestions() {
    const query = searchInput.value.trim().toLowerCase();
    suggestionsList.innerHTML = "";
    currentIndex = -1;

    if (!query) return;

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

    all.forEach(({ item, type }, index) => {
        const li = document.createElement("li");

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

        if (index === 0) {
            const hint = document.createElement("span");
            hint.className = "cmd-hint";
            hint.innerHTML = "<kbd>⌘</kbd><kbd>↵</kbd>";
            li.appendChild(hint);
        }

        suggestionsList.appendChild(li);
    });
}

function getPowerupLabel(powerup) {
    if (powerup.type === "search") return "Search";
    if (powerup.type === "app") return "Open App";
    return powerup.type ?? "Action";
}

function activatePowerup(powerup) {
    // App powerups open immediately and close the tab.
    if (powerup.type === "app") {
        window.location.href = powerup.url;
        chrome.tabs.getCurrent((tab) => chrome.tabs.remove(tab.id));
        return;
    }

    activePowerup = powerup;
    powerupChip.textContent = powerup.name;
    if (powerup.color) {
        powerupChip.classList.add("powerup-chip--colored");
        powerupChip.style.setProperty("--powerup-color", powerup.color);
    }
    powerupChip.hidden = false;
    searchInput.value = "";
    searchInput.placeholder = powerup.placeholder ?? `Search ${powerup.name}…`;
    suggestionsList.innerHTML = "";
    currentIndex = -1;
    searchInput.focus();
}

function deactivatePowerup() {
    activePowerup = null;
    powerupChip.hidden = true;
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

    if (event.key === "ArrowDown") {
        if (items.length === 0) return;
        currentIndex = (currentIndex + 1) % items.length;
        updateHighlight();
        event.preventDefault();
        return;
    }

    if (event.key === "ArrowUp") {
        if (items.length === 0) return;
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

        // Cmd+Enter: open first suggestion (or activate first powerup) without arrowing.
        if (
            event.metaKey &&
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

        openUrl(buildSearchUrl(getSearchEngineBaseUrl(), raw));
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
}

function buildPowerupUrl(powerup, query) {
    if (powerup.type === "search") {
        return powerup.url.replace("{search}", encodeURIComponent(query));
    }
    return null;
}

// Configure button — copies the editor command to clipboard.
const configureBtn = document.getElementById("configure-btn");
configureBtn.addEventListener("click", () => {
    const path = config.configPath;
    const editor = config.editor ?? "nvim";

    if (!path) {
        setDevBtnFeedback(configureBtn, "Set configPath in config.js", 2500);
        return;
    }

    navigator.clipboard.writeText(`${editor} "${path}"`).then(() => {
        setDevBtnFeedback(configureBtn, "Copied — paste in terminal", 2000);
    });
});

// Reload button — opens the Extensions page for this extension.
const reloadBtn = document.getElementById("reload-btn");
reloadBtn.addEventListener("click", () => {
    chrome.tabs.create({ url: "chrome://extensions/?id=" + chrome.runtime.id });
});

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

function getSearchEngineBaseUrl() {
    const base = (config?.searchEngineBaseUrl ?? "").toString().trim();
    return base || "https://duckduckgo.com/";
}

function buildSearchUrl(engineBaseUrl, query) {
    const u = new URL(engineBaseUrl, window.location.href);
    u.searchParams.set("q", query);
    return u.toString();
}

function normalizeToUrlIfPossible(input) {
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
