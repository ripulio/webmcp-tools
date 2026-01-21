import type {ToolDefinition} from 'webmcp-polyfill';

export const tool: ToolDefinition = {
  name: 'gmail_star_email',
  description:
    'Toggle the star on an email by its index. Use gmail_get_emails first to see available emails.',
  inputSchema: {
    type: 'object',
    properties: {
      index: {
        type: 'number',
        description:
          'The index of the email to star/unstar (0-based, from gmail_get_emails)'
      }
    },
    required: ['index']
  },
  async execute(input) {
    const {index} = input as {index: number};

    const rows = document.querySelectorAll('tr.zA');

    if (rows.length === 0) {
      return {
        content: [{type: 'text', text: 'No emails found in the current view.'}],
        isError: true
      };
    }

    if (index < 0 || index >= rows.length) {
      return {
        content: [
          {
            type: 'text',
            text: `Invalid index ${index}. Valid range is 0-${rows.length - 1}.`
          }
        ],
        isError: true
      };
    }

    const row = rows[index];
    const starBtn = row.querySelector<HTMLElement>('.T-KT');

    if (!starBtn) {
      return {
        content: [
          {type: 'text', text: 'Star button not found for this email.'}
        ],
        isError: true
      };
    }

    const wasStarred = starBtn.getAttribute('aria-label')?.includes('Starred');
    starBtn.click();

    // Wait for action to complete
    await new Promise((resolve) => setTimeout(resolve, 300));

    return {
      content: [
        {
          type: 'text',
          text: `Email at index ${index} is now ${wasStarred ? 'unstarred' : 'starred'}.`
        }
      ]
    };
  }
};
