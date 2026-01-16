import type {ToolDefinition} from 'webmcp-polyfill';

export const tool: ToolDefinition = {
  name: 'aliexpress_click_result',
  description:
    'Click on a specific search result by index to navigate to the product detail page. Use aliexpress_get_results first to see available results and their indices.',
  inputSchema: {
    type: 'object',
    properties: {
      index: {
        type: 'number',
        description: 'The index of the search result to click (0-based)'
      }
    },
    required: ['index']
  },
  async execute(input) {
    const {index} = input as {index: number};

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

    if (index < 0 || index >= resultElements.length) {
      return {
        content: [
          {
            type: 'text',
            text: `Invalid index ${index}. Valid range is 0-${resultElements.length - 1}.`
          }
        ],
        isError: true
      };
    }

    const targetElement = resultElements[index];
    const img = targetElement.querySelector('img');
    const title =
      img?.alt || targetElement.innerText.split('\n')[0] || 'Unknown product';
    const url = targetElement.href;

    // Navigate to the product page
    window.location.href = url;

    return {
      content: [
        {
          type: 'text',
          text: `Navigating to product: "${title.substring(0, 80)}". Use aliexpress_get_product_details after the page loads to get product information.`
        }
      ]
    };
  }
};
