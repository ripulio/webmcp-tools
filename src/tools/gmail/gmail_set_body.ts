import type {ToolDefinition} from 'webmcp-polyfill';

export const tool: ToolDefinition = {
  name: 'gmail_set_body',
  description:
    'Set the email body content in the Gmail compose dialog. The compose dialog must be open first.',
  inputSchema: {
    type: 'object',
    properties: {
      body: {
        type: 'string',
        description: 'The email body text'
      }
    },
    required: ['body']
  },
  async execute(input) {
    const {body} = input as {body: string};

    // Find the body contenteditable div
    const bodyDiv = document.querySelector<HTMLDivElement>(
      'div[aria-label="Message Body"]'
    );

    if (!bodyDiv) {
      return {
        content: [
          {
            type: 'text',
            text: 'Message body field not found. Make sure the compose dialog is open.'
          }
        ],
        isError: true
      };
    }

    // Focus and set the content
    // Using textContent to avoid Trusted Types policy restrictions
    bodyDiv.focus();
    bodyDiv.textContent = body;

    // Dispatch events to trigger Gmail's handlers
    bodyDiv.dispatchEvent(new Event('input', {bubbles: true}));

    return {
      content: [
        {type: 'text', text: `Email body set (${body.length} characters)`}
      ]
    };
  }
};
