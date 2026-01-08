import type {ToolDefinition} from 'webmcp-polyfill';

export const tool: ToolDefinition = {
  name: 'pastebin_get_paste_content',
  description:
    'Get the content/text of the currently viewed paste. Must be on a paste view page (pastebin.com/XXXXX).',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  },
  async execute() {
    const sourceDiv = document.querySelector('.source') as HTMLElement;
    if (!sourceDiv) {
      return {
        content: [
          {
            type: 'text',
            text: 'Paste content not found. Make sure you are viewing a paste (pastebin.com/XXXXX).'
          }
        ],
        isError: true
      };
    }

    // Get all lines from the ordered list
    const lines = sourceDiv.querySelectorAll('ol li .de1, ol li .de2');
    let content: string;

    if (lines.length > 0) {
      content = Array.from(lines)
        .map((line) => line.textContent || '')
        .join('\n');
    } else {
      // Fallback: get text content directly
      content = sourceDiv.textContent || '';
    }

    return {
      content: [{type: 'text', text: content}],
      structuredContent: {
        content: content,
        lineCount: content.split('\n').length,
        characterCount: content.length
      }
    };
  }
};
