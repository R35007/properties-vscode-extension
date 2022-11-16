# Properties

Get file or Folder Properties.

- File Name and Extension.
- File or Folder size.
- Mime Type.
- Number of selected `lines`, `words`, `object size`, `array length`, `nodes count`.
- Number of files and folders inside folder properties.
- Image dimensions. `width` x `height`.
- File or Folder `Directory` and `Location` of a file or folder.
- Audio `title`, `album`, `artist`, `genre`, `year`, `duration`.
- Video `duration`.
- Timestamp of `created`, `changed`, `modified`, `accessed` with relative timestamp .
- Copy properties or location

<div style="display: flex; flex-wrap: wrap; gap: 1rem">
  <div>
    <h2>Folder Properties</h2>
    <img src="./images/folder-properties.png" alt="Screenshot" width="500">
  </div>
  <div>
    <h2>File Properties</h2>
    <img src="./images/file-properties.png" alt="Screenshot" width="500">
  </div>
  <div>
    <h2>Selection Properties</h2>
    <img src="./images/file-properties-with-selection.png" alt="Screenshot" width="500">
  </div>
  <div>
    <h2>Image Properties</h2>
    <img src="./images/image-properties.png" alt="Screenshot" width="500">
  </div>
  <div>
    <h2>Audio Properties</h2>
    <img src="./images/audio-properties.png" alt="Screenshot" width="500">
  </div>
  <div>
    <h2>Video Properties</h2>
    <img src="./images/video-properties.png" alt="Screenshot" width="500">
  </div>
</div>

## Usage

- Right click on any file or folder and select `Properties` from context menu to get the properties.

- Set custom timestamp using `properties.settings.dateTimeFormat`. For more date time formate please click [here](https://www.npmjs.com/package/dateformat#mask-options)
- We can change copy action in setting using `properties.settings.copyAction` to `Location` to copy only file or folder path.
- The selection details may not show if the current active file size is greater than `20mb` due to vscode limitations. 
- The `Extension` and `Mime Type` will only show to file properties and will be hidden in folder properties

## Author

Sivaraman - [sendmsg2siva.siva@gmail.com](sendmsg2siva.siva@gmail.com)

## License

MIT
