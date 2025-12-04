import type { Memento } from "vscode";

const TRACKING_ENABLED_KEY = "clipboardCodeHistory.trackingEnabled";

export class TrackingState {
  private readonly state: Memento;

  constructor(state: Memento) {
    this.state = state;
  }

  public isEnabled(): boolean {
    const stored = this.state.get<boolean>(TRACKING_ENABLED_KEY);
    if (typeof stored === "boolean") {
      return stored;
    }

    // Default to enabled for convenience.
    return true;
  }

  public setEnabled(enabled: boolean): void {
    void this.state.update(TRACKING_ENABLED_KEY, enabled);
  }

  public toggle(): boolean {
    const newValue = !this.isEnabled();
    this.setEnabled(newValue);
    return newValue;
  }
}
