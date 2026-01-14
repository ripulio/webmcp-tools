import type {ToolDefinition} from 'webmcp-polyfill';

export const slackClickDm: ToolDefinition = {
  name: 'slack_click_dm',
  description:
    'Open a direct message conversation by clicking on it. The name can be a partial match (case-insensitive). Works best from the DMs view.',
  inputSchema: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description:
          'The name of the person or group to open a conversation with'
      }
    },
    required: ['name']
  },
  async execute(input) {
    const {name} = input as {name: string};
    const lowerName = name.toLowerCase();

    // Get all DM items from the virtual list
    const dmItems = document.querySelectorAll<HTMLElement>(
      '.c-virtual_list__item'
    );

    let targetItem: HTMLElement | null = null;

    for (const item of dmItems) {
      // Skip the top anchor element
      if (item.id === 'Xtop-anchor') continue;

      // Look for the DM channel name element (correct selector for Slack DMs view)
      const nameEl = item.querySelector('.p-dms_channel__name');

      if (nameEl) {
        const itemName = nameEl.textContent?.toLowerCase() || '';
        if (itemName.includes(lowerName)) {
          targetItem = item;
          break;
        }
      }
    }

    // Fallback: try sidebar DM items if not in DMs view
    if (!targetItem) {
      const sidebarDms = document.querySelectorAll<HTMLElement>(
        '.p-channel_sidebar__channel'
      );
      for (const item of sidebarDms) {
        const nameEl = item.querySelector('.p-channel_sidebar__name');
        const itemName = nameEl?.textContent?.toLowerCase() || '';
        if (itemName.includes(lowerName)) {
          targetItem = item;
          break;
        }
      }
    }

    if (!targetItem) {
      return {
        content: [
          {
            type: 'text',
            text: `DM with "${name}" not found. Use slack_get_dms to see available conversations.`
          }
        ],
        isError: true
      };
    }

    // Click on the .p-dms_channel element (NOT the <a> tag which may be injected content)
    const dmChannel = targetItem.querySelector<HTMLElement>('.p-dms_channel');
    if (dmChannel) {
      dmChannel.click();
    } else {
      // Fallback for sidebar items
      targetItem.click();
    }

    return {
      content: [
        {
          type: 'text',
          text: `Opened conversation with: ${name}`
        }
      ]
    };
  }
};
