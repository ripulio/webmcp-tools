import type {ToolDefinition} from 'webmcp-polyfill';

export const tool: ToolDefinition = {
  name: 'gmail_mark_read',
  description:
    'Mark the currently selected emails as read. Use gmail_select_email first to select emails.',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  },
  async execute() {
    const markReadBtn = document.querySelector<HTMLElement>(
      '[data-tooltip="Mark as read"]'
    );

    if (!markReadBtn) {
      return {
        content: [{type: 'text', text: 'Mark as read button not found.'}],
        isError: true
      };
    }

    // Check if button is enabled (emails are selected)
    if (markReadBtn.getAttribute('aria-disabled') === 'true') {
      return {
        content: [
          {
            type: 'text',
            text: 'No emails selected. Use gmail_select_email first.'
          }
        ],
        isError: true
      };
    }

    markReadBtn.click();

    // Wait for action to complete
    await new Promise((resolve) => setTimeout(resolve, 300));

    return {
      content: [{type: 'text', text: 'Selected emails marked as read.'}]
    };
  }
};
