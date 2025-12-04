# Clipboard Code History (Per Workspace)

Per-workspace clipboard code history for VS Code.  
This extension remembers your recent copied snippets **only for the current workspace**, so switching between projects does not mix their clipboard histories.

## Features

- **Per-workspace clipboard history**
  - Each VS Code workspace maintains its own clipboard history.
  - Histories never leak across projects.

- **Copy / cut with tracking**
  - Wraps standard editor copy / cut behavior with history tracking via:
    - `Clipboard Code History: Copy (Track Clipboard)`
    - `Clipboard Code History: Cut (Track Clipboard)`
  - Grabs the text from the active editor selection(s) and stores it in a workspace-scoped history before delegating to the normal copy / cut commands.

- **Quick access history**
  - Command: `Clipboard Code History: Show History`
  - Opens a Quick Pick listing the last snippets (configurable, default 20).
  - Selecting an item copies it back into the system clipboard so you can paste it anywhere.

- **Sidebar view with icon**
  - Dedicated activity bar icon and view container: **Clipboard History**.
  - Shows your per-workspace snippets as a tree in the left sidebar.
  - Clicking an item copies that snippet back to your clipboard.

- **Workspace-scoped controls**
  - `Clipboard Code History: Clear History` – clear the current workspace history.
  - `Clipboard Code History: Toggle Tracking` – enable/disable tracking for this workspace without touching other projects.

## Commands

All commands are available from the Command Palette (`Cmd/Ctrl + Shift + P`):

- `Clipboard Code History: Copy (Track Clipboard)`
  - Copies the current selection(s), records the snippet(s) into the workspace history, then delegates to the built-in editor copy command.

- `Clipboard Code History: Cut (Track Clipboard)`
  - Cuts the current selection(s), records the snippet(s) into the workspace history, then delegates to the built-in editor cut command.

- `Clipboard Code History: Show History`
  - Opens a Quick Pick of recent snippets for the current workspace.
  - Selecting a snippet copies it back to your clipboard.

- `Clipboard Code History: Clear History`
  - Clears the clipboard history for the current workspace only.

- `Clipboard Code History: Toggle Tracking`
  - Turns automatic tracking **on/off** for this workspace.
  - The default is **enabled**.

- `Clipboard Code History: Copy From Sidebar`
  - Copies the snippet represented by the selected tree item in the sidebar view.

You can also access the copy/cut + history commands and `Show History` via the editor context menu.

### Recommended keybindings

By default this extension binds:

- `Ctrl+Shift+C` → `Clipboard Code History: Copy (Track Clipboard)`
- `Ctrl+Shift+X` → `Clipboard Code History: Cut (Track Clipboard)`

To make tracked history completely transparent, you can override the standard copy/cut keybindings in your `keybindings.json`:

```jsonc
{
  "key": "ctrl+c",
  "command": "clipboardCodeHistory.copy",
  "when": "editorTextFocus && !editorReadonly"
},
{
  "key": "ctrl+x",
  "command": "clipboardCodeHistory.cut",
  "when": "editorTextFocus && !editorReadonly"
}
```

## Project Structure

```text
.
├── package.json          # VS Code extension manifest and build scripts
├── tsconfig.json         # TypeScript configuration
├── README.md             # This file
└── src
    ├── extension.ts                  # Entry point: activate/deactivate
    ├── config
    │   └── settings.ts               # Reads `clipboardCodeHistory.*` settings
    ├── history
    │   ├── ClipboardEntry.ts         # Data model for a clipboard entry
    │   ├── ClipboardHistory.ts       # History management (add/get/clear, persistence)
    │   ├── TrackingState.ts          # Workspace-scoped tracking on/off state
    │   └── ClipboardRecorder.ts      # Records text from the active editor into history
    └── ui
        ├── HistoryQuickPick.ts       # Quick Pick UI for browsing history
        ├── HistoryTreeDataProvider.ts# Sidebar tree view provider
        └── ClipboardActions.ts       # Shared UI actions (copy to clipboard, notifications)
```

This layout keeps modules small and focused:

- History logic is UI-agnostic and editor-agnostic.
- UI code does not know about persistence implementation details.
- The extension entrypoint is primarily wiring and registration code.

## Development

### Install dependencies

From the project root:

```bash
npm install
```

### Build

Compile the TypeScript sources:

```bash
npm run compile
```

Or run in watch mode during development:

```bash
npm run watch
```

### Run the extension

1. Open this folder in VS Code.
2. Run the `Run Extension` launch configuration:
   - Press `F5` or
   - Use the *Run and Debug* view and start **Extension** (or similar).
3. A new VS Code window (Extension Development Host) will open with the extension loaded.
