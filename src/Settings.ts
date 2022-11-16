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
  static get imageMetaData() {
    return Settings.getSettings("imageMetaData") as {
      "dimensions": boolean,
      "width": boolean,
      "height": boolean
    };
  }
  static get selections() {
    return Settings.getSettings("selections") as {
      "lines": boolean,
      "words": boolean,
      "data": boolean
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
  static get copyAction() {
    return Settings.getSettings("copyAction") as "Properties" | "Location";
  }
}
