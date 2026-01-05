import type {ToolDefinition} from 'webmcp-polyfill';

const CATEGORY_URLS: Record<string, string> = {
  dinners: 'https://www.allrecipes.com/recipes/17562/dinner/',
  meals: 'https://www.allrecipes.com/recipes-a-z-6735880',
  ingredients: 'https://www.allrecipes.com/ingredients-a-z-6740416',
  occasions: 'https://www.allrecipes.com/recipes/85/holidays-and-events/',
  cuisines: 'https://www.allrecipes.com/cuisine-a-z-6740455',
  'kitchen tips': 'https://www.allrecipes.com/kitchen-tips/',
  news: 'https://www.allrecipes.com/food-news-trends/',
  features: 'https://www.allrecipes.com/recipes/1642/everyday-cooking/',
  video: 'https://www.allrecipes.com/video',
  // Common subcategories
  breakfast: 'https://www.allrecipes.com/recipes/78/breakfast-and-brunch/',
  lunch: 'https://www.allrecipes.com/recipes/17561/lunch/',
  desserts: 'https://www.allrecipes.com/recipes/79/desserts/',
  appetizers: 'https://www.allrecipes.com/recipes/76/appetizers-and-snacks/',
  salads: 'https://www.allrecipes.com/recipes/96/salad/',
  soups: 'https://www.allrecipes.com/recipes/94/soups-stews-and-chili/',
  chicken: 'https://www.allrecipes.com/recipes/201/meat-and-poultry/chicken/',
  beef: 'https://www.allrecipes.com/recipes/200/meat-and-poultry/beef/',
  pork: 'https://www.allrecipes.com/recipes/205/meat-and-poultry/pork/',
  seafood: 'https://www.allrecipes.com/recipes/93/seafood/',
  pasta: 'https://www.allrecipes.com/recipes/95/pasta-and-noodles/',
  vegetarian:
    'https://www.allrecipes.com/recipes/87/everyday-cooking/vegetarian/',
  vegan: 'https://www.allrecipes.com/recipes/87/everyday-cooking/vegan/',
  healthy: 'https://www.allrecipes.com/recipes/84/healthy-recipes/',
  'quick and easy':
    'https://www.allrecipes.com/recipes/1947/everyday-cooking/quick-and-easy/',
  '30 minute meals':
    'https://www.allrecipes.com/recipes/455/everyday-cooking/more-meal-ideas/30-minute-meals/'
};

export const tool: ToolDefinition = {
  name: 'allrecipes_go_to_category',
  description:
    'Navigate to a recipe category page. Supports main categories (dinners, meals, ingredients, occasions, cuisines) and popular subcategories (breakfast, lunch, desserts, chicken, beef, pasta, vegetarian, healthy, etc.).',
  inputSchema: {
    type: 'object',
    properties: {
      category: {
        type: 'string',
        description:
          'Category name (e.g., "dinners", "breakfast", "chicken", "pasta", "healthy", "30 minute meals")'
      }
    },
    required: ['category']
  },
  async execute(input) {
    const {category} = input as {category: string};

    if (!category || typeof category !== 'string') {
      return {
        content: [
          {
            type: 'text',
            text: 'Missing required parameter "category". Please provide a category name.'
          }
        ],
        isError: true
      };
    }

    const normalizedCategory = category.toLowerCase().trim();
    const url = CATEGORY_URLS[normalizedCategory];

    if (!url) {
      const availableCategories = Object.keys(CATEGORY_URLS).join(', ');
      return {
        content: [
          {
            type: 'text',
            text: `Unknown category "${category}". Available categories: ${availableCategories}`
          }
        ],
        isError: true
      };
    }

    window.location.href = url;

    return {
      content: [
        {
          type: 'text',
          text: `Navigating to "${category}" category. Use allrecipes_get_category_recipes to see the recipes once the page loads.`
        }
      ]
    };
  }
};
