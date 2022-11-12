import * as dateformat from "dateformat";
import { readdir, stat } from 'fs/promises';
import { Settings } from './Settings';
import * as path from "path";
import imageSize from "image-size";


export const dirSize = async (dir: string) => {
  const files = await readdir(dir, { withFileTypes: true });

  const filePaths: Array<Promise<number>> = files.map(async file => {
    const filePath = path.join(dir, file.name);

    if (file.isDirectory()) return await dirSize(filePath);

    if (file.isFile()) {
      const { size } = await stat(filePath);
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

  const relative = formatDateRelative(date);
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

const formatDateRelative = (date: Date) => {
  const formatter = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });
  const delta = -(new Date().getTime() - date.getTime());
  const units: Array<[any, number]> = [
    ['year', 31536000000],
    ['month', 2628000000],
    ['day', 86400000],
    ['hour', 3600000],
    ['minute', 60000],
    ['second', 1000],
  ];
  for (let [unit, amount] of units) {
    if (Math.abs(delta) > amount || unit === 'second')
      return formatter.format(Math.round(delta / amount), unit);
  }
};