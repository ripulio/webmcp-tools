import type {ToolDefinition} from 'webmcp-polyfill';

interface RecipeDetails {
  [key: string]: unknown;
  title: string;
  description: string | null;
  rating: string | null;
  ratingCount: string | null;
  prepTime: string | null;
  cookTime: string | null;
  totalTime: string | null;
  servings: string | null;
  url: string;
}

export const tool: ToolDefinition = {
  name: 'allrecipes_get_recipe_details',
  description:
    'Get basic recipe details including title, description, rating, prep/cook times, and servings from the current recipe page.',
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
            text: 'Not on a recipe page. Navigate to a recipe first using allrecipes_search and allrecipes_click_search_result.'
          }
        ],
        isError: true
      };
    }

    const title = document
      .querySelector('h1.article-heading')
      ?.textContent?.trim();
    if (!title) {
      return {
        content: [
          {
            type: 'text',
            text: 'Could not find recipe title. The page may still be loading or the recipe structure has changed.'
          }
        ],
        isError: true
      };
    }

    const description =
      document.querySelector('.article-subheading')?.textContent?.trim() ||
      null;
    const rating =
      document
        .querySelector('#mm-recipes-review-bar__rating_1-0')
        ?.textContent?.trim() || null;
    const ratingCountEl = document.querySelector(
      '#mm-recipes-review-bar__rating-count_1-0'
    );
    const ratingCount =
      ratingCountEl?.textContent?.trim().replace(/[()]/g, '') || null;

    // Get time and servings from the details section
    const detailsItems = document.querySelectorAll('.mm-recipes-details__item');
    let prepTime: string | null = null;
    let cookTime: string | null = null;
    let totalTime: string | null = null;
    let servings: string | null = null;

    detailsItems.forEach((item) => {
      const label = item
        .querySelector('.mm-recipes-details__label')
        ?.textContent?.trim();
      const value = item
        .querySelector('.mm-recipes-details__value')
        ?.textContent?.trim();

      if (label && value) {
        if (label.toLowerCase().includes('prep')) {
          prepTime = value;
        } else if (label.toLowerCase().includes('cook')) {
          cookTime = value;
        } else if (label.toLowerCase().includes('total')) {
          totalTime = value;
        } else if (label.toLowerCase().includes('serving')) {
          servings = value;
        }
      }
    });

    const details: RecipeDetails = {
      title,
      description,
      rating,
      ratingCount,
      prepTime,
      cookTime,
      totalTime,
      servings,
      url: window.location.href
    };

    const summaryParts = [
      `Title: ${title}`,
      description ? `Description: ${description}` : null,
      rating ? `Rating: ${rating} stars (${ratingCount} reviews)` : null,
      prepTime ? `Prep Time: ${prepTime}` : null,
      cookTime ? `Cook Time: ${cookTime}` : null,
      totalTime ? `Total Time: ${totalTime}` : null,
      servings ? `Servings: ${servings}` : null
    ].filter(Boolean);

    return {
      content: [
        {
          type: 'text',
          text: summaryParts.join('\n')
        }
      ],
      structuredContent: details
    };
  }
};
