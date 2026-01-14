export const tool = {
  name: 'amazon_add_to_cart',
  description: 'Add the current product to the Amazon shopping cart.',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  },
  async execute() {
    const addToCartBtn = document.querySelector(
      '#add-to-cart-button'
    ) as HTMLButtonElement;

    if (!addToCartBtn) {
      return {
        content: [
          {
            type: 'text' as const,
            text: 'Add to Cart button not found. Make sure you are on an Amazon product page with a purchasable item.'
          }
        ],
        isError: true
      };
    }

    if (addToCartBtn.disabled) {
      return {
        content: [
          {
            type: 'text' as const,
            text: 'Add to Cart button is disabled. The product may be unavailable or require variant selection.'
          }
        ],
        isError: true
      };
    }

    const title =
      document.querySelector('#productTitle')?.textContent?.trim() || 'Product';
    const asinMatch = window.location.pathname.match(/\/dp\/([A-Z0-9]+)/);
    const asin = asinMatch?.[1] || null;

    addToCartBtn.click();

    return {
      content: [
        {
          type: 'text' as const,
          text: `Adding to cart: ${title.substring(0, 60)}${title.length > 60 ? '...' : ''}`
        }
      ],
      structuredContent: {asin, title, action: 'adding_to_cart'}
    };
  }
};
