# Better Tab

A keyboard-driven new tab page for Chrome and Chromium browsers. Search bookmarks, trigger powerups, take markdown notes, and show a glassy clock — all without leaving the keyboard.

![Better Tab screenshot](screenshot.png)

---

## Features

- **Instant bookmark search** — fuzzy match by name or tag as you type
- **Powerups** — search-mode shortcuts (e.g. search YouTube, GitHub) and app launchers
- **Search suggestions** — DuckDuckGo autocomplete appears below your bookmarks
- **Markdown notes** — a toggleable panel with live preview, task checkboxes, and persistent storage
- **Glassy clock** — configurable size and 12h/24h format, liquid glass aesthetic
- **Wallpaper support** — use any image as a background, with a hold-to-peek shortcut
- **Themes** — dark, light, or follow the OS
- **Browser action popup** — save the current page as a bookmark or append it to your notes

---

## Installation

Better Tab is a local Chrome extension (not on the Web Store). You load it directly from the folder.

1. **Download or clone** this repository

    ```
    git clone https://github.com/your-username/better-tab.git
    ```

2. **Copy the example config**

    ```
    cp config.example.js config.js
    ```

    Then edit `config.js` with your bookmarks and preferences (see [Configuration](#configuration) below).

3. **Add an icon**  
   Place a `icon.png` (128×128px recommended) in the extension folder.

4. **Load the extension**
    - Open `chrome://extensions`
    - Enable **Developer mode** (top right)
    - Click **Load unpacked** and select the extension folder

5. Open a new tab — Better Tab will load automatically.

> **Note:** After editing `config.js`, click the reload button on `chrome://extensions` (or use the **Reload extension** button at the bottom-right of the new tab page).

---

## Configuration

All configuration lives in `config.js` (copied from `config.example.js`). The file is excluded from git so your personal bookmarks and paths stay private.

### Editor

```js
configPath: "/absolute/path/to/config.js",
editor: "nvim",   // nvim | vim | nano | code | etc.
```

The **Edit config** button copies a terminal command that opens this file in your editor.

### Theme

```js
theme: "system",      // "system" (default) | "dark" | "light"
popupTheme: "match",  // "match" (default) | "system" | "dark" | "light"
```

### Wallpaper

Place an image in the extension folder and reference it:

```js
wallpaper: "wallpaper.jpg",
```

Hold `Ctrl+H` to temporarily hide all UI and see the wallpaper full-screen.

### Clock

```js
showClock: true,
clockFormat: "12h",  // "12h" (default) | "24h"
clockSize: "md",     // "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl"
```

### Search

```js
searchEngineBaseUrl: "https://duckduckgo.com/",
searchSuggestions: true,
```

### Bookmarks

```js
bookmarks: [
    { name: "GitHub", url: "https://github.com", tags: ["code", "dev"] },
    { name: "Gmail",  url: "https://mail.google.com", tags: ["email"] },
],
```

Bookmarks can also be added live via the browser action popup (the extension icon in your toolbar).

### Powerups

Powerups appear in the suggestion list and activate a special mode when selected.

**Search powerup** — activates a scoped search chip:

```js
{
    name: "YouTube",
    type: "search",
    url: "https://www.youtube.com/results?search_query={search}",
    tags: ["video"],
    color: "#ff0000",          // optional accent colour
    placeholder: "Search YouTube…", // optional, overrides default
    promoted: true,            // default true — sorts above bookmarks
}
```

**App powerup** — opens the app immediately and closes the new tab:

```js
{
    name: "Claude",
    type: "app",
    url: "claude://",
    color: "#cc785c",
}
```

---

## Keyboard Shortcuts

| Shortcut                         | Action                           |
| -------------------------------- | -------------------------------- |
| Type                             | Search bookmarks and powerups    |
| `↑` / `↓` or `Tab` / `Shift+Tab` | Navigate suggestions             |
| `Enter`                          | Open highlighted result          |
| `Cmd+Enter`                      | Open first result                |
| `Escape` / `Backspace`           | Dismiss / deactivate powerup     |
| `Ctrl+S`                         | Focus search from anywhere       |
| `Ctrl+N`                         | Open notes / focus textarea      |
| `Ctrl+Shift+N`                   | Toggle notes panel               |
| `Ctrl+H` (hold)                  | Peek at wallpaper — hides all UI |

---

## Notes

The notes panel supports Markdown including headings, lists, task checkboxes, bold/italic, code, links, and blockquotes. Task checkboxes are interactive in preview mode. Notes are persisted in `chrome.storage.local`.

---

## Privacy

- No data is sent anywhere except DuckDuckGo autocomplete requests (when `searchSuggestions` is enabled, can be disabled).
- Bookmarks and notes are stored locally in `chrome.storage.local`.
