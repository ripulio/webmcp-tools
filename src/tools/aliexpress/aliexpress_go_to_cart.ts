import type {ToolDefinition} from 'webmcp-polyfill';

export const tool: ToolDefinition = {
  name: 'aliexpress_go_to_cart',
  description:
    'Navigate to the AliExpress shopping cart page. Works from any AliExpress page.',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  },
  async execute() {
    // Find the cart link in the header
    const cartLink = document.querySelector<HTMLAnchorElement>(
      'a[href*="shoppingcart"]'
    );

    if (!cartLink) {
      return {
        content: [
          {
            type: 'text',
            text: 'Cart link not found. Make sure you are on an AliExpress page.'
          }
        ],
        isError: true
      };
    }

    cartLink.click();

    return {
      content: [
        {
          type: 'text',
          text: 'Navigating to shopping cart.'
        }
      ]
    };
  }
};
