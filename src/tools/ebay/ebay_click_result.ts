import type {ToolDefinition} from 'webmcp-polyfill';

export const ebayClickResult: ToolDefinition = {
  name: 'ebay_click_result',
  description:
    'Click on an item from the search results to navigate to its listing page. Use either the result index (from ebay_get_results) or the item ID.',
  inputSchema: {
    type: 'object',
    properties: {
      index: {
        type: 'number',
        description: 'The index of the search result to click (0-based)'
      },
      itemId: {
        type: 'string',
        description: 'The eBay item ID of the listing to click'
      }
    },
    required: []
  },
  async execute(input) {
    const {index, itemId} = input as {index?: number; itemId?: string};

    if (index === undefined && !itemId) {
      return {
        content: [
          {
            type: 'text',
            text: 'Either index or itemId must be provided.'
          }
        ],
        isError: true
      };
    }

    const resultElements = document.querySelectorAll<HTMLElement>(
      'ul.srp-results li.s-card'
    );

    const validResults = Array.from(resultElements).filter((el) => {
      const link = el.querySelector('a.s-card__link');
      return link && link.getAttribute('href')?.includes('/itm/');
    });

    let targetElement: HTMLElement | null = null;

    if (itemId) {
      targetElement =
        validResults.find((el) => {
          const link = el.querySelector<HTMLAnchorElement>('a.s-card__link');
          return link?.href?.includes(`/itm/${itemId}`);
        }) || null;
    } else if (index !== undefined) {
      targetElement = validResults[index] || null;
    }

    if (!targetElement) {
      return {
        content: [
          {
            type: 'text',
            text: `Item not found. ${itemId ? `Item ID: ${itemId}` : `Index: ${index}`}. Make sure you are on an eBay search results page.`
          }
        ],
        isError: true
      };
    }

    const productLink =
      targetElement.querySelector<HTMLAnchorElement>('a.s-card__link');

    if (!productLink) {
      return {
        content: [
          {
            type: 'text',
            text: 'Item link not found in the search result element.'
          }
        ],
        isError: true
      };
    }

    const href = productLink.href || '';
    const itemIdMatch = href.match(/\/itm\/(\d+)/);
    const foundItemId = itemIdMatch ? itemIdMatch[1] : 'Unknown';

    const titleEl = targetElement.querySelector('.s-card__title');
    const title = titleEl?.textContent?.trim() || 'Unknown';

    // Navigate in same tab instead of clicking (links have target="_blank")
    if (href) {
      window.location.href = href;
    } else {
      productLink.click();
    }

    return {
      content: [
        {
          type: 'text',
          text: `Navigating to item: "${title.substring(0, 80)}${title.length > 80 ? '...' : ''}" (Item ID: ${foundItemId}). Use ebay_get_product_details after the page loads.`
        }
      ]
    };
  }
};
