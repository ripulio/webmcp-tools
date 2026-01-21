import type {ToolDefinition} from 'webmcp-polyfill';

interface NutritionFacts {
  [key: string]: unknown;
  calories: string | null;
  fat: string | null;
  carbs: string | null;
  protein: string | null;
}

interface NutritionOutput {
  [key: string]: unknown;
  recipeTitle: string;
  servings: string | null;
  nutrition: NutritionFacts;
}

export const tool: ToolDefinition = {
  name: 'allrecipes_get_nutrition',
  description:
    'Get nutrition facts (calories, fat, carbs, protein) from the current recipe page.',
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

    // Get nutrition facts from the summary table
    const nutritionTable = document.querySelector(
      '.mm-recipes-nutrition-facts-summary__table'
    );

    if (!nutritionTable) {
      return {
        content: [
          {
            type: 'text',
            text: 'No nutrition information found on this page.'
          }
        ],
        isError: true
      };
    }

    const cells = nutritionTable.querySelectorAll('td');
    const nutritionData: Record<string, string> = {};

    // Cells come in pairs: value, label (e.g., "294", "Calories")
    for (let i = 0; i < cells.length; i += 2) {
      const value = cells[i]?.textContent?.trim();
      const label = cells[i + 1]?.textContent?.trim()?.toLowerCase();
      if (value && label) {
        nutritionData[label] = value;
      }
    }

    const nutrition: NutritionFacts = {
      calories: nutritionData['calories'] || null,
      fat: nutritionData['fat'] || null,
      carbs: nutritionData['carbs'] || null,
      protein: nutritionData['protein'] || null
    };

    const output: NutritionOutput = {
      recipeTitle: title,
      servings,
      nutrition
    };

    const nutritionParts = [
      nutrition.calories ? `Calories: ${nutrition.calories}` : null,
      nutrition.fat ? `Fat: ${nutrition.fat}` : null,
      nutrition.carbs ? `Carbs: ${nutrition.carbs}` : null,
      nutrition.protein ? `Protein: ${nutrition.protein}` : null
    ].filter(Boolean);

    return {
      content: [
        {
          type: 'text',
          text: `Nutrition Facts for "${title}"${servings ? ` (per serving, ${servings} servings total)` : ''}:\n\n${nutritionParts.join('\n')}`
        }
      ],
      structuredContent: output
    };
  }
};
