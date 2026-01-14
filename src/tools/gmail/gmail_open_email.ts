import type {ToolDefinition} from 'webmcp-polyfill';

export const tool: ToolDefinition = {
  name: 'gmail_open_email',
  description:
    'Open an email by its index in the list. Use gmail_get_emails first to see available emails and their indices.',
  inputSchema: {
    type: 'object',
    properties: {
      index: {
        type: 'number',
        description:
          'The index of the email to open (0-based, from gmail_get_emails)'
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
    const subjectArea =
      row.querySelector<HTMLElement>('.y6') ||
      row.querySelector<HTMLElement>('td.xY + td');

    if (subjectArea) {
      subjectArea.click();
    } else {
      (row as HTMLElement).click();
    }

    // Wait for email to load
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Verify email opened by checking for email header
    const emailHeader = document.querySelector('h2.hP');

    if (!emailHeader) {
      return {
        content: [{type: 'text', text: 'Email may not have opened correctly.'}],
        isError: true
      };
    }

    return {
      content: [
        {type: 'text', text: `Opened email: ${emailHeader.textContent?.trim()}`}
      ]
    };
  }
};
