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
    window.location.href = 'https://docs.google.com/spreadsheets/create';

    return {
      content: [{type: 'text', text: 'Creating new spreadsheet...'}]
    };
  }
};
