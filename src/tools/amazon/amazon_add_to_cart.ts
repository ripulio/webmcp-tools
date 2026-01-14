import type {ToolDefinition} from 'webmcp-polyfill';

export const amazonAddToCart: ToolDefinition = {
  name: 'amazon_add_to_cart',
  description:
    'Add the current product to your Amazon cart. Must be on a product detail page with an available "Add to Cart" button.',
  inputSchema: {
    type: 'object',
    properties: {
      quantity: {
        type: 'number',
        description:
          'Quantity to add (default: 1). Some products may have quantity limits.'
      }
    },
    required: []
  },
  async execute(input) {
    const {quantity = 1} = input as {quantity?: number};

    const addToCartBtn = document.querySelector<HTMLInputElement>(
      '#add-to-cart-button'
    );
    if (!addToCartBtn) {
      const unavailableEl = document.querySelector(
        '#outOfStock, #availability .a-color-price'
      );
      if (unavailableEl) {
        return {
          content: [
            {
              type: 'text',
              text: 'This product is currently unavailable or cannot be shipped to your location.'
            }
          ],
          isError: true
        };
      }
      return {
        content: [
          {
            type: 'text',
            text: 'Add to Cart button not found. Make sure you are on an Amazon product detail page with an available product.'
          }
        ],
        isError: true
      };
    }

    if (quantity > 1) {
      const quantitySelect =
        document.querySelector<HTMLSelectElement>('#quantity');
      if (quantitySelect) {
        const optionExists = Array.from(quantitySelect.options).some(
          (opt) => opt.value === String(quantity)
        );
        if (optionExists) {
          quantitySelect.value = String(quantity);
          quantitySelect.dispatchEvent(new Event('change', {bubbles: true}));
        }
      }
    }

    const titleEl = document.querySelector('#productTitle');
    const title = titleEl?.textContent?.trim() || 'Unknown product';

    addToCartBtn.click();

    return {
      content: [
        {
          type: 'text',
          text: `Adding to cart: "${title.substring(0, 60)}${title.length > 60 ? '...' : ''}" (Quantity: ${quantity}). Check amazon_get_cart_count to verify the item was added.`
        }
      ]
    };
  }
};
