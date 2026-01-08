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

    dmItems.forEach((item) => {
      if (dms.length >= limit) return;

      // Skip anchor elements
      if (item.id === 'Xtop-anchor') return;

      const text = item.textContent?.trim() || '';
      if (!text) return;

      // Parse the DM item text
      // Format is typically: "Name (date/time) preview message"
      const presenceEl = item.querySelector('[aria-label]');
      const presence = presenceEl?.getAttribute('aria-label') || 'Unknown';

      // Check if it's a group DM (contains comma in the first part or has multiple avatars)
      const isGroup = text.includes(',') && !text.startsWith('(you)');

      // Extract name - it's the first part before a date or time pattern
      const parts = text.split(
        /(\d{1,2}\s+\w+|\d{1,2}:\d{2}\s*[AP]M|Yesterday|Today)/
      );
      const name = parts[0]?.trim() || text.substring(0, 50);
      const preview = parts.slice(2).join('').trim().substring(0, 100);

      dms.push({
        name,
        preview,
        presence,
        isGroup
      });
    });

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
