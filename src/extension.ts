/* eslint-disable @typescript-eslint/naming-convention */
import * as fsProps from "fs-props";
import * as vscode from 'vscode';
import { cleanEntries, formatDate, getPathDetails } from './helpers';
import { getSelectionDetails } from "./selection";
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

				const props = await fsProps.properties(fsPath);
				const { workspace, location, directory } = getPathDetails(fsPath);
				const selection = getSelectionDetails(fsPath);

				const pathDetails = cleanEntries({
					"Name": props.isFile ? props.baseName : props.fileName,
					"Extension": props.isFile && props.extension,
					"Mime Type": props.isFile && props.mimeType,
					"Size": props.sizePretty,
					"Contains": !props.isFile && props.containsPretty,
				}).map(([key, val]: [string, any]) => `${key} : ${val}`).join("\n");

				const selectionDetails = cleanEntries(selection ? {
					"Lines": selection.lines,
					"Words": selection.words,
					"Array Length": selection.data.arrayLength,
					"Object Size": selection.data.objectSize,
					"Nodes": selection.data.nodes,
					"Child Nodes": selection.data.childNodes,
				} : {}).map(([key, val]: [string, any]) => `${key} : ${val}`).join(", ");

				const imageDetails = cleanEntries(props.isImage ? {
					"Dimensions (W x H)": props.dimensions,
					"Resolution (X x Y)": props.resolution,
					"Orientation": props.orientation,
					"Bit Depth": props.bitDepth,
					"Color Type": props.colorType,
					"Sub Sampling": props.subSampling,
					"Compression": props.compression,
					"Filter": props.filter,
					"Resource URL": props.resourceURL,
				} : {}).map(([key, val]: [string, any]) => `${key} : ${val}`).join("\n");

				const audioDetails = cleanEntries(props.isAudio ? {
					"Title": props.title,
					"Album": props.album,
					"Artist": props.artist,
					"Composer": props.composer,
					"Genre": props.genre,
					"Bit Rate": props.bitRatePretty,
					"Channels": props.channels,
					"Year": props.year,
					"Duration": props.durationPretty,
				} : {}).map(([key, val]: [string, any]) => `${key} : ${val}`).join("\n");

				const videoDetails = cleanEntries(props.isVideo ? {
					"Dimensions (W x H)": props.dimensions,
					"Frame Rate": props.frameRatePretty,
					"Bit Rate": props.bitRatePretty,
					"Ratio": props.ratio,
					"Duration": props.durationPretty,
				} : {}).map(([key, val]: [string, any]) => `${key} : ${val}`).join("\n");

				const locationDetails = cleanEntries({
					"Workspace": Settings.relativeToWorkspace && workspace?.fsPath,
					"Directory": directory,
					"Location": location,
				}).map(([key, val]: [string, any]) => `${key} : ${val}`).join("\n");

				const timestampDetails = cleanEntries({
					"Created": Settings.timeStamps.createdTimestamp && props.timestamps.created && formatDate(props.timestamps.created, props.timestamps.createdRelative),
					"Changed": Settings.timeStamps.changedTimestamp && props.timestamps.changed && formatDate(props.timestamps.changed, props.timestamps.changedRelative),
					"Modified": Settings.timeStamps.modifiedTimestamp && props.timestamps.modified && formatDate(props.timestamps.modified, props.timestamps.modifiedRelative),
					"Accessed": Settings.timeStamps.accessedTimestamp && props.timestamps.accessed && formatDate(props.timestamps.accessed, props.timestamps.accessedRelative),
				}).map(([key, val]: [string, any]) => `${key} : ${val}`).join("\n");


				const result = [pathDetails, selectionDetails, imageDetails, audioDetails, videoDetails, locationDetails, timestampDetails]
					.filter(Boolean)
					.join('\n----------------------------------------------------------------------\n');

				!token.isCancellationRequested && vscode.window.showInformationMessage(props.fileName, { modal: true, detail: result }, `Copy ${Settings.copyAction}`)
					.then(action => {
						if (action) {
							const copyText = Settings.copyAction === "Properties" ? `${props.fileName}\n\n${result}` : props.location;
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
