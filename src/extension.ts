import * as vscode from 'vscode';
import * as fs from "fs";
import * as path from "path";
import * as mime from "mime";
import { Settings } from './Settings';
import * as humanizeDuration from "humanize-duration";
import { convertBytes, formatDate, getAudioDetails, getImageDetails, getStats, getVideoDetails, toString } from './helpers';


export function activate(context: vscode.ExtensionContext) {

	let disposable = vscode.commands.registerCommand('properties.show', async (args) => {
		const fsPath = args?.fsPath;
		if (!fsPath) return;

		await vscode.window.withProgress({
			location: vscode.ProgressLocation.Notification,
			title: "Please wait...",
		}, async () => {

			const stats = await getStats(fsPath);

			const mimeType = mime.getType(fsPath) || '[unknown]';

			const image = mimeType.includes('image') ? getImageDetails(fsPath) : "";

			const audio = mimeType.includes('audio') ? await getAudioDetails(fsPath) : "";

			const video = mimeType.includes('video') ? await getVideoDetails(fsPath) : "";

			const pathDetails = toString([
				["Name", stats.isFile ? stats.baseName : stats.fileName],
				["Extension", stats.extension, stats.isFile],
				["Type", stats.type],
				["Size", convertBytes(stats.size), stats.size],
				["Contains", `${stats.contains?.files} Files, ${stats.contains?.folders} Folders`, !stats.isFile && stats.contains]
			]);

			const imageDetails = image ?
				toString([
					["Dimensions", `${image?.width} x ${image?.height} pixels`],
					["Width", `${image?.width} pixels`],
					["Height", `${image?.height} pixels`],
				]) : "";

			const audioDetails = audio ?
				toString([
					["Title", audio.title, Settings.audioMetaData.title],
					["Album", audio.album, Settings.audioMetaData.album],
					["Artist", audio.artist.join(', '), Settings.audioMetaData.artist],
					["Genre", audio.genre.join(', '), Settings.audioMetaData.genre],
					["Year", audio.year, Settings.audioMetaData.year],
					["Duration", humanizeDuration(audio.duration * 1000, { maxDecimalPoints: 2 }), Settings.showDuration && audio.duration],
				]) : "";

			const videoDetails = video ?
				toString([
					["Duration", humanizeDuration(video.duration * 1000, { maxDecimalPoints: 2 }), Settings.showDuration && video.duration],
				]) : "";

			const locationDetails = toString([
				['Directory', stats.directory],
				['Location', stats.location],
			]);

			const timestampDetails = toString([
				['Created', formatDate(stats.created), stats.created && Settings.timeStamps.createdTimestamp],
				['Changed', formatDate(stats.changed), stats.changed && Settings.timeStamps.changedTimestamp],
				['Modified', formatDate(stats.modified), stats.modified && Settings.timeStamps.modifiedTimestamp],
				['Accessed', formatDate(stats.accessed), stats.accessed && Settings.timeStamps.accessedTimestamp]
			]);

			const mimeTypeDetails = toString([
				['Mime Type', mimeType, stats.isFile]
			]);

			const result = [pathDetails, imageDetails, audioDetails, videoDetails, locationDetails, timestampDetails, mimeTypeDetails]
				.filter(Boolean)
				.join('\n----------------------------------------------------------------------\n');

			vscode.window.showInformationMessage(stats.fileName, { modal: true, detail: result });
		});

	});

	context.subscriptions.push(disposable);
}

export function deactivate() { }
