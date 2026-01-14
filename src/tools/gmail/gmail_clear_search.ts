import type {ToolDefinition} from 'webmcp-polyfill';

export const tool: ToolDefinition = {
  name: 'gmail_clear_search',
  description: 'Clear the current search and return to inbox.',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  },
  async execute() {
    // Navigate to inbox to clear search
    window.location.hash = '#inbox';

    // Wait for navigation
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Clear the search input if present
    const searchInput =
      document.querySelector<HTMLInputElement>('input[name="q"]');
    if (searchInput) {
      searchInput.value = '';
    }

    return {
      content: [{type: 'text', text: 'Search cleared. Returned to inbox.'}]
    };
  }
};
