import type {ToolDefinition} from 'webmcp-polyfill';

export const ebayWatchItem: ToolDefinition = {
  name: 'ebay_watch_item',
  description:
    'Add the current item to your eBay watchlist. Must be on an eBay item listing page. The watchlist allows you to track items and receive notifications.',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  },
  async execute() {
    const watchBtn =
      document.querySelector<HTMLButtonElement>('.x-watch-heart-btn');

    if (!watchBtn) {
      return {
        content: [
          {
            type: 'text',
            text: 'Watch button not found. Make sure you are on an eBay item listing page.'
          }
        ],
        isError: true
      };
    }

    const titleEl = document.querySelector('h1');
    const title = titleEl?.textContent?.trim() || 'Unknown item';

    const itemIdMatch = window.location.pathname.match(/\/itm\/(\d+)/);
    const itemId = itemIdMatch ? itemIdMatch[1] : 'Unknown';

    watchBtn.click();

    return {
      content: [
        {
          type: 'text',
          text: `Adding to watchlist: "${title.substring(0, 80)}${title.length > 80 ? '...' : ''}" (Item ID: ${itemId})`
        }
      ],
      structuredContent: {
        itemId,
        title
      }
    };
  }
};
