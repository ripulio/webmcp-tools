import type {ToolDefinition} from 'webmcp-polyfill';

export const tool: ToolDefinition = {
  name: 'allrecipes_search',
  description:
    'Search for recipes on Allrecipes by keyword or ingredient. Navigates to the search results page.',
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description:
          'Search query (e.g., "chicken soup", "pasta", "vegetarian dinner")'
      }
    },
    required: ['query']
  },
  async execute(input) {
    const {query} = input as {query: string};

    if (!query || !query.trim()) {
      return {
        content: [
          {
            type: 'text',
            text: 'Search query cannot be empty. Please provide a search term.'
          }
        ],
        isError: true
      };
    }

    const searchUrl = `https://www.allrecipes.com/search?q=${encodeURIComponent(query)}`;
    window.location.href = searchUrl;

    return {
      content: [
        {
          type: 'text',
          text: `Navigating to search results for "${query}". Use allrecipes_get_search_results to extract the results once the page loads.`
        }
      ]
    };
  }
};
