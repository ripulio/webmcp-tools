import type {ToolDefinition} from 'webmcp-polyfill';

export const tool: ToolDefinition = {
  name: 'gmail_go_to_trash',
  description: 'Navigate to the Trash folder.',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  },
  async execute() {
    window.location.hash = '#trash';

    // Wait for navigation
    await new Promise((resolve) => setTimeout(resolve, 500));

    return {
      content: [{type: 'text', text: 'Navigated to Trash.'}]
    };
  }
};
