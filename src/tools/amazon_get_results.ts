export const tool = {
  name: 'amazon_get_results',
  description:
    'Get the list of product search results on the current Amazon search page. Returns product titles, prices, ratings, and ASINs.',
  inputSchema: {
    type: 'object',
    properties: {
      limit: {
        type: 'number',
        description: 'Maximum number of results to return (default 10)'
      }
    },
    required: []
  },
  async execute(rawInput: {limit?: number}) {
    const {limit = 10} = rawInput || {};

    // Try multiple selectors for search results - data-asin is primary, but have fallbacks
    const resultSelectors = [
      '[data-asin]:not([data-asin=""])',
      '[data-component-type="s-search-result"]',
      '.s-result-item[data-asin]'
    ];

    let resultElements: NodeListOf<Element> | null = null;
    for (const selector of resultSelectors) {
      const elements = document.querySelectorAll(selector);
      if (elements.length > 0) {
        resultElements = elements;
        break;
      }
    }

    if (!resultElements || resultElements.length === 0) {
      return {
        content: [
          {
            type: 'text' as const,
            text: 'No search results found. Make sure you are on an Amazon search results page.'
          }
        ],
        isError: true
      };
    }

    const results: Array<{
      index: number;
      asin: string;
      title: string;
      price: string | null;
      rating: string | null;
      reviewCount: string | null;
    }> = [];

    // Helper to find element with multiple selector fallbacks
    const findElement = (
      parent: Element,
      selectors: string[]
    ): Element | null => {
      for (const selector of selectors) {
        const el = parent.querySelector(selector);
        if (el) return el;
      }
      return null;
    };

    let index = 0;
    for (const el of resultElements) {
      if (results.length >= limit) break;

      const asin = el.getAttribute('data-asin');
      if (!asin) continue;

      // Multiple fallback selectors for title
      const titleSelectors = [
        'h2 span',
        'h2 a span',
        '.a-text-normal',
        '[data-cy="title-recipe"] span'
      ];
      const titleEl = findElement(el, titleSelectors);
      const title = titleEl?.textContent?.trim() || '';
      if (!title) continue;

      // Price extraction with multiple formats
      const priceEl = findElement(el, [
        '.a-price .a-offscreen',
        '.a-price-whole',
        '.a-color-price'
      ]);
      let price: string | null = null;
      if (priceEl) {
        const priceText = priceEl.textContent?.trim() || '';
        // Handle various price formats - remove non-price characters but keep currency
        price = priceText.match(/[\$£€]?\s*[\d,.]+/)?.[0]?.trim() || null;
      }

      // Rating extraction
      const ratingEl = findElement(el, [
        '.a-icon-alt',
        '[aria-label*="stars"]'
      ]);
      const rating =
        ratingEl?.textContent?.trim() ||
        ratingEl?.getAttribute('aria-label') ||
        null;

      // Review count extraction
      const reviewCountEl = findElement(el, [
        'a[href*="#customerReviews"] span',
        '[aria-label*="reviews"]',
        '.a-size-small .a-link-normal'
      ]);
      let reviewCount = reviewCountEl?.textContent?.trim() || null;
      if (reviewCount) {
        // Extract just the number, handling formats like "(1,234)" or "1,234 reviews"
        const match = reviewCount.match(/[\d,]+/);
        reviewCount = match ? match[0] : null;
      }

      results.push({
        index,
        asin,
        title,
        price,
        rating,
        reviewCount
      });
      index++;
    }

    // Current page from multiple possible selectors
    const pageSelectors = [
      '.s-pagination-selected',
      '.a-pagination .a-selected',
      '[aria-current="page"]'
    ];
    let currentPage = '1';
    for (const selector of pageSelectors) {
      const el = document.querySelector(selector);
      if (el?.textContent?.trim()) {
        currentPage = el.textContent.trim();
        break;
      }
    }

    const summary = results
      .map(
        (r, i) =>
          `${i + 1}. ${r.title.substring(0, 60)}${r.title.length > 60 ? '...' : ''}\n   Price: ${r.price || 'N/A'} | Rating: ${r.rating || 'N/A'} | ASIN: ${r.asin}`
      )
      .join('\n\n');

    return {
      content: [
        {
          type: 'text' as const,
          text: `Found ${results.length} results (Page ${currentPage}):\n\n${summary}`
        }
      ],
      structuredContent: {
        results,
        currentPage: parseInt(currentPage, 10),
        totalReturned: results.length
      }
    };
  }
};
