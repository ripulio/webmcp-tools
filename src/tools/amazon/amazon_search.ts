import type {ToolDefinition} from 'webmcp-polyfill';

export const amazonSearch: ToolDefinition = {
  name: 'amazon_search',
  description:
    'Search for products on Amazon. Enters a search query and submits the search form. After calling this tool, use amazon_get_results to retrieve the search results.',
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'The search query to find products on Amazon'
      }
    },
    required: ['query']
  },
  async execute(input) {
    const {query} = input as {query: string};

    const searchInput = document.querySelector<HTMLInputElement>(
      '#twotabsearchtextbox'
    );
    if (!searchInput) {
      return {
        content: [
          {
            type: 'text',
            text: 'Search input not found. Make sure you are on an Amazon page.'
          }
        ],
        isError: true
      };
    }

    const searchButton = document.querySelector<HTMLInputElement>(
      '#nav-search-submit-button'
    );
    if (!searchButton) {
      return {
        content: [
          {
            type: 'text',
            text: 'Search button not found. Make sure you are on an Amazon page.'
          }
        ],
        isError: true
      };
    }

    searchInput.value = query;
    searchInput.dispatchEvent(new Event('input', {bubbles: true}));
    searchButton.click();

    return {
      content: [
        {
          type: 'text',
          text: `Searching Amazon for: "${query}". Use amazon_get_results to retrieve the search results after the page loads.`
        }
      ]
    };
  }
};
