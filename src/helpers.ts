import * as dateformat from "dateformat";
import { Settings } from './Settings';
import * as path from "path";
import * as fs from "fs/promises";
import imageSize from "image-size";
import * as moment from "moment";


export const dirSize = async (dir: string) => {
  const files = await fs.readdir(dir, { withFileTypes: true });

  const filePaths: Array<Promise<number>> = files.map(async file => {
    const filePath = path.join(dir, file.name);

    if (file.isDirectory()) return await dirSize(filePath);

    if (file.isFile()) {
      const { size } = await fs.stat(filePath);
      return size;
    }
    return 0;
  });

  return (await Promise.all(filePaths)).flat(Infinity).reduce((i, size) => i + size, 0);
};

// Converts the file size from Bytes to KB | MB | GB | TB
export const convertBytes = (bytes: number): string => {
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0) return 'n/a';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  if (i === 0) return bytes + ' ' + sizes[i];
  return (bytes / Math.pow(1024, i)).toFixed(2) + ' ' + sizes[i] + ` (${bytes} bytes)`;
};

export const formatDate = (date: Date) => {
  const dateTimeFormat = Settings.dateTimeFormat?.trim();
  const absolute = dateTimeFormat ? dateformat(date, dateTimeFormat) : date.toLocaleString();

  if (Settings.disableRelativeTimestamps) return absolute;

  const relative = moment(date).fromNow();
  return `${absolute} (${relative})`;
};

export const imageDimension = (imagePath: string) => {
  try {
    const dimensions = imageSize(imagePath);
    return dimensions;
  } catch (err) {
    console.log(err);
  }
};

export const toString = (list: any[]) => {
  return list.filter(([key, val]) => val)
    .map(([key, val]) => `${key} : ${val}`)
    .join("\n");
};