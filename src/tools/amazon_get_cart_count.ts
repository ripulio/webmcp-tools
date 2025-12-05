export const tool = {
  name: 'amazon_get_cart_count',
  description: 'Get the number of items currently in the Amazon shopping cart.',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  },
  async execute() {
    const cartCountElement = document.querySelector('#nav-cart-count');
    if (!cartCountElement) {
      return {
        content: [{ type: 'text' as const, text: 'Cart count element not found. Make sure you are on Amazon.' }],
        isError: true
      };
    }

    const countText = cartCountElement.textContent?.trim() || '0';

    // Handle overflow notation like "10+" or "99+"
    const isOverflow = countText.includes('+');
    const count = parseInt(countText.replace('+', ''), 10) || 0;

    const displayText = isOverflow
      ? `Cart contains ${count}+ items.`
      : `Cart contains ${count} item${count === 1 ? '' : 's'}.`;

    return {
      content: [{ type: 'text' as const, text: displayText }],
      structuredContent: { count, isOverflow }
    };
  }
};
