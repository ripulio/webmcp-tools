import type {ToolDefinition} from 'webmcp-polyfill';

export const tool: ToolDefinition = {
  name: 'gmail_select_email',
  description:
    'Select or deselect an email by its index for bulk actions. Use gmail_get_emails first to see available emails.',
  inputSchema: {
    type: 'object',
    properties: {
      index: {
        type: 'number',
        description:
          'The index of the email to select (0-based, from gmail_get_emails)'
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
    const checkbox = row.querySelector<HTMLElement>('div[role="checkbox"]');

    if (!checkbox) {
      return {
        content: [{type: 'text', text: 'Checkbox not found for this email.'}],
        isError: true
      };
    }

    checkbox.click();

    const isNowSelected = checkbox.getAttribute('aria-checked') === 'true';

    return {
      content: [
        {
          type: 'text',
          text: `Email at index ${index} is now ${isNowSelected ? 'selected' : 'deselected'}.`
        }
      ]
    };
  }
};
