export const tool = {
  name: 'amazon_next_page',
  description: 'Navigate to the next page of Amazon search results.',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  },
  async execute() {
    // Try multiple selectors for the next button - class-based first, then fallback to aria/link text
    const nextSelectors = [
      '.s-pagination-next:not(.s-pagination-disabled)',
      'a[aria-label*="next" i]:not([aria-disabled="true"])',
      'a.s-pagination-item:last-of-type:not(.s-pagination-disabled)',
      '.a-pagination .a-last a'
    ];

    let nextButton: HTMLAnchorElement | null = null;
    for (const selector of nextSelectors) {
      const el = document.querySelector(selector) as HTMLAnchorElement;
      if (el && el.href) {
        nextButton = el;
        break;
      }
    }

    if (!nextButton) {
      // Check if we're on the last page by looking for a disabled next button
      const disabledNext = document.querySelector(
        '.s-pagination-next.s-pagination-disabled, a[aria-label*="next"][aria-disabled="true"]'
      );
      if (disabledNext) {
        return {
          content: [
            {
              type: 'text' as const,
              text: 'Already on the last page of results.'
            }
          ],
          isError: true
        };
      }
      return {
        content: [
          {
            type: 'text' as const,
            text: 'Next page button not found. Make sure you are on an Amazon search results page.'
          }
        ],
        isError: true
      };
    }

    // Get current page from multiple possible selectors
    const currentPageSelectors = [
      '.s-pagination-selected',
      '.a-pagination .a-selected',
      '[aria-current="page"]'
    ];
    let currentPage = '1';
    for (const selector of currentPageSelectors) {
      const el = document.querySelector(selector);
      if (el?.textContent?.trim()) {
        currentPage = el.textContent.trim();
        break;
      }
    }
    const nextPage = parseInt(currentPage, 10) + 1;

    nextButton.click();

    return {
      content: [
        {
          type: 'text' as const,
          text: `Navigating to page ${nextPage} of search results.`
        }
      ],
      structuredContent: {
        fromPage: parseInt(currentPage, 10),
        toPage: nextPage,
        action: 'navigating_to_next_page'
      }
    };
  }
};
