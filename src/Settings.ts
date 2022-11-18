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
  static get timeStamps() {
    return Settings.getSettings("timeStamps") as {
      "createdTimestamp": boolean,
      "changedTimestamp": boolean,
      "accessedTimestamp": boolean,
      "modifiedTimestamp": boolean,
      "relativeTimestamp": boolean
    };
  }
  static get relativeToWorkspace() {
    return Settings.getSettings("relativeToWorkspace") as boolean;
  }
  static get copyAction() {
    return Settings.getSettings("copyAction") as "Properties" | "Location";
  }
}
