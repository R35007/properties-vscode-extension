/* eslint-disable @typescript-eslint/naming-convention */
import * as fsProps from "fs-props";
import * as path from "path";
import * as vscode from 'vscode';
import { cleanEntries, formatDate, normalizeSelectedPaths, getPathDetails, getSelectedItems as getSelectedItemPaths, getMultiplePathDetails } from './helpers';
import { getSelectionDetails } from "./selection";
import { Settings } from './Settings';

export function activate(context: vscode.ExtensionContext) {

	let disposable = vscode.commands.registerCommand('properties.show', async (args) => {

		try {
			const selectedPaths = await getSelectedItemPaths();
			const normalizedPaths = normalizeSelectedPaths(selectedPaths);

			// Set custom ffprobe path
			if (Settings.ffprobePath) {
				fsProps.setFfprobePath(Settings.ffprobePath);
			}

			if (!normalizedPaths.length) return; // return if no file or folder is selected

			// If multiple files or folder is selected
			if (normalizedPaths.length > 1) {
				await vscode.window.withProgress({
					location: vscode.ProgressLocation.Notification,
					title: "Please wait...",
					cancellable: true
				}, async (_progress, token) => {

					const { workspace, location } = getMultiplePathDetails(selectedPaths);

					const selectedItemProps = normalizedPaths.map(itemPath => fsProps.statSync(itemPath));
					const size = selectedItemProps.reduce((res, { size }) => res + size, 0);
					const selectedFilesCount = selectedPaths.map(itemPath => fsProps.statSync(itemPath)).filter(({ isFile }) => isFile).length;
					const selectedFoldersCount = selectedPaths.map(itemPath => fsProps.statSync(itemPath)).filter(({ isDirectory }) => isDirectory).length;
					const containedFoldersCount = selectedItemProps.reduce((res, { containedFolders }) => res + (containedFolders || 0), 0);
					const containedFilesCount = selectedItemProps.reduce((res, { containedFiles }) => res + (containedFiles || 0), 0) + selectedFilesCount;

					const pathDetails = cleanEntries({
						"Name": "Multiple Selection",
						"Size": fsProps.convertBytes(size),
						"Selected": `${selectedFilesCount} Files, ${selectedFoldersCount} Folders`,
						"Contains": containedFoldersCount || containedFilesCount ? `${containedFilesCount} Files, ${containedFoldersCount} Folders` : "",
					}).map(([key, val]: [string, any]) => `${key} : ${val}`).join("\n");

					const locationDetails = cleanEntries({
						"Workspace": Settings.relativeToWorkspace && workspace?.fsPath,
						"Locations": location
					}).map(([key, val]: [string, any]) => `${key} : ${val}`).join("\n");

					const result = [pathDetails, locationDetails]
						.filter(Boolean)
						.join('\n----------------------------------------------------------------------\n');

					!token.isCancellationRequested && vscode.window.showInformationMessage('Multiple Selection', { modal: true, detail: result }, "Copy Properties")
						.then(action => {
							if (!action) return;
							const copyText = `Multiple Selection\n\n${result}`;
							vscode.env.clipboard.writeText(copyText);
							vscode.window.showInformationMessage(`Properties Copied to clipboard 📋!`);
							return;
						});
				});
				return;
			}

			if (args?.fsPath) {
				const fsPath = selectedPaths.length > 1 ? normalizedPaths[0] : args.fsPath;
				if (!fsPath) return;

				await vscode.window.withProgress({
					location: vscode.ProgressLocation.Notification,
					title: "Please wait...",
					cancellable: true
				}, async (_progress, token) => {

					const props = await fsProps.props(fsPath);
					const { workspace, location, directory } = selectedPaths.length > 1 ? getMultiplePathDetails(selectedPaths, fsPath) : getPathDetails(fsPath);

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

					let locationDetails = cleanEntries({
						"Workspace": Settings.relativeToWorkspace && workspace?.fsPath,
						"Directory": directory,
						[selectedPaths.length > 1 ? "Locations" : "Location"]: location
					}).map(([key, val]: [string, any]) => `${key} : ${val}`).join("\n");

					const timestampDetails = cleanEntries({
						"Created": Settings.timeStamps.createdTimestamp && props.created && formatDate(props.created, props.createdRelative),
						"Changed": Settings.timeStamps.changedTimestamp && props.changed && formatDate(props.changed, props.changedRelative),
						"Modified": Settings.timeStamps.modifiedTimestamp && props.modified && formatDate(props.modified, props.modifiedRelative),
						"Accessed": Settings.timeStamps.accessedTimestamp && props.accessed && formatDate(props.accessed, props.accessedRelative),
					}).map(([key, val]: [string, any]) => `${key} : ${val}`).join("\n");


					const result = [pathDetails, selectionDetails, imageDetails, audioDetails, videoDetails, locationDetails, timestampDetails]
						.filter(Boolean)
						.join('\n----------------------------------------------------------------------\n');

					!token.isCancellationRequested && vscode.window.showInformationMessage(props.fileName, { modal: true, detail: result }, "Copy Properties")
						.then(action => {
							if (!action) return;
							const copyText = `${props.fileName}\n\n${result}`;
							vscode.env.clipboard.writeText(copyText);
							vscode.window.showInformationMessage(`Properties Copied to clipboard 📋!`);
						});
				});
				return;
			}


		} catch (err: any) {
			vscode.window.showErrorMessage(err.message || 'Something went wrong. Please try again!');
		}
	});

	context.subscriptions.push(disposable);
}

export function deactivate() { }
