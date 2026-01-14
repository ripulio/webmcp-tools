import type {ToolDefinition} from 'webmcp-polyfill';

export const tool: ToolDefinition = {
  name: 'gmail_set_recipient',
  description:
    'Set the recipient (To field) in the Gmail compose dialog. The compose dialog must be open first.',
  inputSchema: {
    type: 'object',
    properties: {
      email: {
        type: 'string',
        description: 'The email address of the recipient'
      }
    },
    required: ['email']
  },
  async execute(input) {
    const {email} = input as {email: string};

    // Find the To input field
    const toInput = document.querySelector<HTMLInputElement>(
      'input[aria-label="To recipients"]'
    );

    if (!toInput) {
      return {
        content: [
          {
            type: 'text',
            text: 'To field not found. Make sure the compose dialog is open.'
          }
        ],
        isError: true
      };
    }

    // Focus and set the value
    toInput.focus();
    toInput.value = email;

    // Dispatch events to trigger Gmail's handlers
    toInput.dispatchEvent(new Event('input', {bubbles: true}));
    toInput.dispatchEvent(new Event('change', {bubbles: true}));

    // Press Tab to confirm the recipient
    await new Promise((resolve) => setTimeout(resolve, 100));
    toInput.dispatchEvent(
      new KeyboardEvent('keydown', {key: 'Tab', keyCode: 9, bubbles: true})
    );

    return {
      content: [{type: 'text', text: `Recipient set to: ${email}`}]
    };
  }
};
