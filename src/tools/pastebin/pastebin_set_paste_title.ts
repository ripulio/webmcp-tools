import type {ToolDefinition} from 'webmcp-polyfill';

export const tool: ToolDefinition = {
  name: 'pastebin_set_paste_title',
  description:
    'Set the title/name for a new paste on Pastebin. Must be on the Pastebin homepage.',
  inputSchema: {
    type: 'object',
    properties: {
      title: {
        type: 'string',
        description: 'The title for the paste (max 100 characters)'
      }
    },
    required: ['title']
  },
  async execute(input) {
    const {title} = input as {title: string};

    const titleInput = document.querySelector(
      '#postform-name'
    ) as HTMLInputElement;
    if (!titleInput) {
      return {
        content: [
          {
            type: 'text',
            text: 'Paste title input not found. Make sure you are on the Pastebin homepage (pastebin.com).'
          }
        ],
        isError: true
      };
    }

    titleInput.value = title.slice(0, 100);
    titleInput.dispatchEvent(new Event('input', {bubbles: true}));
    titleInput.dispatchEvent(new Event('change', {bubbles: true}));

    return {
      content: [
        {type: 'text', text: `Set paste title to "${title.slice(0, 100)}".`}
      ]
    };
  }
};
