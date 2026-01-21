import type {ToolDefinition} from 'webmcp-polyfill';

export const tool: ToolDefinition = {
  name: 'pastebin_submit_paste',
  description:
    'Submit/create the new paste on Pastebin. Must have set paste content first. Will navigate to the created paste page.',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  },
  async execute() {
    const submitButton = document.querySelector(
      'button.btn.-big[type="submit"]'
    ) as HTMLButtonElement;
    if (!submitButton) {
      return {
        content: [
          {
            type: 'text',
            text: 'Submit button not found. Make sure you are on the Pastebin homepage (pastebin.com).'
          }
        ],
        isError: true
      };
    }

    // Check if content is set
    const textarea = document.querySelector(
      '#postform-text'
    ) as HTMLTextAreaElement;
    if (!textarea || !textarea.value.trim()) {
      return {
        content: [
          {
            type: 'text',
            text: 'Paste content is empty. Use pastebin_set_paste_content first to set the content.'
          }
        ],
        isError: true
      };
    }

    submitButton.click();

    return {
      content: [
        {
          type: 'text',
          text: 'Submitting paste. The page will navigate to the created paste URL.'
        }
      ]
    };
  }
};
