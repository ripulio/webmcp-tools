import type {ToolDefinition} from 'webmcp-polyfill';

export const slackGetNotificationCount: ToolDefinition = {
  name: 'slack_get_notification_count',
  description:
    'Get the current notification count shown on the Activity button in Slack.',
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

    // The button text typically includes the notification count
    // Format: "1Activity1 notification3" or just "Activity"
    const buttonText = activityButton.textContent || '';

    // Extract the notification count from the text
    // Look for patterns like "1 notification" or a leading number
    const notificationMatch = buttonText.match(/(\d+)\s*notification/i);
    const count = notificationMatch ? parseInt(notificationMatch[1], 10) : 0;

    return {
      content: [
        {
          type: 'text',
          text:
            count > 0
              ? `You have ${count} notification${count === 1 ? '' : 's'}.`
              : 'You have no new notifications.'
        }
      ],
      structuredContent: {notificationCount: count}
    };
  }
};
