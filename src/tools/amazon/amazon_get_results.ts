import type {ToolDefinition} from 'webmcp-polyfill';

interface SearchResult {
  [key: string]: unknown;
  index: number;
  asin: string;
  title: string;
  price: string | null;
  rating: string | null;
  reviewCount: string | null;
  isPrime: boolean;
  isSponsored: boolean;
}

export const amazonGetResults: ToolDefinition = {
  name: 'amazon_get_results',
  description:
    'Get the list of product search results from an Amazon search results page. Returns product details including title, price, rating, and ASIN. Use amazon_click_result to navigate to a specific product.',
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
  async execute(input) {
    const {limit = 10} = input as {limit?: number};

    const resultElements = document.querySelectorAll<HTMLElement>(
      '[data-component-type="s-search-result"]'
    );

    if (resultElements.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: 'No search results found. Make sure you are on an Amazon search results page.'
          }
        ],
        isError: true
      };
    }

    const results: SearchResult[] = [];

    for (let i = 0; i < Math.min(limit, resultElements.length); i++) {
      const el = resultElements[i];
      const asin = el.getAttribute('data-asin') || '';

      if (!asin) continue;

      const titleEl = el.querySelector('h2 span');
      const priceWhole = el.querySelector('.a-price-whole');
      const priceFraction = el.querySelector('.a-price-fraction');
      const priceSymbol = el.querySelector('.a-price-symbol');
      const ratingEl = el.querySelector('[aria-label*="out of 5 stars"]');
      const reviewCountEl = el.querySelector(
        '[aria-label*="out of 5 stars"] + span span, .a-size-base.s-underline-text'
      );
      const primeEl = el.querySelector('[aria-label="Amazon Prime"]');
      const sponsoredEl = el.querySelector('.s-label-popover-default');

      let price: string | null = null;
      if (priceWhole) {
        const symbol = priceSymbol?.textContent || '$';
        const whole = priceWhole.textContent?.replace('.', '') || '';
        const fraction = priceFraction?.textContent || '00';
        price = `${symbol}${whole}.${fraction}`;
      }

      results.push({
        index: i,
        asin,
        title: titleEl?.textContent?.trim() || 'Unknown',
        price,
        rating:
          ratingEl?.getAttribute('aria-label')?.split(' out of')[0] || null,
        reviewCount:
          reviewCountEl?.textContent?.replace(/[()]/g, '').trim() || null,
        isPrime: !!primeEl,
        isSponsored: !!sponsoredEl
      });
    }

    return {
      content: [
        {
          type: 'text',
          text: `Found ${results.length} search results:\n\n${results
            .map(
              (r) =>
                `[${r.index}] ${r.title.substring(0, 80)}${r.title.length > 80 ? '...' : ''}\n    ASIN: ${r.asin} | Price: ${r.price || 'N/A'} | Rating: ${r.rating || 'N/A'} (${r.reviewCount || '0'} reviews)${r.isPrime ? ' | Prime' : ''}${r.isSponsored ? ' | Sponsored' : ''}`
            )
            .join('\n\n')}`
        }
      ],
      structuredContent: {
        results,
        totalFound: results.length
      }
    };
  }
};
