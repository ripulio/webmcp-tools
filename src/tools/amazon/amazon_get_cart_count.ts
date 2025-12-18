import type {ToolDefinition} from 'webmcp-polyfill';

export const amazonGetCartCount: ToolDefinition = {
  name: 'amazon_get_cart_count',
  description:
    'Get the current number of items in your Amazon shopping cart. This reads the cart count from the navigation bar.',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  },
  async execute() {
    const cartCountEl = document.querySelector('#nav-cart-count');
    if (!cartCountEl) {
      return {
        content: [
          {
            type: 'text',
            text: 'Cart count element not found. Make sure you are on an Amazon page.'
          }
        ],
        isError: true
      };
    }

    const countText = cartCountEl.textContent?.trim() || '0';
    const count = parseInt(countText, 10) || 0;

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
