import type {ToolDefinition} from 'webmcp-polyfill';

interface CompanyOverview {
  [key: string]: unknown;
  companyName: string;
  companyNumber: string;
  status: string | null;
  companyType: string | null;
  incorporatedOn: string | null;
  registeredAddress: string | null;
  previousNames: Array<{name: string; period: string}>;
  sicCodes: string[];
}

export const companiesHouseGetCompanyOverview: ToolDefinition = {
  name: 'companies_house_get_company_overview',
  description:
    'Get company overview information from a company detail page. Returns company name, number, status, type, incorporation date, registered address, and previous names.',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  },
  async execute() {
    // Check if we're on a company page
    const companyHeader = document.querySelector('.company-header');
    if (!companyHeader) {
      return {
        content: [
          {
            type: 'text',
            text: 'Company header not found. Make sure you are on a company detail page.'
          }
        ],
        isError: true
      };
    }

    // Get company name
    const nameEl = companyHeader.querySelector('h1.heading-xlarge');
    const companyName = nameEl?.textContent?.trim() || 'Unknown';

    // Get company number
    const numberEl = document.querySelector('#company-number strong');
    const companyNumber = numberEl?.textContent?.trim() || 'Unknown';

    // Get company status
    const statusEl = document.querySelector('#company-status');
    const status = statusEl?.textContent?.trim() || null;

    // Get company type
    const typeEl = document.querySelector('#company-type');
    const companyType = typeEl?.textContent?.trim() || null;

    // Get incorporation date
    const dateEl = document.querySelector('#company-creation-date');
    const incorporatedOn = dateEl?.textContent?.trim() || null;

    // Get registered address
    const addressDls = document.querySelectorAll('dl');
    let registeredAddress: string | null = null;
    addressDls.forEach((dl) => {
      const dt = dl.querySelector('dt');
      if (dt?.textContent?.includes('Registered office address')) {
        const dd = dl.querySelector('dd');
        registeredAddress = dd?.textContent?.trim() || null;
      }
    });

    // Get previous names
    const previousNames: Array<{name: string; period: string}> = [];
    const previousNamesTable = document.querySelector('#previousNameTable');
    if (previousNamesTable) {
      const rows = previousNamesTable.querySelectorAll('tr');
      rows.forEach((row, i) => {
        if (i === 0) return; // Skip header row
        const cells = row.querySelectorAll('td');
        if (cells.length >= 2) {
          previousNames.push({
            name: cells[0].textContent?.trim() || '',
            period: cells[1].textContent?.trim() || ''
          });
        }
      });
    }

    // Get SIC codes
    const sicCodes: string[] = [];
    const sicList = document.querySelector(
      '#sic-list, .sic-list, ul.list-bullet'
    );
    if (sicList) {
      const sicItems = sicList.querySelectorAll('li');
      sicItems.forEach((item) => {
        const text = item.textContent?.trim();
        if (text && /^\d/.test(text)) {
          sicCodes.push(text);
        }
      });
    }

    // Build the text output
    let textOutput = `Company Overview\n`;
    textOutput += `================\n\n`;
    textOutput += `Name: ${companyName}\n`;
    textOutput += `Company Number: ${companyNumber}\n`;
    if (status) textOutput += `Status: ${status}\n`;
    if (companyType) textOutput += `Type: ${companyType}\n`;
    if (incorporatedOn) textOutput += `Incorporated: ${incorporatedOn}\n`;
    if (registeredAddress)
      textOutput += `Registered Address: ${registeredAddress}\n`;

    if (sicCodes.length > 0) {
      textOutput += `\nSIC Codes:\n`;
      sicCodes.forEach((code) => {
        textOutput += `  - ${code}\n`;
      });
    }

    if (previousNames.length > 0) {
      textOutput += `\nPrevious Names:\n`;
      previousNames.forEach((pn) => {
        textOutput += `  - ${pn.name} (${pn.period})\n`;
      });
    }

    textOutput += `\n[Use companies_house_go_to_officers, companies_house_go_to_filings, or companies_house_go_to_charges to view more details]`;

    const structuredContent: CompanyOverview = {
      companyName,
      companyNumber,
      status,
      companyType,
      incorporatedOn,
      registeredAddress,
      previousNames,
      sicCodes
    };

    return {
      content: [
        {
          type: 'text',
          text: textOutput
        }
      ],
      structuredContent
    };
  }
};
