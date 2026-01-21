import type {ToolDefinition} from 'webmcp-polyfill';

export const tool: ToolDefinition = {
  name: 'google_sheets_open_spreadsheet',
  description:
    'Open a spreadsheet by clicking on it in the list. Use google_sheets_list_spreadsheets first to see available spreadsheets.',
  inputSchema: {
    type: 'object',
    properties: {
      index: {
        type: 'number',
        description:
          'The index of the spreadsheet to open (from list_spreadsheets).'
      }
    },
    required: ['index']
  },
  async execute(input) {
    const {index} = input as {index: number};

    const listItems = document.querySelectorAll<HTMLElement>(
      '.docs-homescreen-list-item'
    );
    if (listItems.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: 'No spreadsheets found. Make sure you are on the Google Sheets home page.'
          }
        ],
        isError: true
      };
    }

    if (index < 0 || index >= listItems.length) {
      return {
        content: [
          {
            type: 'text',
            text: `Invalid index ${index}. Valid range is 0-${listItems.length - 1}.`
          }
        ],
        isError: true
      };
    }

    const targetItem = listItems[index];
    const title =
      targetItem
        .querySelector('.docs-homescreen-list-item-title-value')
        ?.textContent?.trim() || 'Untitled';

    targetItem.click();

    return {
      content: [{type: 'text', text: `Opening spreadsheet: "${title}"`}]
    };
  }
};
