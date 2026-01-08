import type {ToolDefinition} from 'webmcp-polyfill';

export const tool: ToolDefinition = {
  name: 'gmail_open_compose',
  description: 'Open the compose dialog to write a new email in Gmail',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  },
  async execute() {
    const composeBtn = document.querySelector<HTMLElement>('div.T-I.T-I-KE');

    if (!composeBtn) {
      return {
        content: [
          {
            type: 'text',
            text: 'Compose button not found. Make sure you are on Gmail.'
          }
        ],
        isError: true
      };
    }

    composeBtn.click();

    // Wait for compose dialog to appear
    await new Promise((resolve) => setTimeout(resolve, 500));

    const composeDialog =
      document.querySelector('div[aria-label="New Message"]') ||
      document.querySelector('input[name="subjectbox"]');

    if (!composeDialog) {
      return {
        content: [{type: 'text', text: 'Compose dialog did not open.'}],
        isError: true
      };
    }

    return {
      content: [{type: 'text', text: 'Compose dialog opened successfully.'}]
    };
  }
};
