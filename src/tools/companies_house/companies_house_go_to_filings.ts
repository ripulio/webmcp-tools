import type {ToolDefinition} from 'webmcp-polyfill';

export const companiesHouseGoToFilings: ToolDefinition = {
  name: 'companies_house_go_to_filings',
  description:
    'Navigate to the filing history tab of a company page. Use companies_house_get_filings after this to retrieve the list of filings.',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  },
  async execute() {
    const filingTab = document.querySelector<HTMLAnchorElement>(
      '#filing-history-tab'
    );

    if (!filingTab) {
      return {
        content: [
          {
            type: 'text',
            text: 'Filing history tab not found. Make sure you are on a company detail page.'
          }
        ],
        isError: true
      };
    }

    filingTab.click();

    return {
      content: [
        {
          type: 'text',
          text: 'Navigating to filing history. Use companies_house_get_filings to retrieve the filings list.'
        }
      ]
    };
  }
};
