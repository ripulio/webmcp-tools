import type {ToolDefinition} from 'webmcp-polyfill';

export const tool: ToolDefinition = {
  name: 'gmail_forward',
  description:
    'Start forwarding the currently open email. Opens the forward composer. Use gmail_open_email first.',
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

    // Find and click the Forward button (second button in the amn container)
    const forwardBtns = document.querySelectorAll<HTMLElement>(
      '.amn button.AeBiU-I'
    );
    let forwardBtn: HTMLElement | undefined;

    for (const btn of forwardBtns) {
      if (btn.textContent?.trim() === 'Forward') {
        forwardBtn = btn;
        break;
      }
    }

    if (!forwardBtn) {
      return {
        content: [{type: 'text', text: 'Forward button not found.'}],
        isError: true
      };
    }

    forwardBtn.click();

    // Wait for forward composer to open
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Check if forward box opened
    const toInput = document.querySelector('input[aria-label="To recipients"]');

    if (!toInput) {
      return {
        content: [{type: 'text', text: 'Forward composer did not open.'}],
        isError: true
      };
    }

    return {
      content: [
        {
          type: 'text',
          text: 'Forward composer opened. Use gmail_set_recipient to set the recipient, optionally gmail_set_body to add a message, then gmail_send_email to send.'
        }
      ]
    };
  }
};
