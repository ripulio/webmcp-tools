import type {ToolDefinition} from 'webmcp-polyfill';

export const companiesHouseFilterResults: ToolDefinition = {
  name: 'companies_house_filter_results',
  description:
    'Filter search results by type: all results, companies only, officers only, or disqualified officers only.',
  inputSchema: {
    type: 'object',
    properties: {
      filter: {
        type: 'string',
        enum: ['all', 'companies', 'officers', 'disqualifications'],
        description: 'The type of results to filter by'
      }
    },
    required: ['filter']
  },
  async execute(input) {
    const {filter} = input as {filter: string};

    const filterLinks: Record<string, string> = {
      all: '#search_all',
      companies: '#search_companies',
      officers: '#search_officers',
      disqualifications: '#search_disqualifications'
    };

    const selector = filterLinks[filter];
    if (!selector) {
      return {
        content: [
          {
            type: 'text',
            text: `Invalid filter type: ${filter}. Use one of: all, companies, officers, disqualifications`
          }
        ],
        isError: true
      };
    }

    const link = document.querySelector<HTMLAnchorElement>(selector);
    if (!link) {
      return {
        content: [
          {
            type: 'text',
            text: `Filter tab not found. Make sure you are on a Companies House search results page.`
          }
        ],
        isError: true
      };
    }

    link.click();

    return {
      content: [
        {
          type: 'text',
          text: `Filtering results by: ${filter}. Use companies_house_get_results to retrieve the filtered results.`
        }
      ]
    };
  }
};
