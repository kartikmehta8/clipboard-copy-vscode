import * as vscode from "vscode";
import { ClipboardHistory } from "../history/ClipboardHistory";
import type { ClipboardEntry } from "../history/ClipboardEntry";

export class HistoryTreeItem extends vscode.TreeItem {
  public readonly entry: ClipboardEntry;

  constructor(entry: ClipboardEntry) {
    super(HistoryTreeItem.buildLabel(entry), vscode.TreeItemCollapsibleState.None);
    this.entry = entry;

    this.description = entry.filePath ?? entry.fileName ?? "";
    this.tooltip = HistoryTreeItem.buildTooltip(entry);
    this.contextValue = "clipboardHistoryItem";
    this.command = {
      command: "clipboardCodeHistory.restoreFromTree",
      title: "Copy Snippet to Clipboard",
      arguments: [entry],
    };
  }

  private static buildLabel(entry: ClipboardEntry): string {
    const firstLine = entry.text.split(/\r?\n/)[0] ?? "";
    return HistoryTreeItem.truncate(firstLine, 60) || "(empty selection)";
  }

  private static buildTooltip(entry: ClipboardEntry): string {
    const lines = entry.text.split(/\r?\n/);
    const preview = lines.slice(0, 10).join("\n");
    const timestamp = new Date(entry.timestamp).toLocaleString();
    const path = entry.filePath ?? entry.fileName ?? "Unknown source";

    return `${path}\n${timestamp}\n\n${preview}`;
  }

  private static truncate(text: string, maxLength: number): string {
    if (text.length <= maxLength) {
      return text;
    }

    return text.slice(0, maxLength - 1) + "…";
  }
}

export class HistoryTreeDataProvider
  implements vscode.TreeDataProvider<HistoryTreeItem>
{
  private readonly history: ClipboardHistory;
  private readonly onDidChangeTreeDataEmitter = new vscode.EventEmitter<
    HistoryTreeItem | undefined | void
  >();

  public readonly onDidChangeTreeData = this.onDidChangeTreeDataEmitter.event;

  constructor(history: ClipboardHistory) {
    this.history = history;
  }

  public refresh(): void {
    this.onDidChangeTreeDataEmitter.fire();
  }

  public getTreeItem(element: HistoryTreeItem): vscode.TreeItem {
    return element;
  }

  public getChildren(element?: HistoryTreeItem): Thenable<HistoryTreeItem[]> {
    if (element) {
      return Promise.resolve([]);
    }

    const entries = this.history.getAll();
    const items = entries.map((entry) => new HistoryTreeItem(entry));
    return Promise.resolve(items);
  }
}

