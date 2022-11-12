import * as vscode from "vscode";

export class Settings {

  static get configuration() {
    return vscode.workspace.getConfiguration("properties.settings");
  }
  static getSettings(val: string) {
    return Settings.configuration.get(val);
  }
  static setSettings(key: string, val: any, isGlobal = true) {
    return Settings.configuration.update(key, val, isGlobal);
  }

  static get dateTimeFormat() {
    return Settings.getSettings("dateTimeFormat") as string || '';
  }
  static get disableRelativeTimestamps() {
    return Settings.getSettings("disableRelativeTimestamps") as boolean;
  }
}
