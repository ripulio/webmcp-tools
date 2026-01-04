import type {ToolDefinition} from 'webmcp-polyfill';

export const tool: ToolDefinition = {
  name: 'allrecipes_next_search_page',
  description: 'Navigate to the next page of search results.',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  },
  async execute() {
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

    // Find the next page link in pagination
    const pagination = document.querySelector('#mntl-pagination_1-0');
    if (!pagination) {
      return {
        content: [
          {
            type: 'text',
            text: 'Pagination not found on this page.'
          }
        ],
        isError: true
      };
    }

    // Find the currently selected page
    const currentPageItem = pagination.querySelector(
      '.mntl-pagination__item--selected'
    );
    if (!currentPageItem) {
      return {
        content: [
          {
            type: 'text',
            text: 'Could not determine current page.'
          }
        ],
        isError: true
      };
    }

    // Find the next sibling page item
    const nextPageItem = currentPageItem.nextElementSibling;
    if (!nextPageItem) {
      return {
        content: [
          {
            type: 'text',
            text: 'Already on the last page of search results.'
          }
        ],
        isError: true
      };
    }

    const nextPageLink = nextPageItem.querySelector(
      'a'
    ) as HTMLAnchorElement | null;
    if (!nextPageLink || !nextPageLink.href) {
      return {
        content: [
          {
            type: 'text',
            text: 'Could not find next page link.'
          }
        ],
        isError: true
      };
    }

    const currentPageNum =
      currentPageItem.querySelector('a')?.textContent?.trim() || '1';
    const nextPageNum = nextPageLink.textContent?.trim() || 'next';

    window.location.href = nextPageLink.href;

    return {
      content: [
        {
          type: 'text',
          text: `Navigating from page ${currentPageNum} to page ${nextPageNum}. Use allrecipes_get_search_results to extract the new results.`
        }
      ]
    };
  }
};
