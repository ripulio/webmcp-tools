import type {ToolDefinition} from 'webmcp-polyfill';

interface ProductResult {
  title: string;
  price: string | null;
  rating: string | null;
  reviewCount: string | null;
  url: string | null;
  asin: string | null;
  isPrime: boolean;
  isSponsored: boolean;
}

export const amazonListResults: ToolDefinition = {
  name: 'amazon-list-results',
  description: 'Extract and list product search results from the current Amazon page. Returns product titles, prices, ratings, and links.',
  inputSchema: {
    type: 'object',
    properties: {
      limit: {
        type: 'number',
        description: 'Maximum number of results to return (default: 10)'
      }
    },
    required: []
  },
  async execute(input, context) {
    const {limit = 10} = input as {limit?: number};
    const {page} = context;

    const currentUrl = page.url();
    if (!currentUrl.includes('amazon.com')) {
      return {
        content: [
          {
            type: 'text',
            text: 'Error: Not on an Amazon page. Please navigate to Amazon first or use amazon-search.'
          }
        ]
      };
    }

    // Extract product results from the search results page
    const products = await page.evaluate((maxResults: number) => {
      const results: ProductResult[] = [];

      // Main product card selectors for Amazon search results
      const productSelectors = [
        '[data-component-type="s-search-result"]',
        '.s-result-item[data-asin]:not([data-asin=""])',
        '.sg-col-inner .s-result-item'
      ];

      let productCards: Element[] = [];
      for (const selector of productSelectors) {
        productCards = Array.from(document.querySelectorAll(selector));
        if (productCards.length > 0) break;
      }

      for (const card of productCards.slice(0, maxResults)) {
        // Skip ad placeholders
        if (card.querySelector('.AdHolder')) continue;

        // Extract ASIN
        const asin = card.getAttribute('data-asin') || null;
        if (!asin) continue;

        // Extract title
        const titleEl = card.querySelector('h2 a span, .a-text-normal, [data-cy="title-recipe"] span');
        const title = titleEl?.textContent?.trim() || 'Unknown Product';

        // Extract URL
        const linkEl = card.querySelector('h2 a, a.a-link-normal[href*="/dp/"]') as HTMLAnchorElement;
        const url = linkEl?.href || null;

        // Extract price
        const priceWhole = card.querySelector('.a-price-whole')?.textContent?.trim() || '';
        const priceFraction = card.querySelector('.a-price-fraction')?.textContent?.trim() || '';
        const priceSymbol = card.querySelector('.a-price-symbol')?.textContent?.trim() || '$';
        const price = priceWhole ? `${priceSymbol}${priceWhole}${priceFraction}` : null;

        // Extract rating
        const ratingEl = card.querySelector('.a-icon-star-small span, .a-icon-alt, [data-cy="reviews-ratings-slot"] span');
        const ratingText = ratingEl?.textContent?.trim() || null;
        const rating = ratingText?.match(/[\d.]+/)?.[0] || null;

        // Extract review count
        const reviewEl = card.querySelector('[data-cy="reviews-ratings-slot"] + span span, .a-size-base.s-underline-text');
        const reviewCount = reviewEl?.textContent?.trim()?.replace(/[(),]/g, '') || null;

        // Check for Prime
        const isPrime = !!card.querySelector('.a-icon-prime, [data-cy="prime-badge"]');

        // Check if sponsored
        const isSponsored = !!card.querySelector('.s-label-popover-default, .puis-sponsored-label-text');

        results.push({
          title,
          price,
          rating,
          reviewCount,
          url,
          asin,
          isPrime,
          isSponsored
        });
      }

      return results;
    }, limit);

    if (products.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: 'No product results found on this page. Make sure you are on an Amazon search results page.'
          }
        ]
      };
    }

    // Format the results
    const formattedResults = products.map((product, index) => {
      const lines = [
        `${index + 1}. ${product.title}`,
        `   Price: ${product.price || 'N/A'}`,
        `   Rating: ${product.rating ? `${product.rating}/5` : 'N/A'}${product.reviewCount ? ` (${product.reviewCount} reviews)` : ''}`,
        `   ${product.isPrime ? 'Prime eligible' : ''}${product.isSponsored ? ' [Sponsored]' : ''}`.trim(),
        `   ASIN: ${product.asin || 'N/A'}`,
        product.url ? `   URL: ${product.url}` : ''
      ].filter(line => line.trim());

      return lines.join('\n');
    }).join('\n\n');

    return {
      content: [
        {
          type: 'text',
          text: `Found ${products.length} products:\n\n${formattedResults}`
        }
      ]
    };
  }
};
