import type {ToolDefinition} from 'webmcp-polyfill';

export const companiesHouseSearch: ToolDefinition = {
  name: 'companies_house_search',
  description:
    'Search for companies or officers on UK Companies House. Enters a search query and submits the search form. After calling this tool, use companies_house_get_results to retrieve the search results.',
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'The company name or officer name to search for'
      }
    },
    required: ['query']
  },
  async execute(input) {
    const {query} = input as {query: string};

    const searchInput =
      document.querySelector<HTMLInputElement>('#site-search-text');
    if (!searchInput) {
      return {
        content: [
          {
            type: 'text',
            text: 'Search input not found. Make sure you are on a Companies House page.'
          }
        ],
        isError: true
      };
    }

    const searchButton =
      document.querySelector<HTMLButtonElement>('#search-submit');
    if (!searchButton) {
      return {
        content: [
          {
            type: 'text',
            text: 'Search button not found. Make sure you are on a Companies House page.'
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
          text: `Searching Companies House for: "${query}". Use companies_house_get_results to retrieve the search results after the page loads.`
        }
      ]
    };
  }
};
