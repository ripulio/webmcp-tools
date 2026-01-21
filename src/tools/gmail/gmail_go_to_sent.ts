import type {ToolDefinition} from 'webmcp-polyfill';

export const tool: ToolDefinition = {
  name: 'gmail_go_to_sent',
  description: 'Navigate to the Sent folder.',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  },
  async execute() {
    window.location.hash = '#sent';

    // Wait for navigation
    await new Promise((resolve) => setTimeout(resolve, 500));

    return {
      content: [{type: 'text', text: 'Navigated to Sent.'}]
    };
  }
};
