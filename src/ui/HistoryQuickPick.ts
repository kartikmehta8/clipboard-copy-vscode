import * as vscode from "vscode";
import { ClipboardHistory } from "../history/ClipboardHistory";
import type { ClipboardEntry } from "../history/ClipboardEntry";
import { copyEntryToClipboard } from "./ClipboardActions";

export class HistoryQuickPick {
  private readonly history: ClipboardHistory;

  constructor(history: ClipboardHistory) {
    this.history = history;
  }

  public async show(): Promise<void> {
    const entries = this.history.getAll();

    if (!entries.length) {
      void vscode.window.showInformationMessage(
        "Clipboard Code History: No entries for this workspace yet.",
      );
      return;
    }

    const items = entries.map((entry) => this.toQuickPickItem(entry));

    const picked = await vscode.window.showQuickPick(items, {
      placeHolder: "Select a snippet to copy back to your clipboard",
      matchOnDescription: true,
      matchOnDetail: true,
    });

    if (!picked || !picked.entry) {
      return;
    }

    await this.handleSelection(picked.entry);
  }

  private async handleSelection(entry: ClipboardEntry): Promise<void> {
    await copyEntryToClipboard(entry);
  }

  private toQuickPickItem(
    entry: ClipboardEntry,
  ): (vscode.QuickPickItem & { entry: ClipboardEntry }) {
    const snippetPreview = this.buildPreview(entry.text);
    const date = new Date(entry.timestamp);
    const timestampLabel = date.toLocaleString();

    return {
      label: snippetPreview.firstLine,
      description: entry.filePath ?? entry.fileName ?? "Unknown source",
      detail: `${snippetPreview.multilinePreview}\n— Copied at ${timestampLabel}`,
      entry,
      alwaysShow: false,
    };
  }

  private buildPreview(text: string): { firstLine: string; multilinePreview: string } {
    const lines = text.split(/\r?\n/);
    const firstLine = this.truncate(lines[0], 80);

    const maxPreviewLines = 5;
    const previewLines = lines.slice(0, maxPreviewLines).map((line) => this.truncate(line, 120));
    const multilinePreview =
      previewLines.join("\n") + (lines.length > maxPreviewLines ? "\n…" : "");

    return { firstLine, multilinePreview };
  }

  private truncate(text: string, maxLength: number): string {
    if (text.length <= maxLength) {
      return text;
    }

    return text.slice(0, maxLength - 1) + "…";
  }
}
