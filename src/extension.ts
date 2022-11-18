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
				const image: any = stats.mimeType.includes('image') ? await getImageDetails(fsPath) : "";
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
					"Lines": selection.lines,
					"Words": selection.words,
					"Array Length": selection.data.arrayLength,
					"Object Size": selection.data.objectSize,
					"Nodes": selection.data.nodes,
					"Child Nodes": selection.data.childNodes,
				} : {}).map(([key, val]) => `${key} : ${val}`).join(", ");

				const imageDetails = cleanEntries(image ? {
					"Dimensions (W x H)": image.dimensions,
					"Resolution (X x Y)": image.resolution,
					"Orientation": image.orientation,
					"Bit Depth": image.bitDepth,
					"Color Type": image.colorType,
					"Sub Sampling": image.subSampling,
					"Compression": image.compression,
					"Filter": image.filter,
					"Resource URL": image.resourceURL,
				} : {}).map(([key, val]) => `${key} : ${val}`).join("\n");

				const audioDetails = cleanEntries(audio ? {
					"Title": audio.title,
					"Album": audio.album,
					"Artist": audio.artist,
					"Composer": audio.composer,
					"Genre": audio.genre,
					"Bit Rate": audio.bitRate && convertBytes(audio.bitRate, ['bps', 'kbps', 'mbps'], false),
					"Channels": audio.channels,
					"Year": audio.year,
					"Duration": typeof audio.duration !== 'undefined' && humanizeDuration(audio.duration * 1000, { maxDecimalPoints: 2 }),
				} : {}).map(([key, val]) => `${key} : ${val}`).join("\n");

				const videoDetails = cleanEntries(video ? {
					"Dimensions (W x H)": video.dimensions,
					"Frame Rate": video.frameRate && `${video.frameRate}fps`,
					"Bit Rate": video.bitRate && convertBytes(video.bitRate, ['bps', 'kbps', 'mbps'], false),
					"Ratio": video.ratio,
					"Duration": typeof video.duration !== 'undefined' && humanizeDuration(video.duration * 1000, { maxDecimalPoints: 2 }),
				} : {}).map(([key, val]) => `${key} : ${val}`).join("\n");

				const locationDetails = cleanEntries({
					"Workspace": Settings.relativeToWorkspace && stats.workspace?.fsPath,
					"Directory": stats.directory,
					"Location": stats.location,
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
