import type {ToolDefinition} from 'webmcp-polyfill';

export const tool: ToolDefinition = {
  name: 'gmail_go_to_inbox',
  description: 'Navigate to the Inbox folder.',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  },
  async execute() {
    window.location.hash = '#inbox';

    // Wait for navigation
    await new Promise((resolve) => setTimeout(resolve, 500));

    return {
      content: [{type: 'text', text: 'Navigated to Inbox.'}]
    };
  }
};
