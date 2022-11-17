/* eslint-disable @typescript-eslint/naming-convention */
import * as humanizeDuration from "humanize-duration";
import * as vscode from 'vscode';
import { cleanEntries, convertBytes, formatDate, getAudioDetails, getImageDetails, getSelectionDetails, getStats, getVideoDetails } from './helpers';
import { Settings } from './Settings';


export function activate(context: vscode.ExtensionContext) {

	let disposable = vscode.commands.registerCommand('properties.show', async (args) => {
		try {
			const fsPath = args?.fsPath;
			if (!fsPath) return;

			await vscode.window.withProgress({
				location: vscode.ProgressLocation.Notification,
				title: "Please wait...",
				cancellable: true
			}, async (_progress, token) => {

				const stats = await getStats(fsPath);
				const selection = getSelectionDetails(fsPath);
				const image = stats.mimeType.includes('image') ? getImageDetails(fsPath) : "";
				const audio = stats.mimeType.includes('audio') ? await getAudioDetails(fsPath) : "";
				const video = stats.mimeType.includes('video') ? await getVideoDetails(fsPath) : "";

				const pathDetails = cleanEntries({
					"Name": stats.name,
					"Extension": stats.isFile && stats.extension,
					"Mime Type": stats.isFile && stats.mimeType,
					"Size": convertBytes(stats.size),
					"Contains": !stats.isFile && stats.contains && `${stats.contains?.files} Files, ${stats.contains?.folders} Folders`,
				}).map(([key, val]) => `${key} : ${val}`).join("\n");

				const selectionDetails = cleanEntries(selection ? {
					"Lines": Settings.selections.lines && selection.lines,
					"Words": Settings.selections.words && selection.words,
					"Array Length": Settings.selections.data && selection.data.arrayLength,
					"Object Size": Settings.selections.data && selection.data.objectSize,
					"Nodes": Settings.selections.data && selection.data.nodes,
					"Child Nodes": Settings.selections.data && selection.data.childNodes,
				} : {}).map(([key, val]) => `${key} : ${val}`).join(", ");

				const imageDetails = cleanEntries(image ? {
					"Dimensions": Settings.metaData.dimensions && typeof image.width !== 'undefined' && typeof image.height !== 'undefined' && `${image?.width} x ${image?.height} pixels`,
					"Width": Settings.metaData.width && typeof image.width !== 'undefined' && `${image?.width} pixels`,
					"Height": Settings.metaData.height && typeof image.height !== 'undefined' && `${image?.height} pixels`,
				} : {}).map(([key, val]) => `${key} : ${val}`).join("\n");

				const audioDetails = cleanEntries(audio ? {
					"Title": Settings.metaData.title && audio.title,
					"Album": Settings.metaData.album && audio.album,
					"Artist": Settings.metaData.artist && audio.artist,
					"Composer": Settings.metaData.composer && audio.composer,
					"Genre": Settings.metaData.genre && audio.genre,
					"Bit Rate": Settings.metaData.bitRate && audio.bitRate && convertBytes(audio.bitRate, ['bps', 'kbps', 'mbps'], false),
					"Channels": Settings.metaData.channels && audio.channels,
					"Year": Settings.metaData.year && audio.year,
					"Duration": Settings.metaData.duration && typeof audio.duration !== 'undefined' && humanizeDuration(audio.duration * 1000, { maxDecimalPoints: 2 }),
				} : {}).map(([key, val]) => `${key} : ${val}`).join("\n");

				const videoDetails = cleanEntries(video ? {
					"Dimensions": Settings.metaData.dimensions && typeof video.width !== 'undefined' && typeof video.height !== 'undefined' && `${video?.width} x ${video?.height} pixels`,
					"Width": Settings.metaData.width && typeof video.width !== 'undefined' && `${video?.width} pixels`,
					"Height": Settings.metaData.height && typeof video.height !== 'undefined' && `${video?.height} pixels`,
					"Frame Rate": Settings.metaData.frameRate && video.frameRate && `${video.frameRate}fps`,
					"Bit Rate": Settings.metaData.bitRate && video.bitRate && convertBytes(video.bitRate, ['bps', 'kbps', 'mbps'], false),
					"Ratio": Settings.metaData.ratio && video.ratio,
					"Duration": Settings.metaData.duration && typeof video.duration !== 'undefined' && humanizeDuration(video.duration * 1000, { maxDecimalPoints: 2 }),
				} : {}).map(([key, val]) => `${key} : ${val}`).join("\n");

				const locationDetails = cleanEntries({
					"Workspace": Settings.paths.relativeToRoot && stats.workspace?.fsPath,
					"Directory": Settings.paths.directory && stats.directory,
					"Location": Settings.paths.location && stats.location,
				}).map(([key, val]) => `${key} : ${val}`).join("\n");

				const timestampDetails = cleanEntries({
					"Created": Settings.timeStamps.createdTimestamp && stats.created && formatDate(stats.created),
					"Changed": Settings.timeStamps.changedTimestamp && stats.changed && formatDate(stats.changed),
					"Modified": Settings.timeStamps.modifiedTimestamp && stats.modified && formatDate(stats.modified),
					"Accessed": Settings.timeStamps.accessedTimestamp && stats.accessed && formatDate(stats.accessed),
				}).map(([key, val]) => `${key} : ${val}`).join("\n");


				const result = [pathDetails, selectionDetails, imageDetails, audioDetails, videoDetails, locationDetails, timestampDetails]
					.filter(Boolean)
					.join('\n----------------------------------------------------------------------\n');

				!token.isCancellationRequested && vscode.window.showInformationMessage(stats.fileName, { modal: true, detail: result }, `Copy ${Settings.copyAction}`)
					.then(action => {
						if (action) {
							const copyText = Settings.copyAction === "Properties" ? `${stats.fileName}\n\n${result}` : stats.location;
							vscode.env.clipboard.writeText(copyText);
							vscode.window.showInformationMessage(`${Settings.copyAction} Copied to clipboard 📋!`);
						}
					});
			});

		} catch (err: any) {
			vscode.window.showErrorMessage(err.message || 'Something went wrong. Please try again!');
		}
	});

	context.subscriptions.push(disposable);
}

export function deactivate() { }
