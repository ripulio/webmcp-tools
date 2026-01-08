import type {ToolDefinition} from 'webmcp-polyfill';

export const tool: ToolDefinition = {
  name: 'google_docs_rename_document',
  description: 'Change the document title in Google Docs editor.',
  inputSchema: {
    type: 'object',
    properties: {
      title: {
        type: 'string',
        description: 'The new title for the document'
      }
    },
    required: ['title']
  },
  async execute(input) {
    const {title} = input as {title: string};

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

    // Focus the input
    titleInput.focus();
    titleInput.select();

    // Set the new value
    titleInput.value = title;
    titleInput.dispatchEvent(new Event('input', {bubbles: true}));
    titleInput.dispatchEvent(new Event('change', {bubbles: true}));

    // Blur to trigger save
    titleInput.blur();

    return {
      content: [{type: 'text', text: `Document renamed to: "${title}"`}]
    };
  }
};
