import type {ToolDefinition} from 'webmcp-polyfill';

export const tool: ToolDefinition = {
  name: 'google_docs_open_edit_menu',
  description:
    'Open the Edit menu in Google Docs editor. Provides access to undo, redo, cut, copy, paste, find and replace, etc.',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  },
  async execute() {
    const editMenu = document.querySelector<HTMLElement>('#docs-edit-menu');
    if (!editMenu) {
      return {
        content: [
          {
            type: 'text',
            text: 'Edit menu not found. Make sure you are in the Google Docs editor.'
          }
        ],
        isError: true
      };
    }

    editMenu.click();

    return {
      content: [{type: 'text', text: 'Edit menu opened'}]
    };
  }
};
