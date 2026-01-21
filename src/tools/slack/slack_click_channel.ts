import type {ToolDefinition} from 'webmcp-polyfill';

export const slackClickChannel: ToolDefinition = {
  name: 'slack_click_channel',
  description:
    'Click on a channel in the Slack sidebar to open it. The channel name must match exactly (case-insensitive).',
  inputSchema: {
    type: 'object',
    properties: {
      channelName: {
        type: 'string',
        description: 'The name of the channel to open (without the # symbol)'
      }
    },
    required: ['channelName']
  },
  async execute(input) {
    const {channelName} = input as {channelName: string};
    const lowerChannelName = channelName.toLowerCase();

    const channelItems = document.querySelectorAll<HTMLElement>(
      '[data-qa="channel-sidebar-channel"]'
    );

    let targetChannel: HTMLElement | null = null;
    channelItems.forEach((item) => {
      const nameEl = item.querySelector('.p-channel_sidebar__name');
      const name = nameEl?.textContent?.trim().toLowerCase();
      if (name === lowerChannelName) {
        targetChannel = item;
      }
    });

    if (!targetChannel) {
      return {
        content: [
          {
            type: 'text',
            text: `Channel "${channelName}" not found in sidebar. Use slack_get_channels to see available channels.`
          }
        ],
        isError: true
      };
    }

    const channel = targetChannel as HTMLElement;
    const clickableLink = channel.querySelector<HTMLElement>(
      '.p-channel_sidebar__channel, a, button'
    );
    if (clickableLink) {
      clickableLink.click();
    } else {
      channel.click();
    }

    return {
      content: [
        {
          type: 'text',
          text: `Opened channel: ${channelName}`
        }
      ]
    };
  }
};
