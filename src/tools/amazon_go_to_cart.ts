export const tool = {
  name: 'amazon_go_to_cart',
  description: 'Navigate to the Amazon shopping cart page.',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  },
  async execute() {
    const cartLink = document.querySelector('#nav-cart') as HTMLAnchorElement;
    if (!cartLink) {
      return {
        content: [{ type: 'text' as const, text: 'Cart link not found. Make sure you are on Amazon.' }],
        isError: true
      };
    }

    cartLink.click();

    return {
      content: [{ type: 'text' as const, text: 'Navigating to shopping cart.' }],
      structuredContent: { action: 'navigating_to_cart' }
    };
  }
};
