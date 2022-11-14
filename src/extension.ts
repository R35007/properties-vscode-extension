import * as vscode from 'vscode';
import * as fs from "fs";
import * as path from "path";
import * as mime from "mime";
import { convertBytes, dirSize, formatDate, imageDimension, toString, musicMetaData, videoMetaData } from './helpers';
import { Settings } from './Settings';
import * as humanizeDuration from "humanize-duration";


export function activate(context: vscode.ExtensionContext) {

	let disposable = vscode.commands.registerCommand('properties.show', async (args) => {
		const fsPath = args?.fsPath;
		if (!fsPath) return;

		await vscode.window.withProgress({
			location: vscode.ProgressLocation.Notification,
			title: "Please wait...",
		}, async () => {
			const stat = fs.statSync(fsPath);
			const extension = path.extname(fsPath) || "[none]";
			const title = path.basename(fsPath);
			const name = path.basename(fsPath, extension);
			const type = stat.isFile() ? "File" : "Folder";
			const directory = path.dirname(fsPath);
			const size = stat.isFile() ? convertBytes(stat.size) || 0 : convertBytes(await dirSize(fsPath));
			const created = formatDate(stat.birthtime) || "";
			const changed = formatDate(stat.ctime) || "";
			const modified = formatDate(stat.mtime) || "";
			const accessed = formatDate(stat.atime) || "";
			const mimeType = mime.getType(fsPath) || '[unknown]';
			const dimensions = mimeType.includes('image') ? imageDimension(fsPath) : "";
			const musicmetadata = mimeType.includes('audio') ? await musicMetaData(fsPath) : "";
			const videometadata = mimeType.includes('video') ? await videoMetaData(fsPath) : "";

			const baseDetails = toString([
				["Name", type === 'File' ? name : title],
				["Extension", extension, type === 'File'],
				["Type", type],
				["Size", size]
			]);

			const dimensionDetails = dimensions ?
				toString([
					["Dimensions", `${dimensions?.width} x ${dimensions?.height} pixels`],
					["Width", `${dimensions?.width} pixels`],
					["Height", `${dimensions?.height} pixels`],
				]) : "";

			const audioDetails = musicmetadata ?
				toString([
					["Title", musicmetadata.title, Settings.audioMetaData.title],
					["Album", musicmetadata.album, Settings.audioMetaData.album],
					["Artist", musicmetadata.artist.join(', '), Settings.audioMetaData.artist],
					["Genre", musicmetadata.genre.join(', '), Settings.audioMetaData.genre],
					["Year", musicmetadata.year, Settings.audioMetaData.year],
					["Duration", humanizeDuration(musicmetadata.duration * 1000, { maxDecimalPoints: 2 }), Settings.showDuration && musicmetadata.duration],
				]) : "";

			const videoDetails = videometadata ?
				toString([
					["Duration", humanizeDuration(videometadata.duration * 1000, { maxDecimalPoints: 2 }), Settings.showDuration && videometadata.duration],
				]) : "";

			const locationDetails = toString([
				['Location', args.fsPath],
				['Directory', directory],
			]);

			const timestampDetails = toString([
				['Created', created, Settings.timeStamps.createdTimestamp],
				['Changed', changed, Settings.timeStamps.changedTimestamp],
				['Modified', modified, Settings.timeStamps.modifiedTimestamp],
				['Accessed', accessed, Settings.timeStamps.accessedTimestamp]
			]);

			const mimeTypeDetails = toString([
				['Mime Type', mimeType, type === 'File']
			]);

			const result = [baseDetails, dimensionDetails, audioDetails, videoDetails, locationDetails, timestampDetails, mimeTypeDetails]
				.filter(Boolean)
				.join('\n----------------------------------------------------------------------\n');

			vscode.window.showInformationMessage(title, { modal: true, detail: result });
		});

	});

	context.subscriptions.push(disposable);
}

export function deactivate() { }
