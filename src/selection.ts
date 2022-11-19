import * as vscode from 'vscode';
const durableJsonLint = require('durable-json-lint');
const jsdom = require('jsdom');


const tagEscape = (selectedText: string): string => {
  const escapedString = selectedText
    .trim()
    .replace(/\n/gi, '') // removes Enter Character
    .replace(/\s/gi, ''); // removes spaces
  return escapedString;
};

// removes all Enter, Spaces
const jsonEscape = (selectedText: string): string => {
  const escapedString = selectedText
    .trim()
    .replace(/\n/g, '') // removes next line
    .replace(/\s/g, '') // removes spaces
    .replace(/\r/g, '') // removes carriage return character.
    .replace(/\t/g, '') // removes tabs
    .replace(/(,|;)$/g, ''); // removes , ; at the end of the selected text
  return escapedString;
};

// removes Special characters that are not a JSON compatible
const removeSpecialChars = (selectedText: string): string => {
  const escapedString = selectedText
    .replace(/(\,\])/g, ']') // replaces ,] -> ]
    .replace(/(\,\})/g, '}') // replaces ,} -> }
    .replace(/(\(.*?\))/gi, 'tag') // replace (...) -> tag
    .replace(/(\<.*?\>)/gi, 'tag') // replace <...> -> tag
    .replace(/(\$\{.*?\})/gi, 'text') // replace ${...} to text

    // removes all special characters except {[:,'"]}
    // removes ~!@#$%^&*()_+-=();/|<>.?
    .replace(/(\~|\!|\@|\#|\$|\%|\^|\&|\*|\_|\+|\-|\=|\(|\)|\;|\/|\|\<|\>|\.|\||\?)/g, '')

    .replace(/\`/g, "'") // replace back tick with single quote
    .trim();
  return jsonEscape(escapedString);
};

// Makes the selected Text as a more durable JSON using regex and returns JSON data if true.
const getDurableJSON = (selectedText: string): Object | any[] | undefined => {
  try {
    const escapedText = removeSpecialChars(selectedText);
    const durableText = durableJsonLint(escapedText);
    const data = JSON.parse(durableText?.json);
    return data;
  } catch (err) {
    console.log(err);
  }
};


// Checks if a given string is a valid JSON and returns the JSON data if true.
const getValidJSON = (selectedText: string): Object | any[] | undefined => {
  const escapedText = jsonEscape(selectedText);
  try {
    const data = JSON.parse(escapedText);
    return data;
  } catch (err) {
    return getDurableJSON(escapedText);
  }
};

// For now it returns tags that are selected only under a body tag
// Checks if a given string is a valid HTML and returns the DOM if true.
const getValidHTML = (selectedText: string) => {
  try {
    const escapedText = tagEscape(selectedText);

    // returns false if the given string is not a valid HTML Tag
    if (!(escapedText.startsWith('<') && escapedText.endsWith('>'))) return;

    const { JSDOM } = jsdom;
    const dom = new JSDOM(`<div id="_virtualDom">${selectedText}</div>`);
    const _virtualDom = dom.window.document.querySelector('#_virtualDom');

    return _virtualDom.children;
  } catch (err) {
    console.log(err);
  }
};

interface DataDetails {
  arrayLength: number | undefined,
  objectSize: number | undefined,
  childNodes: number | undefined,
  nodes: number | undefined,
}

const getDataDetails = (selectedText: string = '') => {
  const dataDetails: DataDetails = {
    arrayLength: undefined,
    objectSize: undefined,
    childNodes: undefined,
    nodes: undefined,
  };

  const json = getValidJSON(selectedText);

  if (json) {
    dataDetails.arrayLength = Array.isArray(json) ? json.length : undefined;
    dataDetails.objectSize = !Array.isArray(json) && typeof json === 'object' ? Object.entries(json).length : undefined;
    return dataDetails;
  }

  const node = getValidHTML(selectedText);
  if (!node) return dataDetails;

  dataDetails.nodes = node.length > 1 ? node.length : undefined;
  dataDetails.childNodes = node.length > 1 ? node[0].children.length : undefined;
  return dataDetails;
};

// Function to return all selected Texts and other editor details
const getEditorProps = (fsPath: string) => {
  const editor = vscode.window.activeTextEditor;
  const document = editor?.document;
  const selections = [...(editor?.selections || [])];
  const filePath = document?.uri?.fsPath;
  const selectedText = selections?.map((s) => document?.getText(s)).join(' ').trim();
  return { editor, filePath, selections, selectedText };
};

// Returns number of selected lines
const getLinesCount = (selections: vscode.Selection[]): number => {
  let lines = 0;
  if (selections.every((s) => s.isEmpty)) return 0; // returns If there is no selection

  const selectedLines: number[] = [];

  lines = selections.reduce((prev, curr) => {
    const startLine = curr.start.line;
    const endLine = curr.end.line;
    let lineIncrement = 0;

    // This is to avoid counting already selected line by a multi cursor selection
    if (!selectedLines.includes(startLine)) {
      lineIncrement = 1;
      selectedLines.push(startLine);
    }
    return prev + (endLine - startLine) + lineIncrement;
  }, 0);
  return lines;
};

// Returns number of selected words
const getWordsCount = (selectedText: string = ''): number => {
  if (!selectedText?.trim()) return 0;
  selectedText = selectedText.replace(/(^\s*)|(\s*$)/gi, ''); // removes leading and trailing spaces including enter spaces
  selectedText = selectedText.replace(/[^a-zA-Z ]/g, ' '); // replace all non characters symbols by a single space. ex: data-size-count -> data size count
  selectedText = selectedText.replace(/[ ]{2,}/gi, ' '); // replace more than 2 or more spaces with a single space.
  selectedText = selectedText.replace(/\n /, '\n'); // replace enter space character with next line

  let selectedTextChunk = selectedText.split(' '); // split by single space
  selectedTextChunk = selectedTextChunk.map((s: string) => (s ? s.trim() : s)); // trim each word
  selectedTextChunk = selectedTextChunk.filter(String).filter((s: string) => s && s.length >= 2); // filter text which are only string and has minimum 3 characters

  const wordsCount = selectedTextChunk.length;
  return wordsCount;
};

export const getSelectionDetails = (fsPath: string) => {
  const { editor, filePath, selections, selectedText } = getEditorProps(fsPath);
  if (!editor
    || filePath !== fsPath
    || !selections.length
    || !selectedText?.length
  ) return;

  const lines = getLinesCount(selections);
  const words = getWordsCount(selectedText);
  const data = getDataDetails(selectedText);

  return { lines, words, data };
};