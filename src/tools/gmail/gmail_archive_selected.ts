import type {ToolDefinition} from 'webmcp-polyfill';

export const tool: ToolDefinition = {
  name: 'gmail_archive_selected',
  description:
    'Archive the currently selected emails. Use gmail_select_email first to select emails.',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  },
  async execute() {
    const archiveBtn = document.querySelector<HTMLElement>(
      '[data-tooltip="Archive"]'
    );

    if (!archiveBtn) {
      return {
        content: [{type: 'text', text: 'Archive button not found.'}],
        isError: true
      };
    }

    // Check if button is enabled (emails are selected)
    if (archiveBtn.getAttribute('aria-disabled') === 'true') {
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

    archiveBtn.click();

    // Wait for action to complete
    await new Promise((resolve) => setTimeout(resolve, 500));

    return {
      content: [{type: 'text', text: 'Selected emails archived.'}]
    };
  }
};
