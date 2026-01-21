import type {ToolDefinition} from 'webmcp-polyfill';

export const amazonClickResult: ToolDefinition = {
  name: 'amazon_click_result',
  description:
    'Click on a product from the search results to navigate to its detail page. Use either the result index (from amazon_get_results) or the ASIN.',
  inputSchema: {
    type: 'object',
    properties: {
      index: {
        type: 'number',
        description: 'The index of the search result to click (0-based)'
      },
      asin: {
        type: 'string',
        description: 'The ASIN of the product to click'
      }
    },
    required: []
  },
  async execute(input) {
    const {index, asin} = input as {index?: number; asin?: string};

    if (index === undefined && !asin) {
      return {
        content: [
          {
            type: 'text',
            text: 'Either index or asin must be provided.'
          }
        ],
        isError: true
      };
    }

    let targetElement: HTMLElement | null = null;

    if (asin) {
      targetElement = document.querySelector(`[data-asin="${asin}"]`);
    } else if (index !== undefined) {
      const results = document.querySelectorAll<HTMLElement>(
        '[data-component-type="s-search-result"]'
      );
      targetElement = results[index] || null;
    }

    if (!targetElement) {
      return {
        content: [
          {
            type: 'text',
            text: `Product not found. ${asin ? `ASIN: ${asin}` : `Index: ${index}`}. Make sure you are on an Amazon search results page.`
          }
        ],
        isError: true
      };
    }

    const productLink = targetElement.querySelector<HTMLAnchorElement>(
      'a.a-link-normal.s-no-outline, h2 a, a.a-link-normal.s-line-clamp-2'
    );

    if (!productLink) {
      return {
        content: [
          {
            type: 'text',
            text: 'Product link not found in the search result element.'
          }
        ],
        isError: true
      };
    }

    const productAsin = targetElement.getAttribute('data-asin');
    const titleEl = targetElement.querySelector('h2 span');
    const title = titleEl?.textContent?.trim() || 'Unknown';

    productLink.click();

    return {
      content: [
        {
          type: 'text',
          text: `Clicking on product: "${title.substring(0, 80)}${title.length > 80 ? '...' : ''}" (ASIN: ${productAsin}). Use amazon_get_product_details after the page loads.`
        }
      ]
    };
  }
};
