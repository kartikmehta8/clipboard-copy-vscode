import * as vscode from "vscode";
import { ClipboardHistory } from "./history/ClipboardHistory";
import { TrackingState } from "./history/TrackingState";
import { ClipboardRecorder } from "./history/ClipboardRecorder";
import { HistoryQuickPick } from "./ui/HistoryQuickPick";
import { HistoryTreeDataProvider } from "./ui/HistoryTreeDataProvider";
import type { ClipboardEntry } from "./history/ClipboardEntry";
import { copyEntryToClipboard } from "./ui/ClipboardActions";

export function activate(context: vscode.ExtensionContext): void {
  const workspaceState = context.workspaceState;

  const history = new ClipboardHistory(workspaceState);
  const trackingState = new TrackingState(workspaceState);

  const recorder = new ClipboardRecorder(history, trackingState);
  const historyQuickPick = new HistoryQuickPick(history);

  const treeDataProvider = new HistoryTreeDataProvider(history);
  vscode.window.registerTreeDataProvider("clipboardCodeHistory.view", treeDataProvider);

  const copyCommand = vscode.commands.registerCommand(
    "clipboardCodeHistory.copy",
    async () => {
      recorder.recordFromActiveEditor();
      treeDataProvider.refresh();
      await vscode.commands.executeCommand("editor.action.clipboardCopyAction");
    },
  );

  const cutCommand = vscode.commands.registerCommand(
    "clipboardCodeHistory.cut",
    async () => {
      recorder.recordFromActiveEditor();
      treeDataProvider.refresh();
      await vscode.commands.executeCommand("editor.action.clipboardCutAction");
    },
  );

  const showHistoryCommand = vscode.commands.registerCommand(
    "clipboardCodeHistory.showHistory",
    async () => {
      await historyQuickPick.show();
    },
  );

  const clearHistoryCommand = vscode.commands.registerCommand(
    "clipboardCodeHistory.clearHistory",
    () => {
      history.clear();
      treeDataProvider.refresh();
      void vscode.window.showInformationMessage(
        "Clipboard Code History: Cleared history for this workspace.",
      );
    },
  );

  const toggleTrackingCommand = vscode.commands.registerCommand(
    "clipboardCodeHistory.toggleTracking",
    () => {
      const enabled = trackingState.toggle();

      void vscode.window.showInformationMessage(
        `Clipboard Code History: Tracking is now ${enabled ? "enabled" : "disabled"} for this workspace.`,
      );
    },
  );

  const restoreFromTreeCommand = vscode.commands.registerCommand(
    "clipboardCodeHistory.restoreFromTree",
    async (entry: ClipboardEntry) => {
      if (!entry || typeof entry.text !== "string") {
        return;
      }

      await copyEntryToClipboard(entry);
    },
  );

  context.subscriptions.push(
    copyCommand,
    cutCommand,
    showHistoryCommand,
    clearHistoryCommand,
    toggleTrackingCommand,
    restoreFromTreeCommand,
  );
}

export function deactivate(): void {
  // Nothing to clean up explicitly: disposables are registered with the extension context.
}
