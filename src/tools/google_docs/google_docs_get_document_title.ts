import type {ToolDefinition} from 'webmcp-polyfill';

export const tool: ToolDefinition = {
  name: 'google_docs_get_document_title',
  description:
    "Retrieve the current document's title from the Google Docs editor.",
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  },
  async execute() {
    const titleInput = document.querySelector<HTMLInputElement>(
      '#docs-title-widget input.docs-title-input'
    );
    if (!titleInput) {
      return {
        content: [
          {
            type: 'text',
            text: 'Title input not found. Make sure you are in the Google Docs editor.'
          }
        ],
        isError: true
      };
    }

    const title = titleInput.value || 'Untitled document';

    return {
      content: [{type: 'text', text: `Document title: "${title}"`}],
      structuredContent: {title}
    };
  }
};
