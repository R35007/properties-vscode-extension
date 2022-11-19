import * as path from "path";
import * as vscode from 'vscode';
import { Settings } from './Settings';
import * as dateformat from "dateformat";

export const cleanEntries = (object: Object) => {
  return Object.entries(object)
    .filter(([_key, val]) =>
      typeof val !== 'undefined'
      && val !== false
      && `${val}`.length !== 0
      && `${val}` !== 'undefined'
    );
};

export const formatDate = (date: Date, relativeTs?: string) => {
  const dateTimeFormat = Settings.dateTimeFormat?.trim();
  const absolute = dateTimeFormat ? dateformat(date, dateTimeFormat) : date.toLocaleString();

  if (!Settings.timeStamps.relativeTimestamp) return absolute;

  return `${absolute} (${relativeTs})`;
};

const getWorkspaceDetails = (fsPath: string) => {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders?.length) return;

  // get the nearest workspace folder
  const workspace = workspaceFolders
    .filter(wsf => fsPath.includes(wsf.uri.fsPath))
    .sort((a, b) => b.uri.fsPath.length - a.uri.fsPath.length)[0];

  if (!workspace) return;

  const selectedPath = fsPath.replace(/\\/g, "/");
  const workspacePath = workspace.uri.fsPath.replace(/\\/g, "/");

  if (workspacePath === selectedPath) return;

  return {
    name: workspace.name,
    fsPath: workspacePath
  };
};

export const getPathDetails = (fsPath: string) => {
  const workspace = getWorkspaceDetails(fsPath);
  const location = fsPath.replace(/\\/g, "/");
  const directory = path.dirname(fsPath).replace(/\\/g, "/");

  if (!workspace || !Settings.relativeToWorkspace) return { workspace, directory, location };

  // Get relative path to workspace
  const relativeDirectory = directory !== workspace.fsPath ? "./" + path.relative(workspace.fsPath, directory).replace(/\\/g, "/") : undefined;
  const relativeLocation = "./" + path.relative(workspace.fsPath, location).replace(/\\/g, "/");

  return { workspace, directory: relativeDirectory, location: relativeLocation };
};

