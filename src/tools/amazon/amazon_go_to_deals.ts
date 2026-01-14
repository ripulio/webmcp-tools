import type {ToolDefinition} from 'webmcp-polyfill';

export const amazonGoToDeals: ToolDefinition = {
  name: 'amazon_go_to_deals',
  description:
    "Navigate to Amazon's Today's Deals page to browse current deals and discounts.",
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  },
  async execute() {
    const dealsLink = document.querySelector<HTMLAnchorElement>(
      'a[href*="/gp/goldbox"], a[href*="goldbox"]'
    );

    if (dealsLink) {
      dealsLink.click();
      return {
        content: [
          {
            type: 'text',
            text: "Navigating to Today's Deals page."
          }
        ]
      };
    }

    window.location.href = 'https://www.amazon.com/gp/goldbox';

    return {
      content: [
        {
          type: 'text',
          text: "Navigating to Today's Deals page via direct URL."
        }
      ]
    };
  }
};
