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
  static get metaData() {
    return Settings.getSettings("metaData") as {
      "dimensions": boolean,
      "width": boolean,
      "height": boolean,
      "title" : boolean,
      "album" : boolean,
      "artist" : boolean,
      "composer" : boolean,
      "genre" : boolean,
      "bitRate" : boolean,
      "frameRate" : boolean,
      "ratio" : boolean,
      "channels" : boolean,
      "year" : boolean,
      "duration" : boolean
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
      "workspace": boolean,
      "directory": boolean,
      "location": boolean,
      "relativeToRoot": boolean
    };
  }
  static get copyAction() {
    return Settings.getSettings("copyAction") as "Properties" | "Location";
  }
}
