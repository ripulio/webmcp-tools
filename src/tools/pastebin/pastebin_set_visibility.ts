import type {ToolDefinition} from 'webmcp-polyfill';

export const tool: ToolDefinition = {
  name: 'pastebin_set_visibility',
  description:
    'Set the visibility/privacy for a new paste. Options: Public (visible in archive), Unlisted (accessible via URL only), Private (only visible to you, requires login).',
  inputSchema: {
    type: 'object',
    properties: {
      visibility: {
        type: 'string',
        description:
          'The visibility setting: "Public", "Unlisted", or "Private"'
      }
    },
    required: ['visibility']
  },
  async execute(input) {
    const {visibility} = input as {visibility: string};

    const select = document.querySelector(
      '#postform-status'
    ) as HTMLSelectElement;
    if (!select) {
      return {
        content: [
          {
            type: 'text',
            text: 'Visibility select not found. Make sure you are on the Pastebin homepage (pastebin.com).'
          }
        ],
        isError: true
      };
    }

    // Find the option that matches the visibility (case-insensitive)
    const options = Array.from(select.options);
    const matchingOption = options.find(
      (opt) => opt.text.toLowerCase() === visibility.toLowerCase()
    );

    if (!matchingOption) {
      const availableOptions = options.map((opt) => opt.text).join(', ');
      return {
        content: [
          {
            type: 'text',
            text: `Visibility "${visibility}" not found. Available options: ${availableOptions}`
          }
        ],
        isError: true
      };
    }

    select.value = matchingOption.value;
    select.dispatchEvent(new Event('change', {bubbles: true}));

    return {
      content: [
        {type: 'text', text: `Set visibility to "${matchingOption.text}".`}
      ]
    };
  }
};
