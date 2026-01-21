import type {ToolDefinition} from 'webmcp-polyfill';

export const tool: ToolDefinition = {
  name: 'gmail_delete_selected',
  description:
    'Delete the currently selected emails (move to trash). Use gmail_select_email first to select emails.',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  },
  async execute() {
    const deleteBtn = document.querySelector<HTMLElement>(
      '[data-tooltip="Delete"]'
    );

    if (!deleteBtn) {
      return {
        content: [{type: 'text', text: 'Delete button not found.'}],
        isError: true
      };
    }

    // Check if button is enabled (emails are selected)
    if (deleteBtn.getAttribute('aria-disabled') === 'true') {
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

    deleteBtn.click();

    // Wait for action to complete
    await new Promise((resolve) => setTimeout(resolve, 500));

    return {
      content: [{type: 'text', text: 'Selected emails moved to trash.'}]
    };
  }
};
