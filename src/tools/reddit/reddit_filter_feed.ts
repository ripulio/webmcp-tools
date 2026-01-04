import type {ToolDefinition} from 'webmcp-polyfill';

export const redditFilterFeed: ToolDefinition = {
  name: 'reddit_filter_feed',
  description:
    'Filter the Reddit homepage feed by category (e.g., Popular, News, Gaming). Only works on the Reddit homepage.',
  inputSchema: {
    type: 'object',
    properties: {
      category: {
        type: 'string',
        description:
          'The category to filter by (e.g., "Popular", "News", "Gaming", "Sports"). Use "list" to see available categories.'
      }
    },
    required: ['category']
  },
  async execute(input) {
    const {category} = input as {category: string};

    // Check if we're on the homepage
    const isHomepage =
      window.location.pathname === '/' ||
      window.location.pathname === '' ||
      window.location.pathname.startsWith('/?');

    if (!isHomepage) {
      return {
        content: [
          {
            type: 'text',
            text: 'Feed filtering only works on the Reddit homepage. Navigate to reddit.com first.'
          }
        ],
        isError: true
      };
    }

    // Find the category chips
    const chipContainer = document.querySelector('#feed-chip-scroller');
    if (!chipContainer) {
      return {
        content: [
          {
            type: 'text',
            text: 'Category filter chips not found on this page.'
          }
        ],
        isError: true
      };
    }

    const chips =
      chipContainer.querySelectorAll<HTMLButtonElement>('button[role="tab"]');
    const availableCategories = Array.from(chips).map(
      (c) => c.textContent?.trim() || ''
    );

    // If user wants to list categories
    if (category.toLowerCase() === 'list') {
      return {
        content: [
          {
            type: 'text',
            text: `Available feed categories:\n${availableCategories.map((c, i) => `${i + 1}. ${c}`).join('\n')}`
          }
        ],
        structuredContent: {
          categories: availableCategories
        }
      };
    }

    // Find matching category (case-insensitive)
    const normalizedCategory = category.toLowerCase().trim();
    let targetChip: HTMLButtonElement | null = null;

    for (const chip of chips) {
      const chipText = chip.textContent?.trim().toLowerCase() || '';
      if (
        chipText === normalizedCategory ||
        chipText.includes(normalizedCategory)
      ) {
        targetChip = chip;
        break;
      }
    }

    if (!targetChip) {
      return {
        content: [
          {
            type: 'text',
            text: `Category "${category}" not found. Available categories: ${availableCategories.join(', ')}`
          }
        ],
        isError: true
      };
    }

    const categoryName = targetChip.textContent?.trim() || category;
    targetChip.click();

    return {
      content: [
        {
          type: 'text',
          text: `Filtering feed by "${categoryName}". Use reddit_get_feed_posts to retrieve the filtered posts.`
        }
      ]
    };
  }
};
