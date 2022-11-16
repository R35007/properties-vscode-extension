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

export const getDetails = (selectedText: string = '') => {
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