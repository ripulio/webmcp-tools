import type {ToolDefinition} from 'webmcp-polyfill';

export const tool: ToolDefinition = {
  name: 'pastebin_set_paste_content',
  description:
    'Set the content/text for a new paste on Pastebin. Must be on the Pastebin homepage.',
  inputSchema: {
    type: 'object',
    properties: {
      content: {
        type: 'string',
        description: 'The text content to paste'
      }
    },
    required: ['content']
  },
  async execute(input) {
    const {content} = input as {content: string};

    const textarea = document.querySelector(
      '#postform-text'
    ) as HTMLTextAreaElement;
    if (!textarea) {
      return {
        content: [
          {
            type: 'text',
            text: 'Paste content textarea not found. Make sure you are on the Pastebin homepage (pastebin.com).'
          }
        ],
        isError: true
      };
    }

    textarea.value = content;
    textarea.dispatchEvent(new Event('input', {bubbles: true}));
    textarea.dispatchEvent(new Event('change', {bubbles: true}));

    return {
      content: [
        {
          type: 'text',
          text: `Set paste content (${content.length} characters).`
        }
      ]
    };
  }
};
