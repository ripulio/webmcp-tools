import type {ToolDefinition} from 'webmcp-polyfill';

export const tool: ToolDefinition = {
  name: 'gmail_send_email',
  description:
    'Send the email in the currently open compose dialog. Make sure recipient, subject, and body are set before calling this.',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  },
  async execute() {
    // Find the Send button
    const sendBtn = document.querySelector<HTMLElement>(
      'div[data-tooltip^="Send"][aria-label^="Send"]'
    );

    if (!sendBtn) {
      return {
        content: [
          {
            type: 'text',
            text: 'Send button not found. Make sure the compose dialog is open.'
          }
        ],
        isError: true
      };
    }

    sendBtn.click();

    // Wait for send to process
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Check if compose dialog closed (indicating success)
    const composeStillOpen = document.querySelector('input[name="subjectbox"]');

    if (composeStillOpen) {
      // Check for error messages
      const errorMsg = document.querySelector('.Kj-JD-Jz');
      if (errorMsg) {
        return {
          content: [
            {type: 'text', text: `Send failed: ${errorMsg.textContent}`}
          ],
          isError: true
        };
      }
      return {
        content: [
          {
            type: 'text',
            text: 'Email may not have been sent. Check for any missing fields.'
          }
        ],
        isError: true
      };
    }

    return {
      content: [{type: 'text', text: 'Email sent successfully.'}]
    };
  }
};
