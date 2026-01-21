import type {ToolDefinition} from 'webmcp-polyfill';

interface Charge {
  [key: string]: unknown;
  index: number;
  status: string;
  createdOn: string | null;
  deliveredOn: string | null;
  personsEntitled: string[];
  particulars: string | null;
}

interface StructuredContent {
  [key: string]: unknown;
  charges: Charge[];
  totalCount: number;
  companyName: string | null;
  companyNumber: string | null;
}

export const companiesHouseGetCharges: ToolDefinition = {
  name: 'companies_house_get_charges',
  description:
    'Get the list of charges (mortgages and secured loans) from a company charges page. Returns charge status, dates, persons entitled, and particulars.',
  inputSchema: {
    type: 'object',
    properties: {
      limit: {
        type: 'number',
        description: 'Maximum number of charges to return (default: 20)'
      }
    },
    required: []
  },
  async execute(input) {
    const {limit = 20} = input as {limit?: number};

    // Check if we're on a charges page
    const chargesSection = document.querySelector('#mortgage-content');
    if (!chargesSection) {
      return {
        content: [
          {
            type: 'text',
            text: 'Charges section not found. Make sure you are on a company charges page. Use companies_house_go_to_charges first.'
          }
        ],
        isError: true
      };
    }

    // Get company info from header
    const companyHeader = document.querySelector('.company-header h1');
    const companyName = companyHeader?.textContent?.trim() || null;
    const companyNumberEl = document.querySelector('#company-number strong');
    const companyNumber = companyNumberEl?.textContent?.trim() || null;

    // Get charge items
    const chargeItems = document.querySelectorAll('.mortgage');

    if (chargeItems.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: `No charges found for this company. The company may have no registered mortgages or charges.`
          }
        ],
        structuredContent: {
          charges: [],
          totalCount: 0,
          companyName,
          companyNumber
        }
      };
    }

    const charges: Charge[] = [];

    chargeItems.forEach((item, i) => {
      if (charges.length >= limit) return;

      // Get status
      const statusEl = item.querySelector('.status-tag, .charge-status');
      const status = statusEl?.textContent?.trim() || 'Unknown';

      // Get dates and other details from dl elements
      let createdOn: string | null = null;
      let deliveredOn: string | null = null;
      let particulars: string | null = null;
      const personsEntitled: string[] = [];

      const dts = item.querySelectorAll('dt');
      dts.forEach((dt) => {
        const label = dt.textContent?.trim().toLowerCase() || '';
        const dd = dt.nextElementSibling;
        const value = dd?.textContent?.trim() || null;

        if (label.includes('created')) {
          createdOn = value;
        } else if (label.includes('delivered')) {
          deliveredOn = value;
        } else if (label.includes('persons entitled')) {
          // May be a list
          const listItems = dd?.querySelectorAll('li');
          if (listItems && listItems.length > 0) {
            listItems.forEach((li) => {
              const text = li.textContent?.trim();
              if (text) personsEntitled.push(text);
            });
          } else if (value) {
            personsEntitled.push(value);
          }
        }
      });

      // Get particulars from a paragraph or specific element
      const particularsEl = item.querySelector(
        '.charge-particulars, p.particulars'
      );
      if (particularsEl) {
        particulars = particularsEl.textContent?.trim() || null;
      }

      charges.push({
        index: i,
        status,
        createdOn,
        deliveredOn,
        personsEntitled,
        particulars
      });
    });

    // Build text output
    let textOutput = `Company Charges`;
    if (companyName) textOutput += ` for ${companyName}`;
    if (companyNumber) textOutput += ` (${companyNumber})`;
    textOutput += `\n${'='.repeat(40)}\n\n`;
    textOutput += `Found ${charges.length} charges:\n\n`;

    textOutput += charges
      .map((c) => {
        let line = `[${c.index}] ${c.status}`;
        if (c.createdOn) line += `\n    Created: ${c.createdOn}`;
        if (c.deliveredOn) line += `\n    Delivered: ${c.deliveredOn}`;
        if (c.personsEntitled.length > 0) {
          line += `\n    Persons Entitled: ${c.personsEntitled.join(', ')}`;
        }
        if (c.particulars) line += `\n    Particulars: ${c.particulars}`;
        return line;
      })
      .join('\n\n');

    const structuredContent: StructuredContent = {
      charges,
      totalCount: charges.length,
      companyName,
      companyNumber
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
