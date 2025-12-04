import * as vscode from "vscode";

export interface ClipboardSettings {
  maxItems: number;
  ignoreEmpty: boolean;
  ignoreDuplicates: boolean;
  minLength: number;
}

export function getClipboardSettings(): ClipboardSettings {
  const config = vscode.workspace.getConfiguration("clipboardCodeHistory");

  const maxItems = config.get<number>("maxItems", 20);
  const ignoreEmpty = config.get<boolean>("ignoreEmpty", true);
  const ignoreDuplicates = config.get<boolean>("ignoreDuplicates", true);
  const minLength = config.get<number>("minLength", 2);

  return {
    maxItems: Math.max(1, maxItems),
    ignoreEmpty,
    ignoreDuplicates,
    minLength: Math.max(0, minLength),
  };
}

