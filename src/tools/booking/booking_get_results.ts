import type {ToolDefinition} from 'webmcp-polyfill';

interface PropertyResult {
  index: number;
  title: string;
  score: string | null;
  reviewCount: string | null;
  address: string | null;
  distance: string | null;
  href: string;
}

export const bookingGetResults: ToolDefinition = {
  name: 'booking_get_results',
  description:
    'Get the list of property search results from a Booking.com search results page. Returns property details including title, rating, review count, address, and distance from centre. Use booking_click_result to navigate to a specific property.',
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

    const cards = document.querySelectorAll<HTMLElement>(
      '[data-testid="property-card"]'
    );

    if (cards.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: 'No property results found. Make sure you are on a Booking.com search results page.'
          }
        ],
        isError: true
      };
    }

    // Get total results count from header
    const resultsHeader = document.querySelector('h1');
    const countMatch = resultsHeader?.textContent?.match(/([\d,]+)\s*propert/i);
    const totalResults = countMatch ? countMatch[1] : 'unknown';

    const results: PropertyResult[] = [];

    for (let i = 0; i < Math.min(limit, cards.length); i++) {
      const card = cards[i];

      const titleLink = card.querySelector<HTMLAnchorElement>(
        '[data-testid="title-link"]'
      );
      const title = card.querySelector('[data-testid="title"]');
      const reviewScore = card.querySelector('[data-testid="review-score"]');
      const address = card.querySelector('[data-testid="address"]');
      const distance = card.querySelector('[data-testid="distance"]');

      const scoreText = reviewScore?.textContent || '';
      const scoreMatch = scoreText.match(/(\d+\.?\d*)/);
      const reviewMatch = scoreText.match(/([\d,]+)\s*reviews?/i);

      results.push({
        index: i,
        title: title?.textContent?.trim() || 'Unknown',
        score: scoreMatch ? scoreMatch[1] : null,
        reviewCount: reviewMatch ? reviewMatch[1] : null,
        address: address?.textContent?.trim() || null,
        distance: distance?.textContent?.trim() || null,
        href: titleLink?.href || ''
      });
    }

    return {
      content: [
        {
          type: 'text',
          text: `Found ${totalResults} properties (showing ${results.length}):\n\n${results
            .map(
              (r) =>
                `[${r.index}] ${r.title}\n    Score: ${r.score || 'N/A'} (${r.reviewCount || '0'} reviews) | ${r.address || 'N/A'} | ${r.distance || 'N/A'}`
            )
            .join('\n\n')}`
        }
      ],
      structuredContent: {
        results,
        totalResults,
        showing: results.length
      }
    };
  }
};
