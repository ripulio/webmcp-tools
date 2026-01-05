import type {ToolDefinition} from 'webmcp-polyfill';

export const tool: ToolDefinition = {
  name: 'allrecipes_click_search_result',
  description:
    'Click on a search result by its position (1-based index) to navigate to the recipe detail page.',
  inputSchema: {
    type: 'object',
    properties: {
      index: {
        type: 'number',
        description:
          'The position of the search result to click (1 for first result, 2 for second, etc.)'
      }
    },
    required: ['index']
  },
  async execute(input) {
    const {index} = input as {index: number};

    // Check if we're on a search results page
    if (!window.location.pathname.includes('/search')) {
      return {
        content: [
          {
            type: 'text',
            text: 'Not on a search results page. Use allrecipes_search first to navigate to search results.'
          }
        ],
        isError: true
      };
    }

    // Find all recipe cards in search results
    const cards = document.querySelectorAll(
      '#mntl-search-results__list_1-0 > a.mntl-card-list-card--extendable'
    );

    if (cards.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: 'No search results found on this page.'
          }
        ],
        isError: true
      };
    }

    if (index < 1 || index > cards.length) {
      return {
        content: [
          {
            type: 'text',
            text: `Invalid index ${index}. Please provide a number between 1 and ${cards.length}.`
          }
        ],
        isError: true
      };
    }

    const card = cards[index - 1] as HTMLAnchorElement;
    const title =
      card.querySelector('.card__title-text')?.textContent?.trim() ||
      'Unknown recipe';
    const url = card.href;

    // Navigate to the recipe
    window.location.href = url;

    return {
      content: [
        {
          type: 'text',
          text: `Navigating to recipe: "${title}". Use allrecipes_get_recipe_details to extract the recipe information.`
        }
      ]
    };
  }
};
