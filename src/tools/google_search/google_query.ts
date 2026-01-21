import type {ToolDefinition} from 'webmcp-polyfill';

export const googleQuery: ToolDefinition = {
  name: 'google_query',
  description:
    'Perform a Google search. Enters a search query and submits the search form. After calling this tool, use google_get_results to retrieve the search results.',
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'The search query to search for on Google'
      }
    },
    required: ['query']
  },
  async execute(input) {
    const {query} = input as {query: string};

    // Try multiple selectors for the search input (textarea on modern Google, input on older versions)
    const searchInput = document.querySelector<
      HTMLTextAreaElement | HTMLInputElement
    >('textarea[name="q"], input[name="q"]');
    if (!searchInput) {
      return {
        content: [
          {
            type: 'text',
            text: 'Search input not found. Make sure you are on a Google page.'
          }
        ],
        isError: true
      };
    }

    const form = searchInput.closest('form');
    if (!form) {
      return {
        content: [
          {
            type: 'text',
            text: 'Search form not found. Make sure you are on a Google page.'
          }
        ],
        isError: true
      };
    }

    searchInput.value = query;
    searchInput.dispatchEvent(new Event('input', {bubbles: true}));
    form.submit();

    return {
      content: [
        {
          type: 'text',
          text: `Searching Google for: "${query}". Use google_get_results to retrieve the results after the page loads.`
        }
      ]
    };
  }
};
