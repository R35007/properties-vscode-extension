import * as fs from "fs";
import * as path from "path";
import * as vscode from 'vscode';
import { Settings } from './Settings';
import * as dateformat from "dateformat";

export const normalizeSelectedPaths = (pathsList: string[]) => {
  const sortedPaths = [...pathsList].sort((a, b) => a.length - b.length);

  // remove parent path and keep only child path
  const distinctPaths = new Set("");
  do {
    const fsPath = sortedPaths.shift()!;
    if (!sortedPaths.some(sp => sp.includes(fsPath))) {
      distinctPaths.add(fsPath);
    }
  } while (sortedPaths.length);

  // Find parent path count
  const dirGroups: any = {};
  distinctPaths.forEach(fsPath => {
    if (dirGroups[path.dirname(fsPath)]) {
      dirGroups[path.dirname(fsPath)]++;
    } else {
      dirGroups[path.dirname(fsPath)] = 1;
    }
  });

  // remove all child paths if selected child paths is equal to parent folder children count
  Object.entries(dirGroups).forEach(([dirPath, dirCount]) => {
    const childrenCount = fs.readdirSync(dirPath).length;
    if (childrenCount === dirCount) {
      distinctPaths.forEach((fsPath) => {
        if (fsPath.includes(dirPath)) { distinctPaths.delete(fsPath); }
      });
      distinctPaths.add(dirPath);
    }
  });

  return [...distinctPaths.values()] as string[];
};

export const getSelectedItems = async (): Promise<string[]> => {
  const originalClipboard = await vscode.env.clipboard.readText(); // get existing copied text

  await vscode.commands.executeCommand('copyFilePath'); // temporarily copy selected item paths
  const paths = await vscode.env.clipboard.readText();  // get copied selected items paths

  await vscode.env.clipboard.writeText(originalClipboard); // copy original copied text;

  return paths.split("\r\n");
};

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

const getWorkspaceDetails = (fsPath?: string) => {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders?.length) return;

  // get the nearest workspace folder
  const workspace = workspaceFolders
    .filter(wsf => fsPath ? fsPath.includes(wsf.uri.fsPath!) : true)
    .sort((a, b) => b.uri.fsPath.length - a.uri.fsPath.length)[0];

  if (!workspace) return;

  const selectedPath = fsPath?.replace(/\\/g, "/");
  const workspacePath = workspace.uri.fsPath.replace(/\\/g, "/");

  if (workspacePath === selectedPath) return;

  return {
    name: workspace.name,
    fsPath: workspacePath
  };
};

export const getPathDetails = (fsPath: string) => {
  const workspace = getWorkspaceDetails();
  const directory = workspace?.fsPath.replace(/\\/g, "/").toLowerCase() !== fsPath.replace(/\\/g, "/").toLowerCase() ? path.dirname(fsPath).replace(/\\/g, "/") : undefined;
  const location = fsPath.replace(/\\/g, "/");

  if (!workspace || !Settings.relativeToWorkspace) return { workspace, directory, location, fsPaths: location };

  // Get relative path to workspace
  const relativeDirectory = directory && directory !== workspace.fsPath ? "./" + path.relative(workspace.fsPath, directory).replace(/\\/g, "/") : undefined;
  const relativeLocation = "./" + path.relative(workspace.fsPath, location).replace(/\\/g, "/");

  return { workspace, directory: relativeDirectory !== "./" ? relativeDirectory : undefined, location: relativeLocation !== "./" ? relativeLocation : undefined, fsPaths: relativeLocation };
};

export const getMultiplePathDetails = (fsPaths: string[], root?: string) => {
  const workspace = getWorkspaceDetails();
  const location = fsPaths.length ? fsPaths.length <= 5 ? fsPaths.join("\n") : `${fsPaths.slice(0, 5).join("\n")}\n... (${fsPaths.length - 5} more)` : ""
  const directory = root && workspace?.fsPath.replace(/\\/g, "/").toLowerCase() !== root.replace(/\\/g, "/").toLowerCase() ? path.dirname(root).replace(/\\/g, "/") : undefined;

  if (!workspace || !Settings.relativeToWorkspace) return { workspace, directory, location };

  // Get relative path to workspace
  const relativeDirectory = directory && directory !== workspace.fsPath ? "./" + path.relative(workspace.fsPath, directory).replace(/\\/g, "/") : undefined;
  const relativeLocationChunk = fsPaths.map(fp => "./" + path.relative(workspace.fsPath, fp).replace(/\\/g, "/"));
  const relativeLocation = relativeLocationChunk.length ? relativeLocationChunk.length <= 5 ? relativeLocationChunk.join("\n") : `${relativeLocationChunk.slice(0, 5).join("\n")}\n... (${relativeLocationChunk.length - 5} more)` : "";

  return { workspace, directory: relativeDirectory !== "./" ? relativeDirectory : undefined, location: relativeLocation !== "./" ? relativeLocation : undefined };
};
