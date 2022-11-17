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
import * as  ffmpeg from 'fluent-ffmpeg';
const ffprobe = require('@ffprobe-installer/ffprobe');

ffmpeg.setFfprobePath(ffprobe.path);

// Converts the file size from Bytes to KB | MB | GB | TB
export const convertBytes = (bytes: number, sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'], showBytes = true): string => {
  if (bytes === 0) return 'n/a';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  if (i === 0) return bytes + ' ' + sizes[i];
  return (bytes / Math.pow(1024, i)).toFixed(2) + ' ' + sizes[i] + (showBytes ? ` (${bytes} bytes)` : "");
};

export const clean = (list: any[]) => {
  return list.filter(([_key, _val, show]) => show)
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

const getSizeAndContains = async (fsPath: string) => {
  const stats = await fsProm.stat(fsPath);

  if (stats.isFile()) return { size: stats.size, contains: undefined };

  // If Directory then get folder size and contains
  const allStats = await getDeepStats(fsPath);

  const contains = {
    files: allStats.filter(stat => stat.isFile()).length,
    folders: allStats.filter(stat => stat.isDirectory()).length,
  };

  const folderSize = allStats.filter(stat => stat.isFile).reduce((res, stat) => res + stat.size, 0);
  return { size: folderSize, contains };
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

const getPathDetails = (fsPath: string) => {
  const workspace = getWorkspaceDetails(fsPath);
  const location = fsPath.replace(/\\/g, "/");
  const directory = path.dirname(fsPath).replace(/\\/g, "/");

  if (!workspace || !Settings.paths.relativeToRoot) return { workspace, directory, location };

  // Get relative path to workspace
  const relativeDirectory = directory !== workspace.fsPath ? "./" + path.relative(workspace.fsPath, directory).replace(/\\/g, "/") : undefined;
  const relativeLocation = "./" + path.relative(workspace.fsPath, location).replace(/\\/g, "/");

  return { workspace, directory: relativeDirectory, location: relativeLocation };
};

export const getStats = async (fsPath: string) => {
  const stats = await fsProm.stat(fsPath);
  const extension = path.extname(fsPath);
  const fileName = path.basename(fsPath);
  const baseName = path.basename(fsPath, extension);
  const isFile = stats.isFile();
  const name = isFile ? baseName : fileName;
  const type = isFile ? "File" : "Folder";
  const mimeType = mime.getType(fsPath) || '[unknown]';
  const created = stats.birthtime;
  const changed = stats.ctime;
  const modified = stats.mtime;
  const accessed = stats.atime;
  const { size, contains } = await getSizeAndContains(fsPath);
  const { workspace, directory, location } = getPathDetails(fsPath);

  return {
    name, extension, fileName, directory, location, baseName, type, mimeType,
    isFile, created, changed, modified, accessed, size, contains, workspace
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

const ffprobePromise = async (filePath: string) => {
  const metaData: ffmpeg.FfprobeData = await new Promise((resolve, reject) =>
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) reject(err);
      else resolve(metadata);
    })
  );
  return metaData;
};

export const getAudioDetails = async (audioPath: string) => {
  try {
    const metaData = await ffprobePromise(audioPath);
    const audio = metaData.streams.find(st => st.codec_type === 'audio') || {} as ffmpeg.FfprobeStream;
    const tags = metaData.format.tags || {};
    return {
      title: tags.title,
      album: tags.album,
      artist: tags.artist,
      composer: tags.composer,
      genre: tags.genre,
      year: tags.date,
      duration: metaData.format.duration || 0,
      bitRate: metaData.format.bit_rate || 0,
      channels: audio.channel_layout ? `${audio.channels} (${audio.channel_layout})` : audio.channels,
    };
  } catch (error: any) {
    console.error(error.message);
    return undefined;
  }
};

// TODO: Now we get only duration. We need try to get other video information as well
export const getVideoDetails = async (videoPath: string) => {
  try {
    const metaData = await ffprobePromise(videoPath);
    const video = metaData.streams.find(st => st.codec_type === 'video') || {} as ffmpeg.FfprobeStream;
    return {
      width: video.width,
      height: video.height,
      duration: metaData.format.duration || 0,
      bitRate: parseInt(video.bit_rate || '0', 10),
      frameRate: eval(video.r_frame_rate || "0").toFixed(2),
      ratio: video.display_aspect_ratio
    };
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