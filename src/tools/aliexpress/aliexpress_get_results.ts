import type {ToolDefinition} from 'webmcp-polyfill';

interface SearchResult {
  [key: string]: unknown;
  index: number;
  title: string;
  price: string | null;
  originalPrice: string | null;
  rating: string | null;
  sold: string | null;
  url: string;
}

export const tool: ToolDefinition = {
  name: 'aliexpress_get_results',
  description:
    'Get the list of product search results from an AliExpress search results page. Returns product details including title, price, rating, and sold count. Use aliexpress_click_result to navigate to a specific product by index.',
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

    const resultElements = document.querySelectorAll<HTMLAnchorElement>(
      '#card-list .search-card-item'
    );

    if (resultElements.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: 'No search results found. Make sure you are on an AliExpress search results page.'
          }
        ],
        isError: true
      };
    }

    const results: SearchResult[] = [];

    for (let i = 0; i < Math.min(limit, resultElements.length); i++) {
      const el = resultElements[i];
      const url = el.href || '';

      // Get title from img alt or card text
      const img = el.querySelector('img');
      const titleFromAlt = img?.alt || '';
      const titleFromText = el.innerText.split('\n')[0] || '';
      const title = titleFromAlt || titleFromText;

      // Parse price from innerText
      // Note: AliExpress uses various currency symbols including fullwidth variants
      // £ (U+00A3), ￡ (U+FFE1), $ (U+0024), ＄ (U+FF04), € (U+20AC)
      const innerText = el.innerText || '';
      const priceRegex = /[£￡$＄€]\d+\.?\d*/g;
      const allPrices = innerText.match(priceRegex);
      const price = allPrices ? allPrices[0] : null;

      // Look for original price (strikethrough price, typically the second price)
      const originalPrice =
        allPrices && allPrices.length > 1 ? allPrices[1] : null;

      // Get rating - look for rating pattern before sold count
      // Ratings are typically 1.0-5.0 followed by sold info, avoid matching version numbers like "5.3"
      const ratingMatch = innerText.match(/\n(\d\.\d)\n/);
      const rating = ratingMatch ? ratingMatch[1] : null;

      // Get sold count
      const soldMatch = innerText.match(/(\d+[,\d]*\+?)\s*sold/i);
      const sold = soldMatch ? soldMatch[1] + ' sold' : null;

      results.push({
        index: i,
        title: title.substring(0, 100),
        price,
        originalPrice,
        rating,
        sold,
        url
      });
    }

    return {
      content: [
        {
          type: 'text',
          text: `Found ${results.length} search results:\n\n${results
            .map(
              (r) =>
                `[${r.index}] ${r.title.substring(0, 70)}${r.title.length > 70 ? '...' : ''}\n    Price: ${r.price || 'N/A'}${r.originalPrice ? ` (was ${r.originalPrice})` : ''} | Rating: ${r.rating || 'N/A'} | ${r.sold || 'N/A'}`
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
