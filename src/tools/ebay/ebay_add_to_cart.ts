import type {ToolDefinition} from 'webmcp-polyfill';

export const ebayAddToCart: ToolDefinition = {
  name: 'ebay_add_to_cart',
  description:
    'Add the current item to your eBay shopping cart. Must be on an item listing page with an available "Add to cart" button.',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  },
  async execute() {
    const addToCartBtn = document.querySelector<HTMLAnchorElement>(
      '.x-atc-action a.ux-call-to-action, #atcBtn_btn_1'
    );

    if (!addToCartBtn) {
      const buyNowBtn = document.querySelector(
        '.x-bin-action a.ux-call-to-action, #binBtn_btn_1'
      );
      if (buyNowBtn) {
        return {
          content: [
            {
              type: 'text',
              text: 'Add to Cart button not found, but Buy It Now is available. The seller may have disabled cart functionality for this item.'
            }
          ],
          isError: true
        };
      }

      return {
        content: [
          {
            type: 'text',
            text: 'Add to Cart button not found. Make sure you are on an eBay item listing page.'
          }
        ],
        isError: true
      };
    }

    const titleEl = document.querySelector('h1');
    const title = titleEl?.textContent?.trim() || 'Unknown item';

    addToCartBtn.click();

    return {
      content: [
        {
          type: 'text',
          text: `Adding to cart: "${title.substring(0, 80)}${title.length > 80 ? '...' : ''}". Use ebay_get_cart_count to verify the item was added.`
        }
      ]
    };
  }
};
