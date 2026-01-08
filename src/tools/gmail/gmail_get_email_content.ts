import type {ToolDefinition} from 'webmcp-polyfill';

export const tool: ToolDefinition = {
  name: 'gmail_get_email_content',
  description:
    'Get the content of the currently open email including subject, sender, date, and body text.',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  },
  async execute() {
    // Check if we're viewing an email
    const subjectEl = document.querySelector('h2.hP');

    if (!subjectEl) {
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

    const subject = subjectEl.textContent?.trim() || '';

    // Get sender info
    const senderEl = document.querySelector('.gD');
    const sender = senderEl?.textContent?.trim() || '';
    const senderEmail = senderEl?.getAttribute('email') || '';

    // Get date
    const dateEl = document.querySelector('.g3');
    const date = dateEl?.textContent?.trim() || '';

    // Get body content
    const bodyEl = document.querySelector('.a3s.aiL');
    const body = bodyEl?.textContent?.trim() || '';

    // Get recipients if visible
    const toEl = document.querySelector('.g2');
    const to = toEl?.textContent?.trim() || '';

    return {
      content: [
        {
          type: 'text',
          text: `Subject: ${subject}\nFrom: ${sender} <${senderEmail}>\nTo: ${to}\nDate: ${date}\n\n${body.substring(0, 2000)}${body.length > 2000 ? '...' : ''}`
        }
      ],
      structuredContent: {
        subject,
        sender,
        senderEmail,
        to,
        date,
        body
      }
    };
  }
};
