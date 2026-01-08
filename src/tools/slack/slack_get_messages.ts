import type {ToolDefinition} from 'webmcp-polyfill';

interface Message {
  sender: string;
  content: string;
  timestamp: string;
  isSystemMessage: boolean;
}

export const slackGetMessages: ToolDefinition = {
  name: 'slack_get_messages',
  description:
    'Get the messages visible in the current channel or conversation. Returns the most recent messages in view.',
  inputSchema: {
    type: 'object',
    properties: {
      limit: {
        type: 'number',
        description: 'Maximum number of messages to return (default: 20)'
      }
    },
    required: []
  },
  async execute(input) {
    const {limit = 20} = input as {limit?: number};

    const messageItems = document.querySelectorAll<HTMLElement>(
      '#message-list .c-virtual_list__item'
    );

    if (messageItems.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: 'No messages found. Make sure you have a channel or conversation open.'
          }
        ],
        isError: true
      };
    }

    const messages: Message[] = [];

    messageItems.forEach((item) => {
      if (messages.length >= limit) return;

      const senderEl = item.querySelector('.c-message__sender_button');
      const contentEl = item.querySelector(
        '.p-rich_text_section, .c-message__body'
      );
      const timestampEl = item.querySelector('.c-timestamp__label');

      // Skip items without content (like day dividers that only have buttons)
      if (!contentEl) return;

      const sender = senderEl?.textContent?.trim() || 'System';
      const content = contentEl?.textContent?.trim() || '';
      const timestamp = timestampEl?.textContent?.trim() || '';
      const isSystemMessage = !senderEl;

      if (content) {
        messages.push({
          sender,
          content: content.substring(0, 500),
          timestamp,
          isSystemMessage
        });
      }
    });

    if (messages.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: 'No messages with content found in the current view.'
          }
        ]
      };
    }

    const formatted = messages
      .map((m) => {
        const prefix = m.isSystemMessage ? '[System]' : `[${m.sender}]`;
        const time = m.timestamp ? ` (${m.timestamp})` : '';
        return `${prefix}${time}: ${m.content}`;
      })
      .join('\n\n');

    return {
      content: [
        {
          type: 'text',
          text: `Found ${messages.length} messages:\n\n${formatted}`
        }
      ],
      structuredContent: {messages}
    };
  }
};
