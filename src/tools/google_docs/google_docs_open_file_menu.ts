import type {ToolDefinition} from 'webmcp-polyfill';

export const tool: ToolDefinition = {
  name: 'google_docs_open_file_menu',
  description:
    'Open the File menu in Google Docs editor. Provides access to file operations like download, print, share, etc.',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  },
  async execute() {
    const fileMenu = document.querySelector<HTMLElement>('#docs-file-menu');
    if (!fileMenu) {
      return {
        content: [
          {
            type: 'text',
            text: 'File menu not found. Make sure you are in the Google Docs editor.'
          }
        ],
        isError: true
      };
    }

    fileMenu.click();

    return {
      content: [{type: 'text', text: 'File menu opened'}]
    };
  }
};
