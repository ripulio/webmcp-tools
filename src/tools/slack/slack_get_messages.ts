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
    'Get the most recent messages in the current channel or conversation. Automatically scrolls to the bottom to get the latest messages.',
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

    // Use keyboard shortcut to jump to the bottom of the conversation
    // Cmd+J or End key typically jumps to the most recent message
    const endEvent = new KeyboardEvent('keydown', {
      key: 'End',
      code: 'End',
      ctrlKey: true,
      bubbles: true,
      cancelable: true
    });
    document.dispatchEvent(endEvent);
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Get all message items
    const messageItems = document.querySelectorAll<HTMLElement>(
      '.c-virtual_list__item'
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

    // Iterate through all items and extract messages
    messageItems.forEach((item) => {
      const senderEl = item.querySelector('.c-message__sender_button');
      const contentEl = item.querySelector(
        '.p-rich_text_section, .c-message__body'
      );
      const timestampEl = item.querySelector('.c-timestamp__label');

      // Skip items without content
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

    // Return the last N messages (assuming DOM order approximates chronological)
    const recentMessages = messages.slice(-limit);

    const formatted = recentMessages
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
          text: `Found ${recentMessages.length} messages:\n\n${formatted}`
        }
      ],
      structuredContent: {messages: recentMessages}
    };
  }
};
