# Debug Console+

[![Visual Studio Marketplace](https://img.shields.io/visual-studio-marketplace/v/Pomisoft.debug-console-plus?label=VS%20Code%20Marketplace&logo=visual-studio-code)](https://marketplace.visualstudio.com/items?itemName=Pomisoft.debug-console-plus)
[![Open VSX](https://img.shields.io/open-vsx/v/pomisoft/debug-console-plus?label=Open%20VSX&logo=openvsx)](https://open-vsx.org/extension/pomisoft/debug-console-plus)

A better debug console for VS Code / forks. Filter, search, and let AI query your logs.

**Latest release:** 0.0.10 — see [CHANGELOG.md](CHANGELOG.md) for notes.

![Debug Console+ demo](recording.gif)

## Features

- **Level filtering** — toggle debug / info / warn / error with one click
- **Source filtering** — a button appears at the end of the filter row for each log source in the session (`APP`, `FLUTTER`, `PLATFORM`, `DEBUGGER`; `UNKNOWN` for logs loaded from older files); click to hide or show that source
- **Search** — search or filter logs by text or regex, combine with AND/OR logic
- **Save / load logs** — export or restore sessions from the view title bar
- **Columns** — timestamp, log source and log level columns toggle independently; all of them auto-hide on narrow panels
  - **Timestamps** — the clock icon cycles absolute / relative / hidden
  - **Log source** — where each line came from: `APP` (your code: `print`, `dart:developer` `log`), `FLUTTER` (framework errors and tooling), `PLATFORM` (native Android/iOS logs) or `DEBUGGER` (debug adapter messages). **Toggle Log Source** in the view title bar or `debugConsolePlus.showLogSource`
  - **Log level** — **Toggle Log Level** in the view title bar or `debugConsolePlus.showLogLevel`
- **Title bar actions** — every action is its own title bar icon; right-click the title bar to hide the ones you don't use
- **Compact** — strip timestamps, Android logcat tags, leading `[info]` / `[debug]` / `[warn]` / `[error]` tags, and box-drawing for clean output (experimental)
- **Auto-scroll** — follows new logs, pauses when you scroll up
- **Copy & clipboard**
  - **Copy All Logs** (Command Palette or the copy icon in the view title bar) — copies every line that currently passes your level and search filters (not the unfiltered session). Each line is the enabled columns (timestamp, source, level) followed by the stored message text.
  - **Copy up to here** / **Copy from here** — right-click any log line in the list. **Copy up to here** copies from the first filtered line through the line you clicked (inclusive). **Copy from here** copies from that line through the last filtered line (inclusive). Hovered ranges highlight so you can see what will be copied. Same filters and clipboard formatting as **Copy All Logs** (note: **Compact** only changes how lines are drawn in the view, not what gets copied).


![Debug Console+ screenshot](copy_from_here.png)

## Colors

Log rows use your theme's Debug Console colors by default. To change them for Debug Console+ only, set `debugConsolePlus.colors` in your settings (hex values; leave a value empty for the default):

```jsonc
"debugConsolePlus.colors": {
  "timestamp": "#4d5566", // empty: the log level color
  "debug": "",            // empty: theme descriptionForeground
  "info": "#59c2ff",      // empty: theme debugConsole.infoForeground
  "warn": "",             // empty: theme debugConsole.warningForeground
  "error": ""             // empty: theme debugConsole.errorForeground
}
```

A level color applies to the whole row: timestamp (unless `timestamp` is set), source, level and message, and to the level filter buttons.

## MCP Integration

AI agents can query your debug logs using the built-in MCP server.

**Setup:** click **Set Up MCP Server** (plug icon) in the Debug Console+ title bar. The setup writes an absolute path to the per-workspace logs directory into `.cursor/mcp.json`, so re-run it if you move workspaces or upgrade from a version older than 0.0.9.

Example queries an agent can answer:
- "Show me only errors"
- "Find logs containing 'users' that are errors"
- "Show recent warnings"

## Where logs are stored

Live logs are written to the extension's per-user **global storage** (outside any workspace), under a per-workspace subdirectory. They are never placed in your project folder, so they don't pollute Git, leak local paths, or grow inside the repo.

Use **Open Logs Folder** (folder icon) in the title bar to reveal the current workspace's logs directory in your OS file manager. Typical locations:

- macOS: `~/Library/Application Support/<App>/User/globalStorage/pomisoft.debug-console-plus/workspaces/<workspace-name>-<hash>/`
- Linux: `~/.config/<App>/User/globalStorage/pomisoft.debug-console-plus/workspaces/<workspace-name>-<hash>/`
- Windows: `%APPDATA%\<App>\User\globalStorage\pomisoft.debug-console-plus\workspaces\<workspace-name>-<hash>\`

The folder name is the workspace's basename plus a short hash (so two projects with the same name still get separate folders).

If you upgraded from an older version, you can safely delete any `.debug_console_plus/` folder that was previously created in your workspace (and remove it from `.gitignore`).

## Install

```bash
npm install
npm run compile
```

## Build

```bash
npx --yes @vscode/vsce package
```

## License

MIT
