import type {ToolDefinition} from 'webmcp-polyfill';

export const slackGoToHome: ToolDefinition = {
  name: 'slack_go_to_home',
  description:
    'Navigate to the Home view in Slack. This shows the main channel sidebar and returns you to the default view.',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  },
  async execute() {
    const homeButton = document.querySelector<HTMLButtonElement>('#home');
    if (!homeButton) {
      return {
        content: [
          {
            type: 'text',
            text: 'Home button not found. Make sure you are in the Slack app.'
          }
        ],
        isError: true
      };
    }

    homeButton.click();

    return {
      content: [
        {
          type: 'text',
          text: 'Navigated to Home view.'
        }
      ]
    };
  }
};
