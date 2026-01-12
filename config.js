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
            {
                name: "Ctrl Console",
                url: "https://ctrl.lindisfarne.nsw.edu.au",
                tags: ["endpoints", "devices", "management"],
            },
            {
                name: "YouTube",
                url: "https://youtube.com",
                tags: [],
            },
            {
                name: "YouTube",
                url: "https://youtube.com",
                tags: [],
            },
            {
                name: "Notes",
                url: "https://jesse.notes.thewatsons.online",
                tags: ["silverbullet", "markdown"],
            },
            {
                name: "Wedding Admin",
                url: "https://jesseandzoelle.weddings.thewatsons.online/admin/af904378ynvhfq9834hntkn",
                tags: ["invites"],
            },
            {
                name: "Lindisfarne Wiki",
                url: "https://wiki.lindisfarne.nsw.edu.au",
                tags: [""],
            },
            {
                name: "Lindisfarne Wiki (Editor)",
                url: "https://editor.wiki.lindisfarne.nsw.edu.au",
                tags: [""],
            },
            {
                name: "Shelly Cloud",
                url: "https://control.shelly.cloud",
                tags: ["lights", "blinds", "management"],
            },
            {
                name: "Canva",
                url: "https://canva.com/projects",
                tags: ["design"],
            },
            {
                name: "Image to Base64 Converter",
                url: "https://www.base64-image.de/",
                tags: ["utility", "utilities", "tools"],
            },
            {
                name: "Freshservice",
                url: "https://helpdesk.lindisfarne.nsw.edu.au/a/tickets/view/331620",
                tags: ["tickets", "support"],
            },
        ],
    };
})();
