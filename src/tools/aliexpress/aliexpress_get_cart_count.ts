import type {ToolDefinition} from 'webmcp-polyfill';

export const tool: ToolDefinition = {
  name: 'aliexpress_get_cart_count',
  description:
    'Get the current number of items in the AliExpress shopping cart. Works from any AliExpress page.',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  },
  async execute() {
    // Find the cart link in the header which shows the count
    const cartLink = document.querySelector<HTMLAnchorElement>(
      'a[href*="shoppingcart"]'
    );

    if (!cartLink) {
      return {
        content: [
          {
            type: 'text',
            text: 'Cart element not found. Make sure you are on an AliExpress page.'
          }
        ],
        isError: true
      };
    }

    // The cart text typically contains "Cart" and a number
    const cartText = cartLink.textContent || '';
    const countMatch = cartText.match(/(\d+)/);
    const count = countMatch ? parseInt(countMatch[1], 10) : 0;

    return {
      content: [
        {
          type: 'text',
          text: `Shopping cart contains ${count} item${count !== 1 ? 's' : ''}.`
        }
      ],
      structuredContent: {
        count
      }
    };
  }
};
