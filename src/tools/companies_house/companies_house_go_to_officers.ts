import type {ToolDefinition} from 'webmcp-polyfill';

export const companiesHouseGoToOfficers: ToolDefinition = {
  name: 'companies_house_go_to_officers',
  description:
    'Navigate to the officers/people tab of a company page. Use companies_house_get_officers after this to retrieve the list of officers.',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  },
  async execute() {
    const peopleTab = document.querySelector<HTMLAnchorElement>('#people-tab');

    if (!peopleTab) {
      return {
        content: [
          {
            type: 'text',
            text: 'Officers tab not found. Make sure you are on a company detail page.'
          }
        ],
        isError: true
      };
    }

    peopleTab.click();

    return {
      content: [
        {
          type: 'text',
          text: 'Navigating to company officers. Use companies_house_get_officers to retrieve the officer list.'
        }
      ]
    };
  }
};
