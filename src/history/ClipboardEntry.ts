export interface ClipboardEntry {
  id: string;
  text: string;
  languageId?: string;
  fileName?: string;
  filePath?: string;
  timestamp: number;
}
