import type {ToolDefinition} from 'webmcp-polyfill';

export const slackClearMessageInput: ToolDefinition = {
  name: 'slack_clear_message_input',
  description:
    'Clear the message input field in the currently open channel or conversation.',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  },
  async execute() {
    const messageInput = document.querySelector<HTMLDivElement>(
      '.ql-editor[aria-label*="Message"]'
    );

    if (!messageInput) {
      return {
        content: [
          {
            type: 'text',
            text: 'Message input not found. Make sure you have a channel or conversation open.'
          }
        ],
        isError: true
      };
    }

    messageInput.focus();
    messageInput.innerHTML = '<p><br></p>';
    messageInput.dispatchEvent(new Event('input', {bubbles: true}));

    return {
      content: [
        {
          type: 'text',
          text: 'Message input cleared.'
        }
      ]
    };
  }
};
