import type {ToolDefinition} from 'webmcp-polyfill';

export const tool: ToolDefinition = {
  name: 'gmail_search',
  description:
    'Search for emails using Gmail search syntax. Supports queries like "from:someone@example.com", "subject:hello", "is:unread", "has:attachment", etc.',
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description:
          'The search query. Can use Gmail search operators like from:, to:, subject:, is:unread, has:attachment, before:, after:, etc.'
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
            text: 'Search input not found. Make sure you are on Gmail.'
          }
        ],
        isError: true
      };
    }

    // Clear and set the search query
    searchInput.focus();
    searchInput.value = query;

    // Dispatch events
    searchInput.dispatchEvent(new Event('input', {bubbles: true}));

    // Submit the search by pressing Enter
    searchInput.dispatchEvent(
      new KeyboardEvent('keydown', {key: 'Enter', keyCode: 13, bubbles: true})
    );

    // Wait for search results
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Check if results loaded
    const resultRows = document.querySelectorAll('tr.zA');
    const noResults = document.querySelector('.TC');

    if (noResults && resultRows.length === 0) {
      return {
        content: [{type: 'text', text: `No emails found matching: "${query}"`}]
      };
    }

    return {
      content: [
        {
          type: 'text',
          text: `Search completed for "${query}". Found ${resultRows.length} results. Use gmail_get_emails to see the results.`
        }
      ]
    };
  }
};
