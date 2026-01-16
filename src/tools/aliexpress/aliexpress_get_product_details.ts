import type {ToolDefinition} from 'webmcp-polyfill';

interface ProductDetails {
  [key: string]: unknown;
  title: string;
  price: string | null;
  originalPrice: string | null;
  rating: string | null;
  reviewCount: string | null;
  sold: string | null;
  url: string;
}

export const tool: ToolDefinition = {
  name: 'aliexpress_get_product_details',
  description:
    'Get detailed information about a product on an AliExpress product page. Returns title, price, rating, reviews, and sold count.',
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

    // Get the full page text for parsing
    const pageText = document.body.innerText || '';

    // Find the product title - look for H1 elements
    const h1Elements = document.querySelectorAll('h1');
    let title = '';
    for (const h1 of h1Elements) {
      const text = h1.textContent?.trim() || '';
      // Skip generic titles like "Aliexpress"
      if (text.length > 20 && text.toLowerCase() !== 'aliexpress') {
        title = text;
        break;
      }
    }

    // Parse price from page text
    // Note: AliExpress uses various currency symbols including fullwidth variants
    // £ (U+00A3), ￡ (U+FFE1), $ (U+0024), ＄ (U+FF04), € (U+20AC)
    const priceMatches = pageText.match(/[£￡$＄€]\d+\.?\d*/g);
    const price = priceMatches ? priceMatches[0] : null;
    const originalPrice =
      priceMatches && priceMatches.length > 1 ? priceMatches[1] : null;

    // Parse rating
    const ratingMatch = pageText.match(/(\d\.\d)\s*\n?\s*\d+\s*Reviews/i);
    const rating = ratingMatch ? ratingMatch[1] : null;

    // Parse review count
    const reviewMatch = pageText.match(/(\d+)\s*Reviews/i);
    const reviewCount = reviewMatch ? reviewMatch[1] : null;

    // Parse sold count
    const soldMatch = pageText.match(/(\d+[,\d]*\+?)\s*sold/i);
    const sold = soldMatch ? soldMatch[0] : null;

    const details: ProductDetails = {
      title: title || 'Unknown product',
      price,
      originalPrice,
      rating,
      reviewCount,
      sold,
      url: window.location.href
    };

    return {
      content: [
        {
          type: 'text',
          text: `Product Details:\n\nTitle: ${details.title}\nPrice: ${details.price || 'N/A'}${details.originalPrice ? ` (was ${details.originalPrice})` : ''}\nRating: ${details.rating || 'N/A'} (${details.reviewCount || '0'} reviews)\nSold: ${details.sold || 'N/A'}\nURL: ${details.url}`
        }
      ],
      structuredContent: details
    };
  }
};
