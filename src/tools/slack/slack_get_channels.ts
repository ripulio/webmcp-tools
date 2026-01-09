import type {ToolDefinition} from 'webmcp-polyfill';

interface Channel {
  name: string;
  hasUnread: boolean;
  hasDraft: boolean;
}

export const slackGetChannels: ToolDefinition = {
  name: 'slack_get_channels',
  description:
    'Get the list of channels visible in the Slack sidebar. Returns channel names and their status (unread, draft).',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  },
  async execute() {
    const channelItems = document.querySelectorAll<HTMLElement>(
      '[data-qa="channel-sidebar-channel"]'
    );

    if (channelItems.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: 'No channels found in sidebar. Make sure you are in the Slack app and the sidebar is visible.'
          }
        ],
        isError: true
      };
    }

    const channels: Channel[] = [];
    channelItems.forEach((item) => {
      const nameEl = item.querySelector('.p-channel_sidebar__name');
      const name = nameEl?.textContent?.trim();
      if (name) {
        channels.push({
          name,
          hasUnread: item.classList.contains(
            'p-channel_sidebar__channel--unread'
          ),
          hasDraft: item.classList.contains('p-channel_sidebar__channel--draft')
        });
      }
    });

    return {
      content: [
        {
          type: 'text',
          text: `Found ${channels.length} channels:\n${channels
            .map((c) => {
              const status = [];
              if (c.hasUnread) status.push('unread');
              if (c.hasDraft) status.push('draft');
              const statusStr =
                status.length > 0 ? ` (${status.join(', ')})` : '';
              return `- ${c.name}${statusStr}`;
            })
            .join('\n')}`
        }
      ],
      structuredContent: {channels}
    };
  }
};
