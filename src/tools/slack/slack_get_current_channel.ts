import type {ToolDefinition} from 'webmcp-polyfill';

export const slackGetCurrentChannel: ToolDefinition = {
  name: 'slack_get_current_channel',
  description:
    'Get the name of the currently open channel or conversation in Slack.',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  },
  async execute() {
    // Try to get the channel name from the header
    const headerButton = document.querySelector<HTMLButtonElement>(
      '.p-view_header__big_button'
    );

    if (headerButton) {
      const channelName = headerButton.textContent?.trim();
      if (channelName) {
        return {
          content: [
            {
              type: 'text',
              text: `Current channel: ${channelName}`
            }
          ],
          structuredContent: {channelName}
        };
      }
    }

    // Fallback: try to get from page title
    const title = document.title;
    const match = title.match(/^(.+?)\s*(?:\(Channel\)|-).*Slack$/);
    if (match) {
      const channelName = match[1].trim();
      return {
        content: [
          {
            type: 'text',
            text: `Current channel: ${channelName}`
          }
        ],
        structuredContent: {channelName}
      };
    }

    return {
      content: [
        {
          type: 'text',
          text: 'Could not determine current channel. Make sure you have a channel or conversation open.'
        }
      ],
      isError: true
    };
  }
};
