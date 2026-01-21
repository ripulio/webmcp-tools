import type {ToolDefinition} from 'webmcp-polyfill';

interface CategoryRecipe {
  [key: string]: unknown;
  title: string;
  url: string;
  isRecipe: boolean;
  index: number;
}

interface CategoryOutput {
  [key: string]: unknown;
  categoryTitle: string;
  totalFound: number;
  items: CategoryRecipe[];
}

export const tool: ToolDefinition = {
  name: 'allrecipes_get_category_recipes',
  description:
    'Get recipes and recipe collections from the current category page. Returns a mix of individual recipes and recipe collection articles.',
  inputSchema: {
    type: 'object',
    properties: {
      limit: {
        type: 'number',
        description: 'Maximum number of items to return (default: 15)'
      }
    },
    required: []
  },
  async execute(input) {
    const {limit = 15} = input as {limit?: number};

    // Get page title
    const pageTitle =
      document.querySelector('h1')?.textContent?.trim() ||
      document.title.replace(' | Allrecipes', '');

    // Find all recipe/article cards
    const allCards = document.querySelectorAll('a.mntl-document-card, a.card');

    if (allCards.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: 'No recipes found on this page. Make sure you are on a category page.'
          }
        ],
        isError: true
      };
    }

    const items: CategoryRecipe[] = [];

    allCards.forEach((card) => {
      if (items.length >= limit) return;

      const anchor = card as HTMLAnchorElement;
      const title = card
        .querySelector('.card__title-text, .card__title')
        ?.textContent?.trim();
      const href = anchor.href;

      // Only include allrecipes.com links with titles
      if (title && href && href.includes('allrecipes.com')) {
        const isRecipe = href.includes('/recipe/');

        items.push({
          title,
          url: href,
          isRecipe,
          index: items.length + 1
        });
      }
    });

    const output: CategoryOutput = {
      categoryTitle: pageTitle,
      totalFound: allCards.length,
      items
    };

    const itemsList = items
      .map(
        (item) =>
          `${item.index}. ${item.isRecipe ? '[Recipe]' : '[Collection]'} ${item.title}`
      )
      .join('\n');

    return {
      content: [
        {
          type: 'text',
          text: `${pageTitle} (${items.length} items shown):\n\n${itemsList}\n\nUse allrecipes_click_category_item to view an item, or allrecipes_search to search within this category.`
        }
      ],
      structuredContent: output
    };
  }
};
