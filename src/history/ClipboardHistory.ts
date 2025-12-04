import type { Memento } from "vscode";
import type { ClipboardEntry } from "./ClipboardEntry";

export interface AddEntryOptions {
  maxItems: number;
  ignoreDuplicates: boolean;
}

const HISTORY_STATE_KEY = "clipboardCodeHistory.entries";

export class ClipboardHistory {
  private readonly state: Memento;
  private entries: ClipboardEntry[] = [];

  constructor(state: Memento) {
    this.state = state;
    this.entries = this.loadFromState();
  }

  public getAll(): ClipboardEntry[] {
    return [...this.entries];
  }

  public getLatest(): ClipboardEntry | undefined {
    return this.entries[0];
  }

  public add(entry: ClipboardEntry, options: AddEntryOptions): void {
    if (options.ignoreDuplicates && this.isDuplicateOfLatest(entry)) {
      return;
    }

    this.entries.unshift(entry);

    if (this.entries.length > options.maxItems) {
      this.entries = this.entries.slice(0, options.maxItems);
    }

    this.saveToState();
  }

  public clear(): void {
    this.entries = [];
    this.saveToState();
  }

  public isEmpty(): boolean {
    return this.entries.length === 0;
  }

  private isDuplicateOfLatest(entry: ClipboardEntry): boolean {
    const latest = this.getLatest();
    if (!latest) {
      return false;
    }

    return (
      latest.text === entry.text &&
      latest.languageId === entry.languageId &&
      latest.filePath === entry.filePath
    );
  }

  private loadFromState(): ClipboardEntry[] {
    const stored = this.state.get<ClipboardEntry[]>(HISTORY_STATE_KEY);
    if (!stored || !Array.isArray(stored)) {
      return [];
    }

    // Defensive clone to avoid accidental mutation of the stored reference.
    return stored.map((entry) => ({ ...entry }));
  }

  private saveToState(): void {
    void this.state.update(HISTORY_STATE_KEY, this.entries);
  }
}

