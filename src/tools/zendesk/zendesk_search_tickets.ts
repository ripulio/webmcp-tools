import type {ToolDefinition} from 'webmcp-polyfill';

export const tool: ToolDefinition = {
  name: 'zendesk_search_tickets',
  description: 'Search for tickets in Zendesk using a search query',
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description:
          'The search query (e.g., "status:open", "assignee:me", "priority:high", or free text)'
      }
    },
    required: ['query']
  },
  async execute(input) {
    const {query} = input as {query: string};

    // Try the toolbar search box first, then the advanced search input
    let searchInput = document.querySelector<HTMLInputElement>(
      '[data-test-id="search-dialog-input"]'
    );

    // If not found, try clicking the search box to open it
    if (!searchInput) {
      const searchBox = document.querySelector<HTMLElement>(
        '[data-test-id="toolbar-search-box"]'
      );
      if (searchBox) {
        searchBox.click();
        await new Promise((resolve) => setTimeout(resolve, 300));
        searchInput = document.querySelector<HTMLInputElement>(
          '[data-test-id="search-dialog-input"]'
        );
      }
    }

    // Try the advanced search input on search results page
    if (!searchInput) {
      searchInput = document.querySelector<HTMLInputElement>(
        '[data-test-id="search_advanced-search-box_input-field_media-input"]'
      );
    }

    if (!searchInput) {
      return {
        content: [
          {
            type: 'text',
            text: 'Search input not found. Make sure you are on a Zendesk Agent Workspace page.'
          }
        ],
        isError: true
      };
    }

    // Focus and clear existing value
    searchInput.focus();
    searchInput.value = '';
    searchInput.dispatchEvent(new Event('input', {bubbles: true}));

    // Set new value
    searchInput.value = query;
    searchInput.dispatchEvent(new Event('input', {bubbles: true}));
    searchInput.dispatchEvent(new Event('change', {bubbles: true}));

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
      content: [
        {
          type: 'text',
          text: `Searching for: "${query}". Use zendesk_get_tickets to retrieve the results after the page loads.`
        }
      ]
    };
  }
};
