import type {ToolDefinition} from 'webmcp-polyfill';

export const tool: ToolDefinition = {
  name: 'gmail_go_back',
  description:
    'Go back to the email list from the email view. Returns to the previous view (inbox, sent, etc).',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  },
  async execute() {
    // Use browser back or navigate to inbox
    const currentHash = window.location.hash;

    // If we're viewing a specific email, go back
    if (currentHash.includes('/')) {
      // Extract the folder from hash (e.g., #inbox/FMfcg... -> #inbox)
      const folder = currentHash.split('/')[0];
      window.location.hash = folder;
    } else {
      // Already at list view
      return {
        content: [{type: 'text', text: 'Already at the email list view.'}]
      };
    }

    // Wait for navigation
    await new Promise((resolve) => setTimeout(resolve, 500));

    return {
      content: [{type: 'text', text: 'Returned to email list.'}]
    };
  }
};
