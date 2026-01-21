import type {ToolDefinition} from 'webmcp-polyfill';

export const slackGoToDms: ToolDefinition = {
  name: 'slack_go_to_dms',
  description:
    'Navigate to the Direct Messages (DMs) section in Slack. Shows all recent direct message conversations.',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  },
  async execute() {
    const dmsButton = document.querySelector<HTMLButtonElement>('#dms');

    if (!dmsButton) {
      return {
        content: [
          {
            type: 'text',
            text: 'DMs button not found. Make sure you are in the Slack app.'
          }
        ],
        isError: true
      };
    }

    dmsButton.click();

    return {
      content: [
        {
          type: 'text',
          text: 'Navigated to Direct Messages. Use slack_get_dms to see available conversations.'
        }
      ]
    };
  }
};
