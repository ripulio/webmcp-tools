import type {ToolDefinition} from 'webmcp-polyfill';

export const companiesHouseClickResult: ToolDefinition = {
  name: 'companies_house_click_result',
  description:
    'Click on a search result to view company or officer details. Use the index from companies_house_get_results to select which result to click.',
  inputSchema: {
    type: 'object',
    properties: {
      index: {
        type: 'number',
        description:
          'The index of the result to click (from companies_house_get_results)'
      }
    },
    required: ['index']
  },
  async execute(input) {
    const {index} = input as {index: number};

    const resultItems =
      document.querySelectorAll<HTMLLIElement>('#results > li');

    if (resultItems.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: 'No search results found. Make sure you are on a Companies House search results page.'
          }
        ],
        isError: true
      };
    }

    if (index < 0 || index >= resultItems.length) {
      return {
        content: [
          {
            type: 'text',
            text: `Invalid index ${index}. Available indices: 0-${resultItems.length - 1}`
          }
        ],
        isError: true
      };
    }

    const targetItem = resultItems[index];
    const link = targetItem.querySelector<HTMLAnchorElement>('h3 a.govuk-link');

    if (!link) {
      return {
        content: [
          {
            type: 'text',
            text: `Could not find link in result at index ${index}.`
          }
        ],
        isError: true
      };
    }

    const name = link.textContent?.trim() || 'Unknown';
    link.click();

    return {
      content: [
        {
          type: 'text',
          text: `Navigating to: ${name}. Use companies_house_get_company_overview or companies_house_get_officers to retrieve details.`
        }
      ]
    };
  }
};
