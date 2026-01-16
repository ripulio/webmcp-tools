import type {ToolDefinition} from 'webmcp-polyfill';

export const tool: ToolDefinition = {
  name: 'aliexpress_search',
  description:
    'Search for products on AliExpress. Enters a search query and submits the search form. After calling this tool, use aliexpress_get_results to retrieve the search results.',
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'The search query to find products on AliExpress'
      }
    },
    required: ['query']
  },
  async execute(input) {
    const {query} = input as {query: string};

    const searchInput =
      document.querySelector<HTMLInputElement>('#search-words');
    if (!searchInput) {
      return {
        content: [
          {
            type: 'text',
            text: 'Search input not found. Make sure you are on an AliExpress page.'
          }
        ],
        isError: true
      };
    }

    searchInput.value = query;
    searchInput.dispatchEvent(new Event('input', {bubbles: true}));

    // Find and click the search button
    const searchButton = document.querySelector<HTMLInputElement>(
      'input.search--submit--2VTbd-T'
    );
    if (!searchButton) {
      return {
        content: [
          {
            type: 'text',
            text: 'Search button not found. Make sure you are on an AliExpress page.'
          }
        ],
        isError: true
      };
    }

    searchButton.click();

    return {
      content: [
        {
          type: 'text',
          text: `Searching AliExpress for: "${query}". Use aliexpress_get_results to retrieve the search results after the page loads.`
        }
      ]
    };
  }
};
