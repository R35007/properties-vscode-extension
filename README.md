# Properties

Get file or Folder Properties.

- Get properties of a multiple selected files and folders
- File `Name` and `Extension`.
- File or Folder `Size`.
- File `Mime Type`.
- Number of selected `Lines`, `Words`, `Object Size`, `Array Length`, `Nodes`, `Child Nodes`.
- Folders `Contains`.
- Image `Dimensions`, `Resolution`, `Bit Depth`, `Color Type`, `Sub Sampling`, `Compression`, `Filter`, `Resource URL`.
- File or Folder `Workspace`, `Directory` and `Location`.
- Audio `Title`, `Album`, `Artist`, `Composer`, `Genre`, `Bit Rate`, `Channels`, `Year`, `Duration`.
- Video `Dimensions`, `Frame Rate`, `Bit Rate`, `Ratio`, `Duration`.
- Timestamp of `created`, `changed`, `modified`, `accessed` with relative timestamp .
- Copy properties or location

<a href="https://buymeacoffee.com/r35007" target="_blank">
  <img src="https://r35007.github.io/Siva_Profile/images//buymeacoffee.png" />
</a>

## Preview 
<img src="https://user-images.githubusercontent.com/23217228/205488891-68401b6d-6c42-438f-80ec-cac31de3cffd.gif" alt="Folder Properties" width="100%" style="max-width: 1300px">

## Usage

- Right click on any file or folder and select `Properties` from context menu to get the properties.

- Set custom timestamp using `properties.settings.dateTimeFormat`. For more date time formate please click [here](https://www.npmjs.com/package/dateformat#mask-options)
- We can change copy action in setting using `properties.settings.copyAction` to `Location` to copy only file or folder path.
- The selection details may not show if the current active file size is greater than `20mb` due to vscode limitations.
- The `Extension` and `Mime Type` will only show to file properties and will be hidden in folder properties

## Audio and Video Properties

 - To get audio and video properties we need to provide the [ffprobe](https://ffmpeg.org/download.html) executable path in `properties.settings.ffprobePath`
 - This helps to get the additional properties of audio or video file properties like duration, album, composer, resolutions etc..

## Author

Sivaraman - [sendmsg2siva.siva@gmail.com](sendmsg2siva.siva@gmail.com)

## License

MIT
