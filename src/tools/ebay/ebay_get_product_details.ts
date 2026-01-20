import type {ToolDefinition} from 'webmcp-polyfill';

interface ProductDetails {
  [key: string]: unknown;
  itemId: string;
  title: string;
  price: string | null;
  condition: string | null;
  shipping: string | null;
  sellerName: string | null;
  sellerFeedback: string | null;
  canBuyNow: boolean;
  canAddToCart: boolean;
  canWatch: boolean;
}

export const ebayGetProductDetails: ToolDefinition = {
  name: 'ebay_get_product_details',
  description:
    'Get detailed information about an item on an eBay listing page. Returns title, price, condition, shipping, seller details, and available actions.',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  },
  async execute() {
    const titleEl = document.querySelector('h1');
    if (!titleEl) {
      return {
        content: [
          {
            type: 'text',
            text: 'Item title not found. Make sure you are on an eBay listing page.'
          }
        ],
        isError: true
      };
    }

    const itemIdMatch = window.location.pathname.match(/\/itm\/(\d+)/);
    const itemId = itemIdMatch ? itemIdMatch[1] : 'Unknown';

    const priceEl = document.querySelector(
      '.x-price-primary, [data-testid="x-price-primary"]'
    );
    const conditionEl = document.querySelector('.x-item-condition');
    const shippingEl = document.querySelector('.ux-labels-values--shipping');

    const sellerNameEl = document.querySelector('.x-sellercard-atf__info a');
    const sellerCardEl = document.querySelector(
      '.x-sellercard-atf, [data-testid="x-sellercard-atf"]'
    );

    const buyNowBtn = document.querySelector(
      '.x-bin-action a.ux-call-to-action, #binBtn_btn_1'
    );
    const addToCartBtn = document.querySelector(
      '.x-atc-action a.ux-call-to-action, #atcBtn_btn_1'
    );
    const watchBtn = document.querySelector('.x-watch-heart-btn');

    let sellerFeedback: string | null = null;
    if (sellerCardEl) {
      const feedbackMatch = sellerCardEl.textContent?.match(
        /(\d+\.?\d*%\s*positive)/i
      );
      sellerFeedback = feedbackMatch ? feedbackMatch[1] : null;
    }

    const details: ProductDetails = {
      itemId,
      title: titleEl.textContent?.trim() || 'Unknown',
      price: priceEl?.textContent?.trim().split('or')[0].trim() || null,
      condition:
        conditionEl?.textContent?.trim().replace('Condition:', '').trim() ||
        null,
      shipping:
        shippingEl?.textContent?.trim().replace('Shipping:', '').trim() || null,
      sellerName: sellerNameEl?.textContent?.trim() || null,
      sellerFeedback,
      canBuyNow: !!buyNowBtn,
      canAddToCart: !!addToCartBtn,
      canWatch: !!watchBtn
    };

    const detailLines = [
      `Title: ${details.title}`,
      `Item ID: ${details.itemId}`,
      `Price: ${details.price || 'N/A'}`,
      `Condition: ${details.condition || 'N/A'}`,
      `Shipping: ${details.shipping || 'N/A'}`,
      `Seller: ${details.sellerName || 'N/A'}${details.sellerFeedback ? ` (${details.sellerFeedback})` : ''}`,
      `Actions: ${
        [
          details.canBuyNow ? 'Buy Now' : null,
          details.canAddToCart ? 'Add to Cart' : null,
          details.canWatch ? 'Watch' : null
        ]
          .filter(Boolean)
          .join(', ') || 'None'
      }`
    ];

    return {
      content: [
        {
          type: 'text',
          text: `Item Details:\n\n${detailLines.join('\n')}`
        }
      ],
      structuredContent: details
    };
  }
};
