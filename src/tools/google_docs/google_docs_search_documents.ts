import type {ToolDefinition} from 'webmcp-polyfill';

export const tool: ToolDefinition = {
  name: 'google_docs_search_documents',
  description:
    'Search for documents by name in Google Docs. Enters a search query and submits it.',
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'The search query to find documents'
      }
    },
    required: ['query']
  },
  async execute(input) {
    const {query} = input as {query: string};

    const searchInput = document.querySelector<HTMLInputElement>(
      '#aso_search_form_anchor input[name="q"]'
    );
    if (!searchInput) {
      return {
        content: [
          {
            type: 'text',
            text: 'Search input not found. Make sure you are on the Google Docs home page.'
          }
        ],
        isError: true
      };
    }

    // Focus and clear the input
    searchInput.focus();
    searchInput.value = '';

    // Set the value and trigger input events
    searchInput.value = query;
    searchInput.dispatchEvent(new Event('input', {bubbles: true}));
    searchInput.dispatchEvent(new Event('change', {bubbles: true}));

    // Submit the search by pressing Enter
    searchInput.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'Enter',
        code: 'Enter',
        keyCode: 13,
        which: 13,
        bubbles: true
      })
    );

    return {
      content: [{type: 'text', text: `Searching for: "${query}"`}]
    };
  }
};
