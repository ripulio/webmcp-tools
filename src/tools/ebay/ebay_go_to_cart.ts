import type {ToolDefinition} from 'webmcp-polyfill';

export const ebayGoToCart: ToolDefinition = {
  name: 'ebay_go_to_cart',
  description:
    'Navigate to your eBay shopping cart page. Clicks the cart icon in the navigation bar.',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  },
  async execute() {
    const cartLink = document.querySelector<HTMLAnchorElement>(
      '.gh-cart a.gh-flyout__target'
    );

    if (!cartLink) {
      return {
        content: [
          {
            type: 'text',
            text: 'Cart link not found. Make sure you are on an eBay page.'
          }
        ],
        isError: true
      };
    }

    const cartIcon = document.querySelector('.gh-cart__icon');
    const ariaLabel = cartIcon?.getAttribute('aria-label') || '';
    const countMatch = ariaLabel.match(/(\d+)\s*item/);
    const count = countMatch ? parseInt(countMatch[1], 10) : 0;

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
