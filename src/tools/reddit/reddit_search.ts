import type {ToolDefinition} from 'webmcp-polyfill';

export const redditSearch: ToolDefinition = {
  name: 'reddit_search',
  description:
    'Search for content on Reddit. Enters a search query and submits the search form. After calling this tool, use reddit_get_search_results to retrieve the search results.',
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'The search query to find content on Reddit'
      }
    },
    required: ['query']
  },
  async execute(input) {
    const {query} = input as {query: string};

    const searchInput =
      document.querySelector<HTMLInputElement>('input[name="q"]');
    if (!searchInput) {
      return {
        content: [
          {
            type: 'text',
            text: 'Search input not found. Make sure you are on a Reddit page.'
          }
        ],
        isError: true
      };
    }

    const searchForm = document.querySelector<HTMLFormElement>(
      'form[action*="/search"]'
    );
    if (!searchForm) {
      return {
        content: [
          {
            type: 'text',
            text: 'Search form not found. Make sure you are on a Reddit page.'
          }
        ],
        isError: true
      };
    }

    searchInput.value = query;
    searchInput.dispatchEvent(new Event('input', {bubbles: true}));
    searchForm.submit();

    return {
      content: [
        {
          type: 'text',
          text: `Searching Reddit for: "${query}". Use reddit_get_search_results to retrieve the results after the page loads.`
        }
      ]
    };
  }
};
