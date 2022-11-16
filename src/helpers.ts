import * as dateformat from "dateformat";
import * as fs from "fs";
import * as fsProm from "fs/promises";
import { getVideoDurationInSeconds } from 'get-video-duration';
import imageSize from "image-size";
import * as mime from "mime";
import * as moment from "moment";
import * as musicmetadata from 'musicmetadata';
import * as path from "path";
import * as vscode from 'vscode';
import * as DataDetails from './DataDetails';
import { Settings } from './Settings';


// Converts the file size from Bytes to KB | MB | GB | TB
export const convertBytes = (bytes: number): string => {
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0) return 'n/a';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  if (i === 0) return bytes + ' ' + sizes[i];
  return (bytes / Math.pow(1024, i)).toFixed(2) + ' ' + sizes[i] + ` (${bytes} bytes)`;
};

export const clean = (list: any[]) => {
  return list.filter(([_key, _val, show = true]) => show)
    .map(([key, val]) => `${key}: ${val}`);
};

const getDeepStats = async (fsPath: string): Promise<fs.Stats[]> => {
  const files = await fsProm.readdir(fsPath, { withFileTypes: true });

  const statsList = files.map(async file => {
    const filePath = path.join(fsPath, file.name);

    const fsStats = await fsProm.stat(filePath);

    if (file.isFile()) return [fsStats];

    // If Directory then get all nested files and folder stats
    const fsStatsList = await getDeepStats(filePath);
    return [fsStats, ...fsStatsList];
  });

  const fsStatsList = await Promise.all(statsList);

  return fsStatsList.flat(Infinity).filter(Boolean) as fs.Stats[];
};

export const getStats = async (fsPath: string) => {
  const stats = await fsProm.stat(fsPath);
  const extension = path.extname(fsPath) || "[none]";
  const fileName = path.basename(fsPath);
  const baseName = path.basename(fsPath, extension);
  const isFile = stats.isFile();
  const type = isFile ? "File" : "Folder";
  const mimeType = mime.getType(fsPath) || '[unknown]';
  const created = stats.birthtime;
  const changed = stats.ctime;
  const modified = stats.mtime;
  const accessed = stats.atime;

  let location = fsPath.replace(/\\/g, "/");
  let directory = path.dirname(fsPath).replace(/\\/g, "/");

  let size = stats.size;
  let contains;
  let workspace;

  const workSpaceFolders = vscode.workspace.workspaceFolders;
  if (workSpaceFolders?.length) {

    // get the nearest workspace folder
    const currentWorkSpace = workSpaceFolders
      .filter(wsf => fsPath.includes(wsf.uri.fsPath))
      .sort((a, b) => b.uri.fsPath.length - a.uri.fsPath.length)[0];

    workspace = currentWorkSpace ? {
      name: currentWorkSpace.name,
      fsPath: currentWorkSpace.uri.fsPath.replace(/\\/g, "/")
    } : undefined;
  }


  if (stats.isDirectory()) {
    const allStats = await getDeepStats(fsPath);

    contains = {
      files: allStats.filter(stat => stat.isFile()).length,
      folders: allStats.filter(stat => stat.isDirectory()).length,
    };

    const folderSize = allStats.filter(stat => stat.isFile).reduce((res, stat) => res + stat.size, 0);
    size = folderSize;
  }

  // Set relative path to workspace
  if (Settings.paths.relativeToRoot && workspace) {
    directory = "./" + path.relative(workspace.fsPath, directory).replace(/\\/g, "/");
    location = "./" + path.relative(workspace.fsPath, location).replace(/\\/g, "/");
  }

  return {
    extension,
    fileName,
    directory,
    location,
    baseName,
    type,
    mimeType,
    isFile,
    created,
    changed,
    modified,
    accessed,
    size,
    contains,
    workspace
  };
};

export const formatDate = (date: Date) => {
  const dateTimeFormat = Settings.dateTimeFormat?.trim();
  const absolute = dateTimeFormat ? dateformat(date, dateTimeFormat) : date.toLocaleString();

  if (!Settings.timeStamps.relativeTimestamp) return absolute;

  const relative = moment(date).fromNow();
  return `${absolute} (${relative})`;
};

export const getImageDetails = (imagePath: string) => {
  try {
    const dimensions = imageSize(imagePath);
    return dimensions;
  } catch (err) {
    console.log(err);
  }
};

export const getAudioDetails = async (audioPath: string): Promise<MM.Metadata | undefined> => {
  try {
    var readableStream = fs.createReadStream(audioPath);
    const result = await new Promise((resolve, reject) => {
      musicmetadata(readableStream, { duration: Settings.showDuration }, function (err, metadata) {
        if (err) throw reject(err);
        readableStream.close();
        resolve(metadata);
      });
    });
    return result as MM.Metadata;
  } catch (error: any) {
    console.error(error.message);
    return undefined;
  }
};

// TODO: Now we get only duration. We need try to get other video information as well
export const getVideoDetails = async (videoPath: string) => {
  try {
    if (!Settings.showDuration) return;
    var readableStream = fs.createReadStream(videoPath);
    const duration = await getVideoDurationInSeconds(readableStream);
    return { duration };
  } catch (error: any) {
    console.error(error.message);
    return undefined;
  }
};

// Function to return all selected Texts and other editor details
const getEditorProps = (fsPath: string) => {
  const editor = vscode.window.activeTextEditor;
  const document = editor?.document;
  const selections = [...(editor?.selections || [])];
  const filePath = document?.uri?.fsPath;
  const selectedText = selections?.map((s) => document?.getText(s)).join(' ').trim();
  return { editor, filePath, selections, selectedText };
};

// Returns number of selected lines
const getLinesCount = (selections: vscode.Selection[]): number => {
  let lines = 0;
  if (selections.every((s) => s.isEmpty)) return 0; // returns If there is no selection

  const selectedLines: number[] = [];

  lines = selections.reduce((prev, curr) => {
    const startLine = curr.start.line;
    const endLine = curr.end.line;
    let lineIncrement = 0;

    // This is to avoid counting already selected line by a multi cursor selection
    if (!selectedLines.includes(startLine)) {
      lineIncrement = 1;
      selectedLines.push(startLine);
    }
    return prev + (endLine - startLine) + lineIncrement;
  }, 0);
  return lines;
};

// Returns number of selected words
const getWordsCount = (selectedText: string = ''): number => {
  if (!selectedText?.trim()) return 0;
  selectedText = selectedText.replace(/(^\s*)|(\s*$)/gi, ''); // removes leading and trailing spaces including enter spaces
  selectedText = selectedText.replace(/[^a-zA-Z ]/g, ' '); // replace all non characters symbols by a single space. ex: data-size-count -> data size count
  selectedText = selectedText.replace(/[ ]{2,}/gi, ' '); // replace more than 2 or more spaces with a single space.
  selectedText = selectedText.replace(/\n /, '\n'); // replace enter space character with next line

  let selectedTextChunk = selectedText.split(' '); // split by single space
  selectedTextChunk = selectedTextChunk.map((s: string) => (s ? s.trim() : s)); // trim each word
  selectedTextChunk = selectedTextChunk.filter(String).filter((s: string) => s && s.length >= 2); // filter text which are only string and has minimum 3 characters

  const wordsCount = selectedTextChunk.length;
  return wordsCount;
};

export const getSelectionDetails = (fsPath: string) => {
  const { editor, filePath, selections, selectedText } = getEditorProps(fsPath);
  if (!editor
    || filePath !== fsPath
    || !selections.length
    || !selectedText?.length
  ) return;

  const lines = getLinesCount(selections);
  const words = getWordsCount(selectedText);
  const data = DataDetails.getDetails(selectedText);

  return { lines, words, data };
};