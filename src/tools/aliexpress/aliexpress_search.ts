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

    // AliExpress uses React with controlled inputs that don't respond to DOM manipulation
    // Use URL-based navigation instead for reliable search
    const encodedQuery = query.toLowerCase().replace(/\s+/g, '-');
    const searchUrl = `https://www.aliexpress.us/w/wholesale-${encodeURIComponent(encodedQuery)}.html`;

    // Use location.assign for more reliable navigation in tool context
    window.location.assign(searchUrl);

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
