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

    // Try multiple selectors for the search input
    const searchInput = document.querySelector<HTMLInputElement>(
      '#search-words, input[name="SearchText"], input[class*="search"][class*="input"], .search-key input, input[placeholder*="search" i]'
    );
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

    // Clear and set the value
    searchInput.focus();
    searchInput.value = '';
    searchInput.dispatchEvent(new Event('input', {bubbles: true}));
    searchInput.value = query;
    searchInput.dispatchEvent(new Event('input', {bubbles: true}));
    searchInput.dispatchEvent(new Event('change', {bubbles: true}));

    // Find the search button using multiple selectors
    // Look for submit input, button with search icon, or form submission
    const searchButton =
      document.querySelector<HTMLElement>(
        'input[type="submit"][class*="search"], button[class*="search"][class*="submit"], .search-button input, .search-submit, button[class*="SearchButton"]'
      ) ||
      // Fallback: find the form and look for any submit element
      searchInput
        .closest('form')
        ?.querySelector<HTMLElement>(
          'input[type="submit"], button[type="submit"], button:not([type])'
        );

    if (searchButton) {
      searchButton.click();
    } else {
      // Fallback: submit the form directly or press Enter
      const form = searchInput.closest('form');
      if (form) {
        form.submit();
      } else {
        // Simulate pressing Enter
        searchInput.dispatchEvent(
          new KeyboardEvent('keydown', {
            key: 'Enter',
            code: 'Enter',
            keyCode: 13,
            which: 13,
            bubbles: true
          })
        );
      }
    }

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
