import type {ToolDefinition} from 'webmcp-polyfill';

export const tool: ToolDefinition = {
  name: 'gmail_mark_unread',
  description:
    'Mark the currently selected emails as unread. Use gmail_select_email first to select emails.',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  },
  async execute() {
    const markUnreadBtn = document.querySelector<HTMLElement>(
      '[data-tooltip="Mark as unread"]'
    );

    if (!markUnreadBtn) {
      return {
        content: [{type: 'text', text: 'Mark as unread button not found.'}],
        isError: true
      };
    }

    // Check if button is enabled (emails are selected)
    if (markUnreadBtn.getAttribute('aria-disabled') === 'true') {
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

    markUnreadBtn.click();

    // Wait for action to complete
    await new Promise((resolve) => setTimeout(resolve, 300));

    return {
      content: [{type: 'text', text: 'Selected emails marked as unread.'}]
    };
  }
};
