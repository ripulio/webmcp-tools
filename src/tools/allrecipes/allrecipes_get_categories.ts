import type {ToolDefinition} from 'webmcp-polyfill';

interface Category {
  [key: string]: unknown;
  name: string;
  url: string;
}

interface CategoriesOutput {
  [key: string]: unknown;
  categories: Category[];
}

export const tool: ToolDefinition = {
  name: 'allrecipes_get_categories',
  description:
    'Get the list of main recipe categories available in the navigation menu (Dinners, Meals, Ingredients, Occasions, Cuisines, etc.).',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  },
  async execute() {
    // Get categories from the header navigation
    const navItems = document.querySelectorAll(
      '.mntl-header-nav__list-item > a'
    );

    if (navItems.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: 'Could not find navigation menu. The page structure may have changed.'
          }
        ],
        isError: true
      };
    }

    const categories: Category[] = [];

    navItems.forEach((item) => {
      const anchor = item as HTMLAnchorElement;
      const name = anchor.textContent?.trim();
      const url = anchor.href;

      if (name && url) {
        categories.push({name, url});
      }
    });

    const output: CategoriesOutput = {
      categories
    };

    const categoriesList = categories
      .map((cat, i) => `${i + 1}. ${cat.name}`)
      .join('\n');

    return {
      content: [
        {
          type: 'text',
          text: `Available recipe categories:\n\n${categoriesList}\n\nUse allrecipes_go_to_category to navigate to a category.`
        }
      ],
      structuredContent: output
    };
  }
};
