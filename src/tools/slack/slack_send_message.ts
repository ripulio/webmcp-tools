import type {ToolDefinition} from 'webmcp-polyfill';

export const slackSendMessage: ToolDefinition = {
  name: 'slack_send_message',
  description:
    'Send a message to the currently open channel or conversation in Slack. The message will be typed and sent immediately.',
  inputSchema: {
    type: 'object',
    properties: {
      message: {
        type: 'string',
        description: 'The message text to send'
      }
    },
    required: ['message']
  },
  async execute(input) {
    const {message} = input as {message: string};

    // Find the message input (Quill editor)
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

    // Focus and clear the input
    messageInput.focus();
    messageInput.innerHTML = '';

    // Insert the message text
    const paragraph = document.createElement('p');
    paragraph.textContent = message;
    messageInput.appendChild(paragraph);

    // Dispatch input event to trigger Slack's internal handlers
    messageInput.dispatchEvent(new Event('input', {bubbles: true}));

    // Wait a moment for Slack to process
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Find and click the send button, or press Enter
    const sendButton = document.querySelector<HTMLButtonElement>(
      '[data-qa="texty_send_button"], button[aria-label="Send"]'
    );

    if (sendButton && !sendButton.disabled) {
      sendButton.click();
    } else {
      // Press Enter to send
      messageInput.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'Enter',
          keyCode: 13,
          bubbles: true
        })
      );
    }

    return {
      content: [
        {
          type: 'text',
          text: `Message sent: "${message.substring(0, 50)}${message.length > 50 ? '...' : ''}"`
        }
      ]
    };
  }
};
