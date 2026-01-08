import type {ToolDefinition} from 'webmcp-polyfill';

interface SearchResult {
  [key: string]: unknown;
  title: string;
  url: string;
  ratingCount: string | null;
  index: number;
}

interface SearchResultsOutput {
  [key: string]: unknown;
  query: string;
  resultsOnPage: number;
  currentPage: number;
  results: SearchResult[];
}

export const tool: ToolDefinition = {
  name: 'allrecipes_get_search_results',
  description:
    'Extract recipe search results from the current Allrecipes search results page. Returns recipe titles, URLs, and rating counts.',
  inputSchema: {
    type: 'object',
    properties: {
      limit: {
        type: 'number',
        description: 'Maximum number of results to return (default: 10)'
      }
    },
    required: []
  },
  async execute(input) {
    const {limit = 10} = input as {limit?: number};

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

    // Get the search query from the URL
    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get('q') || '';

    // Get current page from URL offset parameter
    const offset = parseInt(urlParams.get('offset') || '0', 10);
    const currentPage = Math.floor(offset / 24) + 1;

    // Find all recipe cards in search results
    const cards = document.querySelectorAll(
      '#mntl-search-results__list_1-0 > a.mntl-card-list-card--extendable'
    );

    if (cards.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: 'No search results found on this page. The page may still be loading or the search returned no results.'
          }
        ],
        isError: true
      };
    }

    const results: SearchResult[] = [];

    cards.forEach((card, index) => {
      if (index >= limit) return;

      const anchor = card as HTMLAnchorElement;
      const titleEl = card.querySelector('.card__title-text');
      const ratingEl = card.querySelector(
        '.mm-recipes-card-meta__rating-count-number'
      );

      const title = titleEl?.textContent?.trim() || '';
      const url = anchor.href || '';
      const ratingText = ratingEl?.textContent?.trim() || null;

      // Parse rating count (format: "557\n\nRatings")
      let ratingCount: string | null = null;
      if (ratingText) {
        const countMatch = ratingText.match(/^(\d+)/);
        if (countMatch) {
          ratingCount = countMatch[1];
        }
      }

      if (title && url) {
        results.push({
          title,
          url,
          ratingCount,
          index: index + 1
        });
      }
    });

    const output: SearchResultsOutput = {
      query,
      resultsOnPage: cards.length,
      currentPage,
      results
    };

    return {
      content: [
        {
          type: 'text',
          text: `Found ${results.length} recipes for "${query}" (page ${currentPage}):\n\n${results.map((r) => `${r.index}. ${r.title}${r.ratingCount ? ` (${r.ratingCount} ratings)` : ''}`).join('\n')}`
        }
      ],
      structuredContent: output
    };
  }
};
