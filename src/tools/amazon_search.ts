export const tool = {
  name: 'amazon_search',
  description:
    'Search for products on Amazon. Enter a search query and navigate to the search results page.',
  inputSchema: {
    type: 'object',
    properties: {
      query: {type: 'string', description: 'Search query for products'}
    },
    required: ['query']
  },
  async execute(rawInput: {query?: string}) {
    const {query} = rawInput || {};

    if (!query || query.trim() === '') {
      return {
        content: [{type: 'text' as const, text: 'Search query is required.'}],
        isError: true
      };
    }

    const searchInput = document.querySelector(
      '#twotabsearchtextbox'
    ) as HTMLInputElement;
    if (!searchInput) {
      return {
        content: [
          {
            type: 'text' as const,
            text: 'Search input not found. Make sure you are on the Amazon homepage.'
          }
        ],
        isError: true
      };
    }

    const searchForm = document.querySelector(
      '#nav-search-bar-form'
    ) as HTMLFormElement;
    if (!searchForm) {
      return {
        content: [
          {
            type: 'text' as const,
            text: 'Search form not found. Make sure you are on the Amazon homepage.'
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
        {type: 'text' as const, text: `Searching Amazon for: "${query}"`}
      ],
      structuredContent: {query, action: 'search_submitted'}
    };
  }
};
