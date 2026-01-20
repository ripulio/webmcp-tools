import type {ToolDefinition} from 'webmcp-polyfill';

export const ebaySearch: ToolDefinition = {
  name: 'ebay_search',
  description:
    'Search for items on eBay. Enters a search query and submits the search form. After calling this tool, use ebay_get_results to retrieve the search results.',
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'The search query to find items on eBay'
      }
    },
    required: ['query']
  },
  async execute(input) {
    const {query} = input as {query: string};

    const searchInput = document.querySelector<HTMLInputElement>('#gh-ac');
    if (!searchInput) {
      return {
        content: [
          {
            type: 'text',
            text: 'Search input not found. Make sure you are on an eBay page.'
          }
        ],
        isError: true
      };
    }

    const searchButton =
      document.querySelector<HTMLButtonElement>('#gh-search-btn');
    if (!searchButton) {
      return {
        content: [
          {
            type: 'text',
            text: 'Search button not found. Make sure you are on an eBay page.'
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
          text: `Searching eBay for: "${query}". Use ebay_get_results to retrieve the search results after the page loads.`
        }
      ]
    };
  }
};
