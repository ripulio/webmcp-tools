import type {ToolDefinition} from 'webmcp-polyfill';

interface Ingredient {
  [key: string]: unknown;
  text: string;
  index: number;
}

interface IngredientsOutput {
  [key: string]: unknown;
  recipeTitle: string;
  servings: string | null;
  ingredients: Ingredient[];
}

export const tool: ToolDefinition = {
  name: 'allrecipes_get_ingredients',
  description: 'Get the full list of ingredients from the current recipe page.',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  },
  async execute() {
    // Check if we're on a recipe page
    if (!window.location.pathname.includes('/recipe/')) {
      return {
        content: [
          {
            type: 'text',
            text: 'Not on a recipe page. Navigate to a recipe first.'
          }
        ],
        isError: true
      };
    }

    const title =
      document.querySelector('h1.article-heading')?.textContent?.trim() ||
      'Unknown Recipe';

    // Get servings
    const detailsItems = document.querySelectorAll('.mm-recipes-details__item');
    let servings: string | null = null;
    detailsItems.forEach((item) => {
      const label = item
        .querySelector('.mm-recipes-details__label')
        ?.textContent?.trim();
      const value = item
        .querySelector('.mm-recipes-details__value')
        ?.textContent?.trim();
      if (label?.toLowerCase().includes('serving') && value) {
        servings = value;
      }
    });

    // Get ingredients
    const ingredientItems = document.querySelectorAll(
      '.mm-recipes-structured-ingredients__list-item'
    );

    if (ingredientItems.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: 'No ingredients found on this page. The recipe structure may have changed.'
          }
        ],
        isError: true
      };
    }

    const ingredients: Ingredient[] = [];
    ingredientItems.forEach((item, index) => {
      const text = item.textContent?.trim();
      if (text) {
        ingredients.push({
          text,
          index: index + 1
        });
      }
    });

    const output: IngredientsOutput = {
      recipeTitle: title,
      servings,
      ingredients
    };

    const ingredientsList = ingredients
      .map((ing) => `${ing.index}. ${ing.text}`)
      .join('\n');

    return {
      content: [
        {
          type: 'text',
          text: `Ingredients for "${title}"${servings ? ` (${servings} servings)` : ''}:\n\n${ingredientsList}`
        }
      ],
      structuredContent: output
    };
  }
};
