export const tool = {
  name: 'googledocs_search',
  description: 'Search for documents in Google Docs by query string',
  inputSchema: {
    type: 'object',
    properties: {
      query: {type: 'string', description: 'Search query to find documents'}
    },
    required: ['query']
  },
  async execute(rawInput: {query?: string}) {
    const {query} = rawInput || {};

    if (!query) {
      return {
        content: [{type: 'text' as const, text: 'Search query is required'}],
        isError: true
      };
    }

    const searchInput =
      document.querySelector<HTMLInputElement>('input[name="q"]');
    if (!searchInput) {
      return {
        content: [
          {
            type: 'text' as const,
            text: 'Search input not found. Make sure you are on the Google Docs homepage.'
          }
        ],
        isError: true
      };
    }

    // Focus the input and set the value
    searchInput.focus();
    searchInput.value = query;

    // Dispatch input event to trigger search
    searchInput.dispatchEvent(new Event('input', {bubbles: true}));

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
      content: [{type: 'text' as const, text: `Searching for "${query}"`}],
      structuredContent: {query, action: 'search_initiated'}
    };
  }
};
