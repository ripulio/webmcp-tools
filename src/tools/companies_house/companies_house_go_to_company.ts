import type {ToolDefinition} from 'webmcp-polyfill';

export const companiesHouseGoToCompany: ToolDefinition = {
  name: 'companies_house_go_to_company',
  description:
    'Navigate directly to a company page by company number. This is useful when you already know the company number and want to skip the search step.',
  inputSchema: {
    type: 'object',
    properties: {
      companyNumber: {
        type: 'string',
        description:
          'The company registration number (e.g., "00445790", "SC123456")'
      }
    },
    required: ['companyNumber']
  },
  async execute(input) {
    const {companyNumber} = input as {companyNumber: string};

    // Validate company number format (basic validation)
    const cleanNumber = companyNumber.trim().toUpperCase();
    if (!/^[A-Z]{0,2}\d{6,8}$/.test(cleanNumber)) {
      return {
        content: [
          {
            type: 'text',
            text: `Invalid company number format: "${companyNumber}". Expected format like "00445790" or "SC123456".`
          }
        ],
        isError: true
      };
    }

    const url = `https://find-and-update.company-information.service.gov.uk/company/${cleanNumber}`;
    window.location.href = url;

    return {
      content: [
        {
          type: 'text',
          text: `Navigating to company ${cleanNumber}. Use companies_house_get_company_overview to retrieve company details after the page loads.`
        }
      ]
    };
  }
};
