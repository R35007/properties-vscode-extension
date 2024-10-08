import * as ExifReader from "exifreader";
import { FfprobeData } from 'fluent-ffmpeg';
import { Dirent, Stats } from 'fs';

export type StatsProps = {
  fileName: string;
  baseName: string;
  extension?: string;
  directory: string;
  location: string;
  size: number;
  sizePretty: string;
  type: string;
  mimeType?: string;
  isFile: boolean;
  isDirectory: boolean;
  children: Dirent[];
  containedFiles?: number;
  containedFolders?: number;
  contains?: { files: number; folders: number };
  containsPretty?: string;
  created: Date;
  changed: Date;
  modified: Date;
  accessed: Date;
  createdMs: number;
  changedMs: number;
  modifiedMs: number;
  accessedMs: number;
  createdLocal: string;
  changedLocal: string;
  modifiedLocal: string;
  accessedLocal: string;
  createdRelative: string;
  changedRelative: string;
  modifiedRelative: string;
  accessedRelative: string;
  stats: Stats;
};

interface ISize {
  width: number | undefined;
  height: number | undefined;
  orientation?: number;
  type?: string;
  images?: ISize[];
}

export type ImageProps = {
  isImage?: boolean;
  orientation?: string | number;
  bitDepth?: string;
  colorType?: string;
  subSampling?: string;
  compression?: string;
  filter?: string;
  resourceURL?: string;
  resolution?: string;
  xResolution?: number;
  yResolution?: number;
  dimensions?: string;
  width?: string | number;
  height?: string | number;
  metaData?: ExifReader.Tags | ISize
};

export type AudioProps = {
  isAudio?: boolean;
  title?: string | number;
  album?: string | number;
  artist?: string | number;
  composer?: string | number;
  genre?: string | number;
  year?: string | number;
  duration?: number;
  durationMs?: number;
  durationPretty?: string;
  bitRate?: number;
  bitRatePretty?: string;
  channels?: string | number;
  metaData?: FfprobeData;
};

export type VideoProps = {
  isVideo?: boolean;
  dimensions?: string;
  width?: number;
  height?: number;
  resolution?: string;
  duration?: number;
  durationMs?: number;
  durationPretty?: string;
  bitRate?: number;
  bitRatePretty?: string;
  frameRate?: number;
  frameRatePretty?: string;
  framesPerSecond?: string;
  ratio?: string;
  metaData?: FfprobeData;
};

export type Properties = StatsProps & ImageProps & AudioProps & VideoProps;
