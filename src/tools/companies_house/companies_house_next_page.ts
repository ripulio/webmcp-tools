import type {ToolDefinition} from 'webmcp-polyfill';

export const companiesHouseNextPage: ToolDefinition = {
  name: 'companies_house_next_page',
  description:
    'Navigate to the next page of search results. Use after companies_house_get_results indicates more results are available.',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  },
  async execute() {
    // Try multiple selectors for next page link
    const nextLink = document.querySelector<HTMLAnchorElement>(
      '.govuk-pagination__next a, a[rel="next"], .govuk-pagination__link[aria-label*="next" i]'
    );

    if (!nextLink) {
      return {
        content: [
          {
            type: 'text',
            text: 'No next page available. You may be on the last page of results.'
          }
        ],
        isError: true
      };
    }

    nextLink.click();

    return {
      content: [
        {
          type: 'text',
          text: 'Navigating to the next page of results. Use companies_house_get_results to retrieve the results.'
        }
      ]
    };
  }
};
