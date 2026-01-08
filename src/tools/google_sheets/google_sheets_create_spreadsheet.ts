import type {ToolDefinition} from 'webmcp-polyfill';

export const tool: ToolDefinition = {
  name: 'google_sheets_create_spreadsheet',
  description:
    'Create a new blank spreadsheet from the Google Sheets home page.',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  },
  async execute() {
    const createButton = document.querySelector<HTMLElement>(
      '#docs-homescreen-add .docs-homescreen-ui-wizfabbutton-fabmenu-menubutton'
    );
    if (!createButton) {
      return {
        content: [
          {
            type: 'text',
            text: 'Create button not found. Make sure you are on the Google Sheets home page.'
          }
        ],
        isError: true
      };
    }

    createButton.click();

    return {
      content: [{type: 'text', text: 'Creating new spreadsheet...'}]
    };
  }
};
