import type {ToolDefinition} from 'webmcp-polyfill';

interface ProductDetails {
  [key: string]: unknown;
  asin: string;
  title: string;
  price: string | null;
  rating: string | null;
  reviewCount: string | null;
  availability: string | null;
  brand: string | null;
  canAddToCart: boolean;
  canBuyNow: boolean;
}

export const amazonGetProductDetails: ToolDefinition = {
  name: 'amazon_get_product_details',
  description:
    'Get detailed information about a product on an Amazon product detail page. Returns title, price, rating, availability, and whether the product can be added to cart.',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  },
  async execute() {
    const titleEl = document.querySelector('#productTitle');
    if (!titleEl) {
      return {
        content: [
          {
            type: 'text',
            text: 'Product title not found. Make sure you are on an Amazon product detail page.'
          }
        ],
        isError: true
      };
    }

    const asinMatch = window.location.pathname.match(/\/dp\/([A-Z0-9]+)/);
    const asin = asinMatch ? asinMatch[1] : 'Unknown';

    const priceEl =
      document.querySelector('.a-price .a-offscreen') ||
      document.querySelector('.apexPriceToPay .a-offscreen') ||
      document.querySelector('#priceblock_ourprice') ||
      document.querySelector('#priceblock_dealprice');

    const ratingEl = document.querySelector('#acrPopover');
    const reviewCountEl = document.querySelector('#acrCustomerReviewText');
    const availabilityEl = document.querySelector('#availability span');
    const brandEl = document.querySelector('#bylineInfo');
    const addToCartBtn = document.querySelector('#add-to-cart-button');
    const buyNowBtn = document.querySelector('#buy-now-button');

    const details: ProductDetails = {
      asin,
      title: titleEl.textContent?.trim() || 'Unknown',
      price: priceEl?.textContent?.trim() || null,
      rating: ratingEl?.getAttribute('title') || null,
      reviewCount:
        reviewCountEl?.textContent?.replace(/[()]/g, '').trim() || null,
      availability: availabilityEl?.textContent?.trim() || null,
      brand: brandEl?.textContent?.trim() || null,
      canAddToCart: !!addToCartBtn,
      canBuyNow: !!buyNowBtn
    };

    const detailLines = [
      `Title: ${details.title}`,
      `ASIN: ${details.asin}`,
      `Price: ${details.price || 'Not available'}`,
      `Rating: ${details.rating || 'No rating'} (${details.reviewCount || '0'} reviews)`,
      `Availability: ${details.availability || 'Unknown'}`,
      `Brand: ${details.brand || 'Unknown'}`,
      `Can Add to Cart: ${details.canAddToCart ? 'Yes' : 'No'}`,
      `Can Buy Now: ${details.canBuyNow ? 'Yes' : 'No'}`
    ];

    return {
      content: [
        {
          type: 'text',
          text: `Product Details:\n\n${detailLines.join('\n')}`
        }
      ],
      structuredContent: details
    };
  }
};
