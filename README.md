# Clipboard Code History (Per Workspace)

Per-workspace clipboard code history for VS Code.  
This extension remembers your recent copied snippets **only for the current workspace**, so switching between projects does not mix their clipboard histories.

---

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

- **Configurable behavior**
  - Maximum number of stored items.
  - Ignore empty / whitespace-only selections.
  - Ignore immediately repeated snippets.
  - Minimum snippet length to store.

---

## How It Works (High-Level Design)

The extension is intentionally split into small, focused modules:

- `ClipboardHistory` – pure history management (add / list / clear / persist).
- `TrackingState` – per-workspace tracking enabled/disabled flag.
- `ClipboardRecorder` – records text from the active editor into history based on settings.
- `HistoryQuickPick` – UI logic for showing a Quick Pick and handling user selection.
- `HistoryTreeDataProvider` – tree data provider for the sidebar view.
- `ClipboardActions` – shared UI helpers for clipboard-related actions (DRY).
- `settings` – reads configuration values from VS Code settings.
- `extension` – wires all of the above together in `activate`.

This structure keeps responsibilities clear:

- **No UI logic inside the history model.**
- **No VS Code command wiring inside the history model or UI.**
- **Configuration reads are centralized.**

Internally, data is stored in `workspaceState`, which is scoped to the current VS Code workspace, ensuring complete separation between projects.

---

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
// Example: replace normal copy/cut with tracked versions
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

On macOS, use `cmd` instead of `ctrl`.

---

## Settings

All settings are scoped under `clipboardCodeHistory`:

- `clipboardCodeHistory.maxItems` (number, default: `20`)
  - Maximum number of clipboard entries stored **per workspace**.
  - The oldest entries are dropped when the limit is exceeded.

- `clipboardCodeHistory.ignoreEmpty` (boolean, default: `true`)
  - If `true`, ignore entries that are empty or only whitespace.

- `clipboardCodeHistory.ignoreDuplicates` (boolean, default: `true`)
  - If `true`, skip storing an entry if it is identical to the most recent stored snippet (same text, language, and file).

- `clipboardCodeHistory.minLength` (number, default: `2`)
  - Minimum length of snippet text (in characters) required to store it.
  - Use `0` to store any size, including single characters.

Example `settings.json` snippet:

```json
{
  "clipboardCodeHistory.maxItems": 30,
  "clipboardCodeHistory.ignoreEmpty": true,
  "clipboardCodeHistory.ignoreDuplicates": true,
  "clipboardCodeHistory.minLength": 3
}
```

---

## Usage

1. **Install / load the extension** (see Development section below).
2. Use the tracked commands when copying/cutting:
   - Use `Ctrl/Cmd+Shift+C` or `Clipboard Code History: Copy (Track Clipboard)`.
   - Use `Ctrl/Cmd+Shift+X` or `Clipboard Code History: Cut (Track Clipboard)`.
   - (Optional) Rebind your normal `Ctrl/Cmd+C` and `Ctrl/Cmd+X` to the tracked commands for a fully transparent experience.
3. When you want to access previous snippets:
   - Run `Clipboard Code History: Show History`.
   - Pick a snippet – it is copied back to your clipboard.
4. Paste wherever you like (in the same file, another file, terminal, etc.).
5. To reset for the current project:
   - Run `Clipboard Code History: Clear History`.
6. To temporarily suspend tracking for a project:
   - Run `Clipboard Code History: Toggle Tracking`.

Remember: each workspace has its **own** history. Switching projects gives you a fresh, isolated clipboard history.

---

## Implementation Details

### Storage

- History is stored using `context.workspaceState` under a dedicated key.
- Each history entry includes:
  - `id` – uniquely generated ID.
  - `text` – the snippet content.
  - `languageId` – the VS Code language identifier of the document.
  - `fileName` – basename of the source file.
  - `filePath` – workspace-relative file path (fallback: full path).
  - `timestamp` – UNIX epoch milliseconds when copied.

### Tracking strategy

- Uses a small helper (`ClipboardRecorder`) invoked by the custom copy/cut commands:
  - `clipboardCodeHistory.copy`
  - `clipboardCodeHistory.cut`
- For each tracked copy/cut:
  - Collects text from all selections in the active editor.
  - Applies settings (ignore empty, minimum length, ignore duplicates).
  - Adds a new entry to `ClipboardHistory`, trimming to the configured `maxItems`.

### UI

- `HistoryQuickPick` builds a list of `QuickPickItem`s:
  - `label` – first line of the snippet (truncated).
  - `description` – workspace-relative path or filename.
  - `detail` – multi-line snippet preview plus timestamp.
- On selection:
  - Calls `vscode.env.clipboard.writeText` to place the snippet back into the system clipboard.
  - Shows a small notification indicating the origin file.

- `HistoryTreeDataProvider` exposes history as a tree:
  - Each node represents one clipboard entry.
  - `label` – first line of the snippet (truncated).
  - `description` – workspace-relative path or filename.
  - `tooltip` – path, timestamp, and a multi-line preview.
  - Selecting an item triggers the same clipboard action as Quick Pick (via shared `ClipboardActions`).

---

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

---

## Development

### Prerequisites

- Node.js (LTS recommended).
- VS Code.

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

### Packaging (optional)

If you want to publish to the Marketplace, you can add `vsce` as a dev dependency and create a publisher in `package.json`, then package with:

```bash
npm install --save-dev vsce
npm run compile
npx vsce package
```

---

## Notes & Limitations

- Only copies/cuts from VS Code **text editors** are tracked.
  - Copies from the integrated terminal, other UI panels, or external apps are not recorded.
- The extension does **not** replace your system clipboard; it just mirrors selections into a workspace-local history.
- History is stored per workspace using VS Code's workspace state.
  - Closing and reopening the same workspace preserves history.
  - Opening a different folder shows a completely different history.

---

## Future Ideas

- Tree view showing clipboard history in the sidebar.
- Command to insert a selected snippet directly at the cursor (in addition to copying).
- Filtering history by language or file.
- Multi-select restore (copy multiple snippets with one action).

If you’d like any of these features (or others), they can be added on top of the current modular design with minimal changes to the core logic.
