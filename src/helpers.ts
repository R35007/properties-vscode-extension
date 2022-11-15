import * as dateformat from "dateformat";
import * as fs from "fs";
import * as fsProm from "fs/promises";
import { getVideoDurationInSeconds } from 'get-video-duration';
import imageSize from "image-size";
import * as moment from "moment";
import * as musicmetadata from 'musicmetadata';
import * as path from "path";
import * as vscode from 'vscode';
import { Settings } from './Settings';


// Converts the file size from Bytes to KB | MB | GB | TB
export const convertBytes = (bytes: number): string => {
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0) return 'n/a';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  if (i === 0) return bytes + ' ' + sizes[i];
  return (bytes / Math.pow(1024, i)).toFixed(2) + ' ' + sizes[i] + ` (${bytes} bytes)`;
};

export const toString = (list: any[]) => {
  return list.filter(([key, val, show = true]) => val && show)
    .map(([key, val]) => `${key} : ${val}`)
    .join("\n");
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

    workspace = {
      name: currentWorkSpace.name,
      fsPath: currentWorkSpace.uri.fsPath.replace(/\\/g, "/")
    };
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