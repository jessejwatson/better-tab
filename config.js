// Global configuration for Better Tab (works under `file://`).
//
// This file is intentionally a classic script (no `import`, no `export`, no `fetch`).
// It defines a single global object `window.BETTER_TAB_CONFIG` that `script.js` can read.

(function () {
    window.BETTER_TAB_CONFIG = {
        /**
         * Configure button — clicking it copies a ready-to-run command to your
         * clipboard so you can open this file in your terminal editor.
         * Set configPath to the absolute path of this file on disk.
         * Set editor to your preferred terminal editor (nvim, vim, nano, etc.).
         */
        configPath: "/Users/jesse.watson/Developer/projects/better-tab/config.js",
        editor: "nvim",

        /**
         * Optional wallpaper image (relative to the extension root).
         * Supported: "wallpaper.png", "wallpaper.jpg", or any valid path.
         * Omit or set to undefined to use the default gradient background.
         */
        wallpaper: "wallpaper.png",

        /**
         * Color theme. Options:
         *   "system"  — follow the OS preference (default)
         *   "dark"    — always dark
         *   "light"   — always light
         */
        theme: "dark",

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
                url: "https://horizon.lindisfarne.nsw.edu.au/portal/webclient/#/home",
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
                tags: ["video", "entertainment"],
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
                name: "Base64 to Image Converter",
                url: "https://base64.guru/converter/decode/image",
                tags: ["utility", "utilities", "tools"],
            },
            {
                name: "Freshservice",
                url: "https://helpdesk.lindisfarne.nsw.edu.au/a/tickets/view/344921",
                tags: ["tickets", "support"],
            },
            {
                name: "Unifi (Mahers Lane)",
                url: "https://unifi.ml.lindisfarne.nsw.edu.au:11443",
                tags: ["network", "management", "switch", "access point", "ap"],
            },
            {
                name: "Unifi (Sunshine Ave)",
                url: "https://unifi.sa.lindisfarne.nsw.edu.au:11443",
                tags: ["network", "management", "switch", "access point", "ap"],
            },
            {
                name: "Ruckus Switch Management",
                url: "https://dev.lindisfarne.nsw.edu.au/switch/switch.htm",
                tags: ["network", "management", "switch", "access point", "ap"],
            },
            {
                name: "vSphere",
                url: "https://vcenter.lindisfarne.nsw.edu.au/ui/app/folder;nav=h/urn:vmomi:Folder:group-d1:a53a682a-9c0b-4e5f-8e40-67ee1fe7c33c/summary",
                tags: ["vm", "virtual machine", "management"],
            },
            {
                name: "TassWeb",
                url: "https://tassweb.lindisfarne.nsw.edu.au/tassweb",
                tags: ["management", "kiosk"],
            },
            {
                name: "Kiosk",
                url: "https://tassweb.lindisfarne.nsw.edu.au/kiosk",
                tags: ["management", "tass"],
            },
            {
                name: "Google Admin",
                url: "https://admin.google.com",
                tags: ["management"],
            },
            {
                name: "SEQTA Teach",
                url: "https://teach.lindisfarne.nsw.edu.au",
                tags: ["management", "school"],
            },
            {
                name: "2026 Homeroom & Tutor Group Allocations",
                url: "https://docs.google.com/document/d/1RCAp4N_YRbPbUXDPk6j72WOGQeWpQxYW-yOGKzVOsEo/edit?tab=t.0#heading=h.cy62ily17m8l",
                tags: ["leadership", "school"],
            },
            {
                name: "Visualisation - Firewall Traffic",
                url: "https://vis.lindisfarne.nsw.edu.au/firewall-interface-usage-daily.htm",
                tags: ["data", "monitor", "firewall"],
            },
            {
                name: "Visualisation - Mahers Lane Solar",
                url: "https://vis.lindisfarne.nsw.edu.au/map-mahers-solar.htm",
                tags: ["data", "monitor"],
            },
            {
                name: "Visualisation - Bus Usage Map",
                url: "https://vis.lindisfarne.nsw.edu.au/map-bus-usage-zoom.htm",
                tags: ["data", "monitor"],
            },
            {
                name: "Visualisation - Loaned Student Devices",
                url: "https://vis.lindisfarne.nsw.edu.au/student-devices.htm",
                tags: ["data", "monitor"],
            },
            {
                name: "Palo Alto (Mahers Lane)",
                url: "https://paloalto.ml.lindisfarne.nsw.edu.au/",
                tags: ["data", "monitor", "firewall"],
            },
            {
                name: "Palo Alto (Sunshine Avenue)",
                url: "https://paloalto.sa.lindisfarne.nsw.edu.au/",
                tags: ["data", "monitor", "firewall"],
            },
            {
                name: "Bells - Mediastream (Mahers Lane)",
                url: "http://bells.ml.lindisfarne.nsw.edu.au/mediastream.htm",
                tags: ["management", "schedule"],
            },
            {
                name: "Bells - Mediastream (Sunshine Avenue)",
                url: "http://bells.sa.lindisfarne.nsw.edu.au/mediastream.htm",
                tags: ["management", "schedule"],
            },
            {
                name: "Linewize",
                url: "https://au.linewizefilter.qoria.cloud/surfwize/dashboard",
                tags: ["management", "security", "network"],
            },
            {
                name: "Cred",
                url: "https://app.lindisfarne.nsw.edu.au/cred/",
                tags: ["management", "security", "password", "credentials"],
            },
            {
                name: "Shelly Management",
                url: "https://flows.lindisfarne.nsw.edu.au/shelly/index.htm",
                tags: ["management", "light", "blind"],
            },
            {
                name: "Shelly Control",
                url: "https://flows.lindisfarne.nsw.edu.au/shelly/control.htm",
                tags: ["light", "blind"],
            },
            {
                name: "Jamf Protect",
                url: "https://lindisfarne.protect.jamfcloud.com",
                tags: ["computers", "devices", "management", "alerts"],
            },
            {
                name: "Traefik Dashboard (docker-api)",
                url: "https://docker-api.lindisfarne.nsw.edu.au/dashboard/",
                tags: [],
            },
            {
                name: "Google Cloud",
                url: "https://console.cloud.google.com",
                tags: ["management"],
            },
            {
                name: "CCTV Alerting Config",
                url: "https://flows.lindisfarne.nsw.edu.au/cctv-alerting-config/",
                tags: ["management", "camera"],
            },
        ],

        /**
         * Powerups — interactive suggestions that activate a mode when selected.
         *
         * Common fields:
         *   name        {string}   Display name (shown in suggestion list and chip).
         *   type        {string}   Powerup type. Currently supported: "search".
         *   tags        {string[]} Optional. Matched the same way as bookmark tags.
         *   promoted    {boolean}  Default true. Set to false to sort alongside
         *                          bookmarks instead of above them.
         *   placeholder {string}   Optional. Overrides the input placeholder shown
         *                          when this powerup is active. Defaults to
         *                          "Search <name>…".
         *
         * Type: "search"
         *   url  {string}  URL template. Use {search} as the placeholder for the
         *                  query (it will be URL-encoded automatically).
         *
         * Type: "app"
         *   url  {string}  The app's registered URL scheme (e.g. "claude://").
         *                  Selecting the powerup opens it immediately — no chip
         *                  or query step. Find an app's scheme in its Info.plist
         *                  under CFBundleURLTypes, or search "<AppName> URL scheme".
         */
        powerups: [
            {
                name: "Claude",
                type: "app",
                url: "claude://",
                color: "#cc785c",
            },
            {
                name: "YouTube",
                type: "search",
                url: "https://www.youtube.com/results?search_query={search}",
                tags: ["video", "entertainment"],
                color: "#ff0000",
            },
            {
                name: "Google Admin - Users",
                type: "search",
                url: "https://admin.google.com/ac/search?query={search}&tab=ALL",
                tags: ["management"],
            },
            {
                name: "Jamf Pro - Computers",
                type: "search",
                url: "https://casper.lindisfarne.nsw.edu.au:8443/computers.html?query={search}&queryType=COMPUTERS&version=",
                tags: ["mdm", "apple", "device-management", "admin"],
                promoted: false,
            },
            {
                name: "Jamf Pro - Mobile Devices",
                type: "search",
                url: "https://casper.lindisfarne.nsw.edu.au:8443/mobileDevices.html?query={search}&queryType=MOBILEDEVICES&version=",
                tags: ["mdm", "apple", "device-management", "admin"],
                promoted: false,
            },
            {
                name: "Blue Iris Dashboards",
                type: "search",
                url: "https://blueiris.lindisfarne.nsw.edu.au:600{search}",
                tags: ["monitoring", "cameras"],
                placeholder: "Enter server number...",
            },
            {
                name: "Search Notes",
                type: "search",
                url: "https://jesse.notes.thewatsons.online/search%3A{search}",
                tags: [],
            },
            {
                name: "Search GitHub Repos",
                type: "search",
                url: "https://github.com/?q={search}",
                tags: ["version control"],
            },
        ],
    };
})();
