import type {ToolDefinition} from 'webmcp-polyfill';

export const tool: ToolDefinition = {
  name: 'pastebin_set_expiration',
  description:
    'Set the expiration time for a new paste. Options: Never, Burn after read, 10 Minutes, 1 Hour, 1 Day, 1 Week, 2 Weeks, 1 Month, 6 Months, 1 Year.',
  inputSchema: {
    type: 'object',
    properties: {
      expiration: {
        type: 'string',
        description:
          'The expiration time (e.g., "Never", "1 Hour", "1 Day", "1 Week", "Burn after read")'
      }
    },
    required: ['expiration']
  },
  async execute(input) {
    const {expiration} = input as {expiration: string};

    const select = document.querySelector(
      '#postform-expiration'
    ) as HTMLSelectElement;
    if (!select) {
      return {
        content: [
          {
            type: 'text',
            text: 'Expiration select not found. Make sure you are on the Pastebin homepage (pastebin.com).'
          }
        ],
        isError: true
      };
    }

    // Find the option that matches the expiration (case-insensitive)
    const options = Array.from(select.options);
    const matchingOption = options.find(
      (opt) => opt.text.toLowerCase() === expiration.toLowerCase()
    );

    if (!matchingOption) {
      const availableOptions = options.map((opt) => opt.text).join(', ');
      return {
        content: [
          {
            type: 'text',
            text: `Expiration "${expiration}" not found. Available options: ${availableOptions}`
          }
        ],
        isError: true
      };
    }

    select.value = matchingOption.value;
    select.dispatchEvent(new Event('change', {bubbles: true}));

    return {
      content: [
        {type: 'text', text: `Set expiration to "${matchingOption.text}".`}
      ]
    };
  }
};
