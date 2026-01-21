import type {ToolDefinition} from 'webmcp-polyfill';

export const amazonGoToCart: ToolDefinition = {
  name: 'amazon_go_to_cart',
  description:
    'Navigate to your Amazon shopping cart page. Clicks the cart icon in the navigation bar.',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  },
  async execute() {
    const cartLink = document.querySelector<HTMLAnchorElement>('#nav-cart');
    if (!cartLink) {
      return {
        content: [
          {
            type: 'text',
            text: 'Cart link not found. Make sure you are on an Amazon page.'
          }
        ],
        isError: true
      };
    }

    const cartCountEl = document.querySelector('#nav-cart-count');
    const count = parseInt(cartCountEl?.textContent?.trim() || '0', 10) || 0;

    cartLink.click();

    return {
      content: [
        {
          type: 'text',
          text: `Navigating to cart (${count} item${count === 1 ? '' : 's'}).`
        }
      ]
    };
  }
};
