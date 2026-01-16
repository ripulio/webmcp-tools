import type {ToolDefinition} from 'webmcp-polyfill';

export const ebayPlaceBid: ToolDefinition = {
  name: 'ebay_place_bid',
  description:
    'Place a bid on an auction item. Must be on an eBay item listing page with an active auction. This clicks the Place Bid button to initiate the bidding process.',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  },
  async execute() {
    const bidBtn = document.querySelector<HTMLAnchorElement>(
      '.x-bid-action a.ux-call-to-action, #bidBtn_btn_1'
    );

    if (!bidBtn) {
      const buyNowBtn = document.querySelector(
        '.x-bin-action a.ux-call-to-action, #binBtn_btn_1'
      );
      if (buyNowBtn) {
        return {
          content: [
            {
              type: 'text',
              text: 'This is a Buy It Now listing, not an auction. Use ebay_add_to_cart or click Buy Now instead.'
            }
          ],
          isError: true
        };
      }

      return {
        content: [
          {
            type: 'text',
            text: 'Place Bid button not found. Make sure you are on an eBay auction listing page.'
          }
        ],
        isError: true
      };
    }

    const titleEl = document.querySelector('h1');
    const title = titleEl?.textContent?.trim() || 'Unknown item';

    const priceEl = document.querySelector(
      '.x-price-primary, [data-testid="x-price-primary"]'
    );
    const currentBid = priceEl?.textContent?.trim() || 'Unknown';

    bidBtn.click();

    return {
      content: [
        {
          type: 'text',
          text: `Opening bid dialog for: "${title.substring(0, 80)}${title.length > 80 ? '...' : ''}"\nCurrent bid: ${currentBid}\n\nPlease enter your bid amount in the dialog that appeared.`
        }
      ],
      structuredContent: {
        title,
        currentBid
      }
    };
  }
};
