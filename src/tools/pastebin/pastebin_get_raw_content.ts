import type {ToolDefinition} from 'webmcp-polyfill';

export const tool: ToolDefinition = {
  name: 'pastebin_get_raw_content',
  description:
    'Navigate to the raw version of the current paste for plain text content. Must be on a paste view page.',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  },
  async execute() {
    // Check if we're already on a raw page
    if (window.location.pathname.startsWith('/raw/')) {
      const content = document.body.textContent || '';
      return {
        content: [{type: 'text', text: content}],
        structuredContent: {
          content,
          characterCount: content.length
        }
      };
    }

    // Find the raw link
    const rawLink = document.querySelector(
      'a.btn.-small[href*="/raw/"]'
    ) as HTMLAnchorElement;
    if (!rawLink) {
      return {
        content: [
          {
            type: 'text',
            text: 'Raw link not found. Make sure you are viewing a paste (pastebin.com/XXXXX).'
          }
        ],
        isError: true
      };
    }

    rawLink.click();

    return {
      content: [{type: 'text', text: 'Navigating to raw content.'}]
    };
  }
};
