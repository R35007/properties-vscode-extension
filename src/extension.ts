import * as vscode from 'vscode';
import * as fs from "fs";
import * as path from "path";
import * as mime from "mime";
import { convertBytes, dirSize, formatDate, imageDimension } from './helpers';

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
			const dimensions = imageDimension(fsPath);

			const baseDetails =
				`Name      : ${name}
				 Extension : ${extension.replace(".", "")}
				 Type      : ${type}
				 Size      : ${size}`;

			const dimensionDetails = dimensions ?
				`Dimensions : ${dimensions?.width} x ${dimensions?.height} pixels
				 width      : ${dimensions?.width} pixels
				 height     : ${dimensions?.height} pixels` : "";

			const locationDetails =
				`Location  : ${args.fsPath}
			   Directory : ${directory}`;

			const timestampDetails =
				`Created   : ${created}
			   Changed   : ${changed}
			   Modified  : ${modified}
			   Accessed  : ${accessed}`;

			const mimeTypeDetails = `Mime Type : ${mimeType}`;

			const result = [baseDetails, dimensionDetails, locationDetails, timestampDetails, mimeTypeDetails]
				.filter(Boolean)
				.join('\n----------------------------------------------------------------------\n');

			vscode.window.showInformationMessage(title, { modal: true, detail: result });
		});

	});

	context.subscriptions.push(disposable);
}

export function deactivate() { }
