import * as vscode from "vscode";
import { ClipboardHistory } from "./ClipboardHistory";
import type { ClipboardEntry } from "./ClipboardEntry";
import { TrackingState } from "./TrackingState";
import { getClipboardSettings } from "../config/settings";

export class ClipboardRecorder {
  private readonly history: ClipboardHistory;
  private readonly trackingState: TrackingState;

  constructor(history: ClipboardHistory, trackingState: TrackingState) {
    this.history = history;
    this.trackingState = trackingState;
  }

  public recordFromActiveEditor(): void {
    if (!this.trackingState.isEnabled()) {
      return;
    }

    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return;
    }

    const { document, selections } = editor;
    if (!selections || selections.length === 0) {
      return;
    }

    const settings = getClipboardSettings();

    const combinedText = selections
      .map((selection) => document.getText(selection))
      .join("\n");

    if (settings.ignoreEmpty && combinedText.trim().length === 0) {
      return;
    }

    if (combinedText.length < settings.minLength) {
      return;
    }

    const relativePath = vscode.workspace.asRelativePath(document.uri, false);

    const entry: ClipboardEntry = {
      id: this.createId(),
      text: combinedText,
      languageId: document.languageId,
      fileName: document.fileName.split(/[\\/]/).pop(),
      filePath: relativePath || document.fileName,
      timestamp: Date.now(),
    };

    this.history.add(entry, {
      maxItems: settings.maxItems,
      ignoreDuplicates: settings.ignoreDuplicates,
    });
  }

  private createId(): string {
    return `${Date.now().toString(36)}-${Math.random()
      .toString(36)
      .slice(2, 8)}`;
  }
}
