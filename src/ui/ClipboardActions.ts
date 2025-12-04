import * as vscode from "vscode";
import type { ClipboardEntry } from "../history/ClipboardEntry";

export async function copyEntryToClipboard(
  entry: ClipboardEntry
): Promise<void> {
  await vscode.env.clipboard.writeText(entry.text);

  void vscode.window.showInformationMessage(
    `Clipboard Code History: Snippet from "${
      entry.fileName ?? "unknown file"
    }" copied back to clipboard.`
  );
}
