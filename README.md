# Better Tab

A keyboard-driven new tab page for Chrome and Chromium browsers. Search bookmarks, trigger powerups, take markdown notes, and show a glassy clock — all without leaving the keyboard.

---

## Features

- **Instant bookmark search** — fuzzy match by name or tag as you type
- **Powerups** — search-mode shortcuts (e.g. search YouTube, Google Maps) and app launchers
- **Search suggestions** — DuckDuckGo autocomplete appears below your bookmarks
- **Markdown notes** — a toggleable panel with live preview, task checkboxes, and persistent storage
- **Glassy clock** — configurable size and 12h/24h format, liquid glass aesthetic
- **Wallpaper support** — use any image as a background, with a hold-to-peek shortcut
- **Themes** — dark, light, or follow the OS
- **Dotfiles-style config** — opt-in link to a local config directory (e.g. `~/.config/better-tab/`) so your config lives in version control alongside your other dotfiles
- **Browser action popup** — save the current page as a bookmark or append it to your notes

---

## Installation

Better Tab is a local Chrome extension (not on the Web Store). You load it directly from the folder.

1. **Download or clone** this repository

    ```
    git clone https://github.com/your-username/better-tab.git
    ```

2. **Load the extension**
    - Open `chrome://extensions`
    - Enable **Developer mode** (top right)
    - Click **Load unpacked** and select the extension folder

3. Open a new tab — Better Tab will load automatically.

---

## Configuration

Better Tab has two configuration tiers:

| Tier                      | Who it's for           | How it works                                                         |
| ------------------------- | ---------------------- | -------------------------------------------------------------------- |
| **Chrome profile**        | Default for all users  | Bookmarks are stored in your Chrome profile                           |
| **Config directory**      | Power users / dotfiles | Link a local folder; changes apply on next new tab, no reload needed |

### Chrome profile

By default, all bookmarks are saved to your Chrome profile. This limits the features you have access to - use the "Config directory" option for custom theme logic, wallpaper, powerups, etc.

### Config directory (dotfiles-style)

Click the **folder icon** (bottom-right of the new tab page) to link a local directory. Better Tab will read three files from that directory:

| File             | Purpose                                                            |
| ---------------- | ------------------------------------------------------------------ |
| `config.json`    | All settings (JSONC — `//` comments and trailing commas supported) |
| `bookmarks.json` | Bookmark list (array)                                              |
| `powerups.json`  | Powerup list (array)                                               |

If the directory has no config files, Better Tab creates them from defaults on first link.

Changes to any of these files take effect the next time you open a new tab — no extension reload needed.

> **macOS default path:** `~/.config/better-tab/`  
> **Windows default path:** `%APPDATA%\better-tab\`

The **Edit config** button (pencil icon, only shown when a directory is linked) copies a ready-to-run terminal command to open `config.json` in your configured editor.

---

## Config reference

### Editor

```jsonc
"editor": "nvim"   // nvim | vim | nano | code | etc. Default: nano
```

### Theme

```jsonc
"theme": "system",      // "system" (default) | "dark" | "light"
"popupTheme": "match"   // "match" (default) | "system" | "dark" | "light"
```

### Wallpaper

**Config directory** — place the image in your config directory and reference it by filename. Better Tab resolves the path relative to the linked directory:

```jsonc
"wallpaper": "wallpaper.jpg"   // → ~/.config/better-tab/wallpaper.jpg
```

Hold `Ctrl+H` (Mac) or `Alt+H` (Windows) to temporarily hide all UI and see the wallpaper full-screen.

### Clock

```jsonc
"showClock": true,
"clockFormat": "12h",   // "12h" (default) | "24h"
"clockSize": "md"       // "xs" | "sm" | "md" (default) | "lg" | "xl" | "2xl" | "3xl"
```

### Search

```jsonc
"searchEngineBaseUrl": "https://duckduckgo.com/",
"searchSuggestions": true
```

### Bookmarks (`bookmarks.json`)

```json
[
    { "name": "GitHub", "url": "https://github.com", "tags": ["code", "dev"] },
    { "name": "Gmail", "url": "https://mail.google.com", "tags": ["email"] }
]
```

Bookmarks can also be added or removed live via the browser action popup (the extension icon in your toolbar). Popup-saved bookmarks are written back to `bookmarks.json` when a config directory is linked, keeping the file as the source of truth.

### Powerups (`powerups.json`)

Powerups appear in the suggestion list and activate a special mode when selected.

**Search powerup** — activates a scoped search chip:

```json
{
    "name": "YouTube",
    "type": "search",
    "url": "https://www.youtube.com/results?search_query={search}",
    "tags": ["video"],
    "color": "#ff0000",
    "placeholder": "Search YouTube…",
    "promoted": true
}
```

- `url` — use `{search}` as the placeholder for the query (URL-encoded automatically)
- `color` — optional hex accent colour for the chip
- `placeholder` — optional, overrides the default `Search <name>…` hint
- `promoted` — default `true`, sorts above bookmarks; set to `false` to sort alongside them

**App powerup** — opens the app immediately and closes the new tab:

```json
{
    "name": "Claude",
    "type": "app",
    "url": "claude://",
    "color": "#cc785c"
}
```

---

## Keyboard Shortcuts

Shortcuts are platform-aware — Mac uses `Ctrl`/`Cmd`, Windows uses `Alt`/`Ctrl`.

| Action                             | Mac                              | Windows                          |
| ---------------------------------- | -------------------------------- | -------------------------------- |
| Search bookmarks and powerups      | Type                             | Type                             |
| Navigate suggestions               | `↑` / `↓` or `Tab` / `Shift+Tab` | `↑` / `↓` or `Tab` / `Shift+Tab` |
| Open highlighted result            | `Enter`                          | `Enter`                          |
| Open first result without arrowing | `Cmd+Enter`                      | `Ctrl+Enter`                     |
| Dismiss / deactivate powerup       | `Escape` / `Backspace`           | `Escape` / `Backspace`           |
| Focus search from anywhere         | `Ctrl+S`                         | `Alt+S`                          |
| Open notes / focus textarea        | `Ctrl+N`                         | `Alt+N`                          |
| Toggle notes panel                 | `Ctrl+Shift+N`                   | `Alt+Shift+N`                    |
| Peek at wallpaper (hold)           | `Ctrl+H`                         | `Alt+H`                          |

---

## Notes

The notes panel supports Markdown: headings, lists, task checkboxes, bold/italic, inline code, fenced code blocks, links, and blockquotes. Task checkboxes are interactive in preview mode. Notes are persisted in `chrome.storage.local`.

Use the **Save to notes** button in the browser action popup to append the current page's URL to your notes as a Markdown link.

---

## Privacy

- No data is sent anywhere except DuckDuckGo autocomplete requests (only when `searchSuggestions` is enabled; can be disabled).
- Bookmarks, notes, and settings are stored locally in `chrome.storage.local` and, if a config directory is linked, in files on your own machine.
