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
  static get audioMetaData() {
    return Settings.getSettings("audioMetaData") as {
      "title": boolean,
      "album": boolean,
      "artist": boolean,
      "genre": boolean,
      "year": boolean
    };
  }
  static get paths() {
    return Settings.getSettings("paths") as {
      "root": boolean,
      "directory": boolean,
      "location": boolean,
      "relativeToRoot": boolean
    };
  }
  static get showDuration() {
    return Settings.getSettings("showDuration") as boolean;
  }
}
