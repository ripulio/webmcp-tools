import type {ToolDefinition} from 'webmcp-polyfill';

export const tool: ToolDefinition = {
  name: 'allrecipes_click_category_item',
  description:
    'Click on an item from the category page by its position (1-based index) to navigate to the recipe or collection.',
  inputSchema: {
    type: 'object',
    properties: {
      index: {
        type: 'number',
        description:
          'The position of the item to click (1 for first item, 2 for second, etc.)'
      }
    },
    required: ['index']
  },
  async execute(input) {
    const {index} = input as {index: number};

    // Find all recipe/article cards
    const allCards = document.querySelectorAll('a.mntl-document-card, a.card');

    if (allCards.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: 'No items found on this page. Make sure you are on a category page.'
          }
        ],
        isError: true
      };
    }

    // Filter to valid items (same logic as get_category_recipes)
    const validCards: HTMLAnchorElement[] = [];
    allCards.forEach((card) => {
      const anchor = card as HTMLAnchorElement;
      const title = card
        .querySelector('.card__title-text, .card__title')
        ?.textContent?.trim();
      const href = anchor.href;

      if (title && href && href.includes('allrecipes.com')) {
        validCards.push(anchor);
      }
    });

    if (index < 1 || index > validCards.length) {
      return {
        content: [
          {
            type: 'text',
            text: `Invalid index ${index}. Please provide a number between 1 and ${validCards.length}.`
          }
        ],
        isError: true
      };
    }

    const card = validCards[index - 1];
    const title =
      card
        .querySelector('.card__title-text, .card__title')
        ?.textContent?.trim() || 'Unknown item';
    const url = card.href;
    const isRecipe = url.includes('/recipe/');

    // Navigate to the item
    window.location.href = url;

    const nextStep = isRecipe
      ? 'Use allrecipes_get_recipe_details to extract the recipe information.'
      : 'This is a recipe collection. Browse the page to find specific recipes.';

    return {
      content: [
        {
          type: 'text',
          text: `Navigating to: "${title}". ${nextStep}`
        }
      ]
    };
  }
};
