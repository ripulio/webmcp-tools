import type {ToolDefinition} from 'webmcp-polyfill';

export const tool: ToolDefinition = {
  name: 'pastebin_clone_paste',
  description:
    'Clone the current paste to create a new paste with the same content. Navigates to the paste creation page with content pre-filled.',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  },
  async execute() {
    const cloneLink = document.querySelector(
      'a.btn.-small[href*="/clone/"]'
    ) as HTMLAnchorElement;
    if (!cloneLink) {
      return {
        content: [
          {
            type: 'text',
            text: 'Clone link not found. Make sure you are viewing a paste (pastebin.com/XXXXX).'
          }
        ],
        isError: true
      };
    }

    cloneLink.click();

    return {
      content: [
        {
          type: 'text',
          text: 'Navigating to clone page. The paste content will be pre-filled for editing.'
        }
      ]
    };
  }
};
