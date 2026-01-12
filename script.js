/**
 * Configuration is loaded from `config.js` via the global `window.BETTER_TAB_CONFIG`.
 * This keeps the app working under `file://` (no imports / no fetch).
 */
const config = window.BETTER_TAB_CONFIG ?? {
    searchEngineBaseUrl: "https://duckduckgo.com/",
    bookmarks: [],
};

const searchInput = document.getElementById("search");
const suggestionsList = document.getElementById("suggestions");

let bookmarks = Array.isArray(config.bookmarks) ? config.bookmarks : [];
let currentIndex = -1;

searchInput.addEventListener("input", updateSuggestions);
searchInput.addEventListener("keydown", handleKeyNavigation);

function updateSuggestions() {
    const query = searchInput.value.trim().toLowerCase();
    suggestionsList.innerHTML = "";
    currentIndex = -1;

    if (!query) return;

    // Prioritise matches in `name` over matches in `tags`.
    // Score: 2 = name match, 1 = tags match, 0 = no match.
    const scored = bookmarks
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

            return { bookmark, score };
        })
        .filter((x) => x.score > 0)
        .sort((a, b) => {
            // Higher score first (name matches before tag matches).
            if (b.score !== a.score) return b.score - a.score;

            // Tie-breaker: alphabetical by name for stable-ish ordering.
            const an = (a.bookmark?.name ?? "").toString();
            const bn = (b.bookmark?.name ?? "").toString();
            return an.localeCompare(bn);
        });

    scored.forEach(({ bookmark }) => {
        const li = document.createElement("li");
        li.textContent = bookmark.name;
        li.dataset.url = bookmark.url;

        li.addEventListener("mousedown", (e) => {
            // Prevent the input losing focus before navigation fires.
            e.preventDefault();
        });

        li.addEventListener("click", () => openUrl(bookmark.url));

        suggestionsList.appendChild(li);
    });
}

function handleKeyNavigation(event) {
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

        // Cmd+Enter: if nothing is selected yet, open the first suggestion (if any).
        // If something is selected, Cmd shouldn't change behavior.
        if (
            event.metaKey &&
            (currentIndex < 0 || currentIndex >= items.length) &&
            items.length > 0
        ) {
            const url = items[0].dataset.url;
            openUrl(url);
            return;
        }

        // If a suggestion is highlighted, open it.
        if (currentIndex >= 0 && currentIndex < items.length) {
            const url = items[currentIndex].dataset.url;
            openUrl(url);
            return;
        }

        // Otherwise, treat input as URL-ish or search query.
        const raw = searchInput.value.trim();
        if (!raw) return;

        const url = normalizeToUrlIfPossible(raw);
        if (url) {
            openUrl(url);
            return;
        }

        const engine = getSearchEngineBaseUrl();
        const target = buildSearchUrl(engine, raw);
        openUrl(target);
    }
}

function updateHighlight() {
    const items = suggestionsList.querySelectorAll("li");
    items.forEach((item, index) => {
        item.classList.toggle("highlight", index === currentIndex);
    });
}

function openUrl(url) {
    if (!url) return;
    window.open(url, "_self");
}

function getSearchEngineBaseUrl() {
    const base = (config?.searchEngineBaseUrl ?? "").toString().trim();
    return base || "https://duckduckgo.com/";
}

function buildSearchUrl(engineBaseUrl, query) {
    // If engine base is https://duckduckgo.com/ it supports ?q=...
    // If it's https://www.google.com/search it also supports ?q=...
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
    // This is a heuristic, not perfect.
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
