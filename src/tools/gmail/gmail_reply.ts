import type {ToolDefinition} from 'webmcp-polyfill';

export const tool: ToolDefinition = {
  name: 'gmail_reply',
  description:
    'Start a reply to the currently open email. Opens the reply composer. Use gmail_open_email first.',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  },
  async execute() {
    // Check if we're viewing an email
    const emailHeader = document.querySelector('h2.hP');

    if (!emailHeader) {
      return {
        content: [
          {
            type: 'text',
            text: 'No email is currently open. Use gmail_open_email first.'
          }
        ],
        isError: true
      };
    }

    // Find and click the Reply button
    const replyBtn = document.querySelector<HTMLElement>('.amn button.AeBiU-I');

    if (!replyBtn) {
      return {
        content: [{type: 'text', text: 'Reply button not found.'}],
        isError: true
      };
    }

    replyBtn.click();

    // Wait for reply composer to open
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Check if reply box opened
    const replyBody = document.querySelector('div[aria-label="Message Body"]');

    if (!replyBody) {
      return {
        content: [{type: 'text', text: 'Reply composer did not open.'}],
        isError: true
      };
    }

    return {
      content: [
        {
          type: 'text',
          text: 'Reply composer opened. Use gmail_set_body to write your reply, then gmail_send_email to send.'
        }
      ]
    };
  }
};
