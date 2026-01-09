// Global configuration for Better Tab (works under `file://`).
//
// This file is intentionally a classic script (no `import`, no `export`, no `fetch`).
// It defines a single global object `window.BETTER_TAB_CONFIG` that `script.js` can read.

(function () {
    window.BETTER_TAB_CONFIG = {
        /**
         * Base URL for search. The app will append `?q=<query>`.
         * Examples:
         * - DuckDuckGo: https://duckduckgo.com/
         * - Google:     https://www.google.com/search
         */
        searchEngineBaseUrl: "https://duckduckgo.com/",

        /**
         * Bookmarks used for suggestions.
         * Each entry: { name: string, url: string, tags?: string[] }
         */
        bookmarks: [
            {
                name: "Gmail",
                url: "https://mail.google.com",
                tags: ["email", "google"],
            },
            {
                name: "Google Chat",
                url: "https://chat.google.com",
                tags: ["chat", "google", "messaging"],
            },
            {
                name: "Jamf Pro",
                url: "https://casper.lindisfarne.nsw.edu.au:8443",
                tags: ["mdm", "apple", "device-management", "admin"],
            },
            {
                name: "Horizon",
                url: "https://horizon.lindisfarne.nsw.edu.au",
                tags: ["network", "admin"],
            },
        ],
    };
})();
