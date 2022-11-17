import * as vscode from 'vscode';
import { Settings } from './Settings';
import * as humanizeDuration from "humanize-duration";
import { convertBytes, formatDate, getAudioDetails, getImageDetails, getSelectionDetails, getStats, getVideoDetails, clean } from './helpers';


export function activate(context: vscode.ExtensionContext) {

	let disposable = vscode.commands.registerCommand('properties.show', async (args) => {
		try {
			const fsPath = args?.fsPath;
			if (!fsPath) return;

			await vscode.window.withProgress({
				location: vscode.ProgressLocation.Notification,
				title: "Please wait...",
			}, async () => {

				const stats = await getStats(fsPath);

				const selection = getSelectionDetails(fsPath);

				const image = stats.mimeType.includes('image') ? getImageDetails(fsPath) : "";

				const audio = stats.mimeType.includes('audio') ? await getAudioDetails(fsPath) : "";

				const video = stats.mimeType.includes('video') ? await getVideoDetails(fsPath) : "";

				const pathDetails = clean([
					["Name", stats.name, stats.name],
					["Extension", stats.extension, stats.isFile && stats.extension],
					['Mime Type', stats.mimeType, stats.isFile],
					["Size", convertBytes(stats.size), stats.size],
					["Contains", `${stats.contains?.files} Files, ${stats.contains?.folders} Folders`, !stats.isFile && stats.contains]
				]).join('\n');

				const selectionDetails = selection ?
					clean([
						["Lines", selection.lines, Settings.selections.lines && selection.lines],
						["Words", selection.words, Settings.selections.words && selection.words],
						["Array Length", selection.data.arrayLength, Settings.selections.data && typeof selection.data.arrayLength !== 'undefined'],
						["Object Size", selection.data.objectSize, Settings.selections.data && typeof selection.data.objectSize !== 'undefined'],
						["Nodes", selection.data.nodes, Settings.selections.data && typeof selection.data.nodes !== 'undefined'],
						["Child Nodes", selection.data.childNodes, Settings.selections.data && typeof selection.data.childNodes !== 'undefined'],
					]).join(", ") : "";

				const imageDetails = image ?
					clean([
						["Dimensions", `${image?.width} x ${image?.height} pixels`, Settings.metaData.dimensions && typeof image.width !== 'undefined' && typeof image.height !== 'undefined'],
						["Width", `${image?.width} pixels`, Settings.metaData.width && typeof image.width !== 'undefined'],
						["Height", `${image?.height} pixels`, Settings.metaData.height && typeof image.height !== 'undefined'],
					]).join('\n') : "";

				const audioDetails = audio ?
					clean([
						["Title", audio.title, Settings.metaData.title && audio.title],
						["Album", audio.album, Settings.metaData.album && audio.album],
						["Artist", audio.artist, Settings.metaData.artist && audio.artist],
						["Composer", audio.composer, Settings.metaData.composer && audio.composer],
						["Genre", audio.genre, Settings.metaData.genre && audio.genre],
						["Bit Rate", convertBytes(audio.bitRate, ['bps', 'kbps', 'mbps'], false), Settings.metaData.bitRate && audio.bitRate],
						["Channels", audio.channels, Settings.metaData.channels && audio.channels],
						["Year", audio.year, Settings.metaData.year && audio.year],
						["Duration", humanizeDuration(audio.duration * 1000, { maxDecimalPoints: 2 }), Settings.metaData.duration && audio.duration],
					]).join('\n') : "";

				const videoDetails = video ?
					clean([
						["Dimensions", `${video?.width} x ${video?.height} pixels`,  Settings.metaData.dimensions && typeof video.width !== 'undefined' && typeof video.height !== 'undefined'],
						["Width", `${video?.width} pixels`,  Settings.metaData.width && typeof video.width !== 'undefined'],
						["Height", `${video?.height} pixels`,  Settings.metaData.height && typeof video.height !== 'undefined'],
						["Frame Rate", `${video.frameRate}fps`,  Settings.metaData.frameRate && video.frameRate],
						["Bit Rate", convertBytes(video.bitRate, ['bps', 'kbps', 'mbps'], false),  Settings.metaData.bitRate && video.bitRate],
						["Ratio", video.ratio,  Settings.metaData.ratio && video.ratio],
						["Duration", humanizeDuration(video.duration * 1000, { maxDecimalPoints: 2 }), Settings.metaData.duration && video.duration],
					]).join('\n') : "";

				const locationDetails = clean([
					['Workspace', stats.workspace?.fsPath, Settings.paths.relativeToRoot && Settings.paths.workspace && stats.workspace?.fsPath],
					['Directory', stats.directory, Settings.paths.directory && stats.directory],
					['Location', stats.location, Settings.paths.location && stats.location],
				]).join('\n');

				const timestampDetails = clean([
					['Created', formatDate(stats.created), Settings.timeStamps.createdTimestamp && stats.created],
					['Changed', formatDate(stats.changed), Settings.timeStamps.changedTimestamp && stats.changed],
					['Modified', formatDate(stats.modified), Settings.timeStamps.modifiedTimestamp && stats.modified],
					['Accessed', formatDate(stats.accessed), Settings.timeStamps.accessedTimestamp && stats.accessed]
				]).join('\n');

				const result = [pathDetails, selectionDetails, imageDetails, audioDetails, videoDetails, locationDetails, timestampDetails]
					.filter(Boolean)
					.join('\n----------------------------------------------------------------------\n');

				vscode.window.showInformationMessage(stats.fileName, { modal: true, detail: result }, `Copy ${Settings.copyAction}`)
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
