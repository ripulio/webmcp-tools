import type {ToolDefinition} from 'webmcp-polyfill';

export const tool: ToolDefinition = {
  name: 'google_docs_share_document',
  description:
    'Open the sharing dialog in Google Docs to share the document with others or change sharing settings.',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  },
  async execute() {
    const shareButton = document.querySelector<HTMLElement>(
      '#docs-titlebar-share-client-button .jfk-button'
    );
    if (!shareButton) {
      return {
        content: [
          {
            type: 'text',
            text: 'Share button not found. Make sure you are in the Google Docs editor.'
          }
        ],
        isError: true
      };
    }

    shareButton.click();

    return {
      content: [{type: 'text', text: 'Share dialog opened'}]
    };
  }
};
