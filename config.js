// Global configuration for Better Tab.
//
// This file is intentionally a plain script (no `import`, no `export`, no `fetch`).
// It defines a single global `window.BETTER_TAB_CONFIG` read by the extension.
//
// After editing, reload the extension from chrome://extensions to apply changes.

(function () {
    window.BETTER_TAB_CONFIG = {

        // ── Editor ────────────────────────────────────────────────────────────
        // The "Edit config" button copies a ready-to-run terminal command.
        // Set configPath to the absolute path of this file on disk.
        // editor: the terminal editor to open it with (nvim, vim, nano, code…).
        configPath: "",
        editor: "nvim",

        // ── Theme ─────────────────────────────────────────────────────────────
        // "system" (default) | "dark" | "light"
        // theme: "system",

        // Theme for the browser action popup.
        // "match" (default) | "system" | "dark" | "light"
        // popupTheme: "match",

        // ── Wallpaper ─────────────────────────────────────────────────────────
        // Place a wallpaper.jpg or wallpaper.png in the extension folder and
        // set the filename here. Leave commented out to use the gradient.
        // wallpaper: "wallpaper.jpg",

        // ── Clock ─────────────────────────────────────────────────────────────
        // showClock: true,
        // clockFormat: "12h",   // "12h" (default) | "24h"
        // clockSize: "md",      // "xs" | "sm" | "md" (default) | "lg" | "xl" | "2xl" | "3xl"

        // ── Search ────────────────────────────────────────────────────────────
        // Base URL for the default search engine. The query is appended as ?q=…
        // DuckDuckGo: https://duckduckgo.com/
        // Google:     https://www.google.com/search
        searchEngineBaseUrl: "https://duckduckgo.com/",

        // Fetch autocomplete suggestions from DuckDuckGo while typing.
        // searchSuggestions: true,

        // ── Bookmarks ─────────────────────────────────────────────────────────
        // Each entry: { name, url, tags? }
        // Bookmarks can also be saved via the browser action popup (pin icon).
        bookmarks: [
            {
                name: "GitHub",
                url: "https://github.com",
                tags: ["code", "dev"],
            },
            {
                name: "Gmail",
                url: "https://mail.google.com",
                tags: ["email", "google"],
            },
            {
                name: "Google Drive",
                url: "https://drive.google.com",
                tags: ["files", "google"],
            },
            {
                name: "YouTube",
                url: "https://youtube.com",
                tags: ["video"],
            },
            {
                name: "Notion",
                url: "https://notion.so",
                tags: ["notes", "docs"],
            },
            {
                name: "Linear",
                url: "https://linear.app",
                tags: ["tasks", "dev"],
            },
            {
                name: "Figma",
                url: "https://figma.com",
                tags: ["design"],
            },
        ],

        // ── Powerups ──────────────────────────────────────────────────────────
        // Interactive suggestions that activate a special mode when selected.
        //
        // Common fields:
        //   name        Display name shown in the suggestion list and chip.
        //   type        "search" | "app"
        //   tags        Matched the same way as bookmark tags.
        //   promoted    Default true. Set false to sort below bookmarks.
        //   color       Optional CSS colour for the chip/badge accent.
        //
        // type: "search"
        //   url         URL template — use {search} as the query placeholder.
        //   placeholder Optional text shown in the search input when active.
        //               Defaults to "Search <name>…".
        //
        // type: "app"
        //   url         App URL scheme (e.g. "claude://"). Opens immediately
        //               and closes the new-tab page. Find a scheme in the app's
        //               Info.plist under CFBundleURLTypes, or search online for
        //               "<AppName> URL scheme".
        powerups: [
            {
                name: "YouTube",
                type: "search",
                url: "https://www.youtube.com/results?search_query={search}",
                tags: ["video"],
                color: "#ff0000",
            },
            {
                name: "GitHub",
                type: "search",
                url: "https://github.com/search?q={search}",
                tags: ["code", "dev"],
                color: "#6e76f0",
            },
            {
                name: "Google Maps",
                type: "search",
                url: "https://www.google.com/maps/search/{search}",
                tags: ["maps", "places"],
                color: "#34a853",
            },
            // Example app powerup — replace with your own:
            // {
            //     name: "Claude",
            //     type: "app",
            //     url: "claude://",
            //     color: "#cc785c",
            // },
        ],
    };
})();
