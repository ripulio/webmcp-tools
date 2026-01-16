import type {ToolDefinition} from 'webmcp-polyfill';

export const tool: ToolDefinition = {
  name: 'aliexpress_add_to_cart',
  description:
    'Add the current product to the shopping cart. Must be on a product detail page. If variants (color, size) need to be selected first, this will fail with an error indicating which options need to be selected.',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  },
  async execute() {
    // Check if we're on a product page
    const isProductPage =
      window.location.pathname.includes('/item/') ||
      document.body.classList.contains('pdp-new-pc');

    if (!isProductPage) {
      return {
        content: [
          {
            type: 'text',
            text: 'Not on a product page. Navigate to a product page first using aliexpress_click_result.'
          }
        ],
        isError: true
      };
    }

    // Find the add to cart button
    const addToCartButton = document.querySelector<HTMLButtonElement>(
      'button[class*="addtocart"], button[class*="add-to-cart"]'
    );

    if (!addToCartButton) {
      return {
        content: [
          {
            type: 'text',
            text: 'Add to cart button not found. The page may still be loading or the product may be unavailable.'
          }
        ],
        isError: true
      };
    }

    // Check if button is disabled (likely needs variant selection)
    if (addToCartButton.disabled) {
      return {
        content: [
          {
            type: 'text',
            text: 'Add to cart button is disabled. You may need to select product variants (color, size, etc.) first.'
          }
        ],
        isError: true
      };
    }

    // Get product title for confirmation
    const h1Elements = document.querySelectorAll('h1');
    let title = '';
    for (const h1 of h1Elements) {
      const text = h1.textContent?.trim() || '';
      if (text.length > 20 && text.toLowerCase() !== 'aliexpress') {
        title = text;
        break;
      }
    }

    // Click the add to cart button
    addToCartButton.click();

    return {
      content: [
        {
          type: 'text',
          text: `Added to cart: "${title.substring(0, 80)}". Use aliexpress_get_cart_count to verify the item was added.`
        }
      ]
    };
  }
};
