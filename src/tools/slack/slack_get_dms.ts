import type {ToolDefinition} from 'webmcp-polyfill';

interface DirectMessage {
  name: string;
  preview: string;
  presence: string;
  isGroup: boolean;
}

export const slackGetDms: ToolDefinition = {
  name: 'slack_get_dms',
  description:
    'Get the list of direct message conversations visible in the DMs view. Must navigate to DMs first using slack_go_to_dms.',
  inputSchema: {
    type: 'object',
    properties: {
      limit: {
        type: 'number',
        description: 'Maximum number of DMs to return (default: 15)'
      }
    },
    required: []
  },
  async execute(input) {
    const {limit = 15} = input as {limit?: number};

    // Get all DM items from the virtual list
    const dmItems = document.querySelectorAll<HTMLElement>(
      '.c-virtual_list__item'
    );

    if (dmItems.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: 'No DMs found. Make sure you are in the DMs view (use slack_go_to_dms first).'
          }
        ],
        isError: true
      };
    }

    const dms: DirectMessage[] = [];

    for (const item of dmItems) {
      if (dms.length >= limit) break;

      // Skip anchor elements
      if (item.id === 'Xtop-anchor') continue;

      // Look for the DM channel name element (correct selector for Slack DMs view)
      const nameEl = item.querySelector('.p-dms_channel__name');
      if (!nameEl) continue;

      const name = nameEl.textContent?.trim() || '';
      if (!name) continue;

      // Get presence from aria-label
      const presenceEl = item.querySelector('[aria-label]');
      const presence = presenceEl?.getAttribute('aria-label') || 'Unknown';

      // Check if it's a group DM (contains comma in the name)
      const isGroup = name.includes(',');

      // Get preview text from the message preview element
      const previewEl = item.querySelector('.p-dms_channel__preview');
      const preview = previewEl?.textContent?.trim()?.substring(0, 100) || '';

      dms.push({
        name,
        preview,
        presence,
        isGroup
      });
    }

    if (dms.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: 'No DM conversations found in the current view.'
          }
        ]
      };
    }

    const formatted = dms
      .map((dm) => {
        const type = dm.isGroup ? '[Group]' : '[DM]';
        const status = dm.presence !== 'Unknown' ? ` (${dm.presence})` : '';
        const previewText = dm.preview ? `: ${dm.preview}` : '';
        return `${type} ${dm.name}${status}${previewText}`;
      })
      .join('\n');

    return {
      content: [
        {
          type: 'text',
          text: `Found ${dms.length} conversations:\n\n${formatted}`
        }
      ],
      structuredContent: {dms}
    };
  }
};
