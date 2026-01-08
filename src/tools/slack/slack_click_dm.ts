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

    const dmItems = document.querySelectorAll<HTMLElement>(
      '.c-virtual_list__item'
    );

    let targetItem: HTMLElement | null = null;

    dmItems.forEach((item) => {
      if (targetItem) return;
      const text = item.textContent?.toLowerCase() || '';
      if (text.includes(lowerName)) {
        targetItem = item;
      }
    });

    if (!targetItem) {
      // Also try sidebar DM items
      const sidebarDms = document.querySelectorAll<HTMLElement>(
        '.p-channel_sidebar__channel'
      );
      sidebarDms.forEach((item) => {
        if (targetItem) return;
        const nameEl = item.querySelector('.p-channel_sidebar__name');
        const itemName = nameEl?.textContent?.toLowerCase() || '';
        if (itemName.includes(lowerName)) {
          targetItem = item;
        }
      });
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

    // Find the clickable element
    const item = targetItem as HTMLElement;
    const clickable = item.querySelector<HTMLElement>('a') || item;
    clickable.click();

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
