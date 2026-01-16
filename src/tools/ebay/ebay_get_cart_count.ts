import type {ToolDefinition} from 'webmcp-polyfill';

export const ebayGetCartCount: ToolDefinition = {
  name: 'ebay_get_cart_count',
  description:
    'Get the current number of items in your eBay shopping cart. This reads the cart count from the navigation bar.',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  },
  async execute() {
    const cartIcon = document.querySelector('.gh-cart__icon');

    if (!cartIcon) {
      return {
        content: [
          {
            type: 'text',
            text: 'Cart element not found. Make sure you are on an eBay page.'
          }
        ],
        isError: true
      };
    }

    const ariaLabel = cartIcon.getAttribute('aria-label') || '';
    const countMatch = ariaLabel.match(/(\d+)\s*item/);
    const count = countMatch ? parseInt(countMatch[1], 10) : 0;

    return {
      content: [
        {
          type: 'text',
          text: `Cart contains ${count} item${count === 1 ? '' : 's'}.`
        }
      ],
      structuredContent: {
        count
      }
    };
  }
};
