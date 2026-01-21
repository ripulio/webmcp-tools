import type {ToolDefinition} from 'webmcp-polyfill';

export const companiesHouseGoToCharges: ToolDefinition = {
  name: 'companies_house_go_to_charges',
  description:
    'Navigate to the charges tab of a company page to view mortgages and charges registered against the company.',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  },
  async execute() {
    const chargesTab =
      document.querySelector<HTMLAnchorElement>('#charges-tab');

    if (!chargesTab) {
      return {
        content: [
          {
            type: 'text',
            text: 'Charges tab not found. Make sure you are on a company detail page.'
          }
        ],
        isError: true
      };
    }

    chargesTab.click();

    return {
      content: [
        {
          type: 'text',
          text: 'Navigating to company charges. The page will show mortgages and charges registered against the company.'
        }
      ]
    };
  }
};
