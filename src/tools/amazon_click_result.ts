export const tool = {
  name: 'amazon_click_result',
  description:
    'Click on a search result to navigate to its product page. Specify either the result index (0-based) or the product ASIN.',
  inputSchema: {
    type: 'object',
    properties: {
      index: {
        type: 'number',
        description:
          'Zero-based index of the result to click (e.g., 0 for first result)'
      },
      asin: {type: 'string', description: 'Amazon product ASIN to click'}
    },
    required: []
  },
  async execute(rawInput: {index?: number; asin?: string}) {
    const {index, asin} = rawInput || {};

    if (index === undefined && !asin) {
      return {
        content: [
          {
            type: 'text' as const,
            text: 'Either index or asin parameter is required.'
          }
        ],
        isError: true
      };
    }

    // Try multiple selectors for search results
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

    // Helper to find element with fallbacks
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

    // Title selectors
    const titleSelectors = [
      'h2 span',
      'h2 a span',
      '.a-text-normal',
      '[data-cy="title-recipe"] span'
    ];

    let targetElement: Element | null = null;
    let targetAsin: string | null = null;

    if (asin) {
      targetElement = document.querySelector(`[data-asin="${asin}"]`);
      targetAsin = asin;
    } else if (index !== undefined) {
      let currentIndex = 0;
      for (const el of resultElements) {
        const elAsin = el.getAttribute('data-asin');
        const titleEl = findElement(el, titleSelectors);
        const title = titleEl?.textContent?.trim();
        if (elAsin && title) {
          if (currentIndex === index) {
            targetElement = el;
            targetAsin = elAsin;
            break;
          }
          currentIndex++;
        }
      }
    }

    if (!targetElement) {
      return {
        content: [
          {
            type: 'text' as const,
            text: `Result not found. ${asin ? `No product with ASIN ${asin}` : `Index ${index} is out of range`}.`
          }
        ],
        isError: true
      };
    }

    // Try multiple link selectors - /dp/ is standard but also try /gp/product/
    const linkSelectors = [
      'a[href*="/dp/"]',
      'a[href*="/gp/product/"]',
      'h2 a',
      '.a-link-normal[href*="amazon"]'
    ];
    const productLink = findElement(
      targetElement,
      linkSelectors
    ) as HTMLAnchorElement;

    if (!productLink || !productLink.href) {
      return {
        content: [
          {
            type: 'text' as const,
            text: 'Product link not found in the search result.'
          }
        ],
        isError: true
      };
    }

    const titleEl = findElement(targetElement, titleSelectors);
    const title = titleEl?.textContent?.trim() || '';
    productLink.click();

    return {
      content: [
        {
          type: 'text' as const,
          text: `Navigating to product: ${title.substring(0, 60)}${title.length > 60 ? '...' : ''} (ASIN: ${targetAsin})`
        }
      ],
      structuredContent: {
        asin: targetAsin,
        title,
        action: 'navigating_to_product'
      }
    };
  }
};
