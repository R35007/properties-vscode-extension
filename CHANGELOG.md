# Change Log

## [v12.1.0]

- Added – Display counts for top-level files and folders, as well as nested files and folders.
  
## [v12.0.2]

- Readme update

## [v12.0.1]

- Typo fixes.

## [v12.0.0]

- Build size reduced using webpack.
- Removed exporting ffprobe executable for windows. Since this is a platform specific package, please download the [ffprobe](https://ffmpeg.org/download.html) executable file and give the path in `properties.settings.ffprobePath` to get audio and video properties like duration, album, artist etc..
  
## [v11.0.0]

- Build size reduced.
- Added - Get properties from multiple selected files and folders on vscode explorer.
- Extension break on Mac os issue fixed. 
- Removed `properties.settings.copyAction` as `Location` since copy selected file paths and relative paths is already provided by vscode
- Added - `properties.settings.ffprobePath` settings. Provide a custom path to ffprobe executable path to get the audio and video properties.
  
## [v10.2.0]

- node packages updated.

## [v10.1.0]

- using `fs-props` node package to collect properties.

## [v10.0.0]

- Removed Show hide settings.
- Added more image properties.

## [v9.0.0]

- Added cancel button for a long running script.

## [v8.0.0]

- Added more audio and video properties

## [v7.0.0]

- Fix - Properties not showing for files that are opened outer workspace folder issue fixed
- Added `Copy` button to copy `Properties` or `Location` based on setting `properties.settings.copyAction`
- Added `Selection` details. Now we can see selected `lines`, `words`, `array length`, `object size`, `dom nodes length`

## [v6.0.0]

- Added settings `properties.settings.relativeToRoot` - to show `Location` and `Directory` relative to workspace folder

## [v5.0.0]

- Now it shows number of folders and files inside the folder properties.

## [v4.0.0]

- Added Audio and Video Details.

## [v3.0.0]

- Hide extension and mimetype for folder properties.

## [v2.0.0]

- Typo fix

## [v1.0.0]

- Initial release
