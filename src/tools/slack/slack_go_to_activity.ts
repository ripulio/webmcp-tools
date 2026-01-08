import type {ToolDefinition} from 'webmcp-polyfill';

export const slackGoToActivity: ToolDefinition = {
  name: 'slack_go_to_activity',
  description:
    'Navigate to the Activity feed in Slack. Shows mentions, reactions, and other notifications.',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  },
  async execute() {
    const activityButton =
      document.querySelector<HTMLButtonElement>('#activity');

    if (!activityButton) {
      return {
        content: [
          {
            type: 'text',
            text: 'Activity button not found. Make sure you are in the Slack app.'
          }
        ],
        isError: true
      };
    }

    activityButton.click();

    return {
      content: [
        {
          type: 'text',
          text: 'Navigated to Activity feed.'
        }
      ]
    };
  }
};
