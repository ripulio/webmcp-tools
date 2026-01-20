import type {ToolDefinition} from 'webmcp-polyfill';

interface SearchResult {
  [key: string]: unknown;
  index: number;
  itemId: string;
  title: string;
  price: string | null;
  condition: string | null;
  listingType: 'auction' | 'buy_it_now' | 'best_offer' | 'unknown';
  isFreeShipping: boolean;
}

export const ebayGetResults: ToolDefinition = {
  name: 'ebay_get_results',
  description:
    'Get the list of item search results from an eBay search results page. Returns item details including title, price, and condition. Use ebay_click_result to navigate to a specific item.',
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
      'ul.srp-results li.s-card'
    );

    const validResults = Array.from(resultElements).filter((el) => {
      const link = el.querySelector('a.s-card__link');
      return link && link.getAttribute('href')?.includes('/itm/');
    });

    if (validResults.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: 'No search results found. Make sure you are on an eBay search results page.'
          }
        ],
        isError: true
      };
    }

    const results: SearchResult[] = [];

    for (let i = 0; i < Math.min(limit, validResults.length); i++) {
      const el = validResults[i];

      const linkEl = el.querySelector<HTMLAnchorElement>('a.s-card__link');
      const href = linkEl?.href || '';
      const itemIdMatch = href.match(/\/itm\/(\d+)/);
      const itemId = itemIdMatch ? itemIdMatch[1] : '';

      if (!itemId) continue;

      const titleEl = el.querySelector('.s-card__title');
      const priceEl = el.querySelector('.s-card__price');
      const subtitleEl = el.querySelector('.s-card__subtitle');

      const innerText = (el.innerText || '').toLowerCase();
      const isFreeShipping =
        innerText.includes('free delivery') ||
        innerText.includes('free shipping') ||
        innerText.includes('free postage');

      let listingType: SearchResult['listingType'] = 'unknown';
      if (innerText.includes('bid')) {
        listingType = 'auction';
      } else if (innerText.includes('best offer')) {
        listingType = 'best_offer';
      } else if (priceEl) {
        listingType = 'buy_it_now';
      }

      results.push({
        index: i,
        itemId,
        title: titleEl?.textContent?.trim() || 'Unknown',
        price: priceEl?.textContent?.trim() || null,
        condition: subtitleEl?.textContent?.trim() || null,
        listingType,
        isFreeShipping
      });
    }

    return {
      content: [
        {
          type: 'text',
          text: `Found ${results.length} search results:\n\n${results
            .map(
              (r) =>
                `[${r.index}] ${r.title.substring(0, 80)}${r.title.length > 80 ? '...' : ''}\n    ID: ${r.itemId} | Price: ${r.price || 'N/A'} | ${r.condition || 'N/A'}${r.isFreeShipping ? ' | Free Shipping' : ''}`
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
