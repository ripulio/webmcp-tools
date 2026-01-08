import type {ToolDefinition} from 'webmcp-polyfill';

interface Filing {
  [key: string]: unknown;
  index: number;
  date: string;
  type: string;
  description: string;
  subDocuments: string[];
}

interface StructuredContent {
  [key: string]: unknown;
  filings: Filing[];
  totalCount: number;
  companyName: string | null;
  companyNumber: string | null;
  hasMoreFilings: boolean;
}

export const companiesHouseGetFilings: ToolDefinition = {
  name: 'companies_house_get_filings',
  description:
    'Get the filing history from a company filing history page. Returns filing dates, types, and descriptions.',
  inputSchema: {
    type: 'object',
    properties: {
      limit: {
        type: 'number',
        description: 'Maximum number of filings to return (default: 25)'
      }
    },
    required: []
  },
  async execute(input) {
    const {limit = 25} = input as {limit?: number};

    // Check if we're on a filing history page
    const filingTable = document.querySelector('#fhTable');
    if (!filingTable) {
      return {
        content: [
          {
            type: 'text',
            text: 'Filing history table not found. Make sure you are on a company filing history page. Use companies_house_go_to_filings first.'
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

    // Get filing rows
    const rows = filingTable.querySelectorAll('tr');
    const filings: Filing[] = [];

    // Skip header row
    for (let i = 1; i < rows.length && filings.length < limit; i++) {
      const row = rows[i];
      const cells = row.querySelectorAll('td');

      if (cells.length < 2) continue;

      const date = cells[0]?.textContent?.trim() || '';

      // Get filing type (may be hidden with sft-toggled class)
      const typeCell = cells[1];
      const type = typeCell?.textContent?.trim() || '';

      // Get description from the third cell or second cell depending on layout
      let description = '';
      let descCell: Element | null = null;

      if (cells.length >= 3) {
        descCell = cells[2];
      } else if (cells.length === 2) {
        descCell = cells[1];
      }

      if (descCell) {
        // Get the main description (usually in strong tag)
        const strongEl = descCell.querySelector('strong');
        if (strongEl) {
          description = strongEl.textContent?.trim() || '';
        } else {
          // Get first text node content
          const textContent = descCell.textContent?.trim() || '';
          description = textContent.split('\n')[0].trim();
        }
      }

      // Get sub-documents if any
      const subDocuments: string[] = [];
      const subDocList = descCell?.querySelector('ul.list-bullet');
      if (subDocList) {
        const items = subDocList.querySelectorAll('li');
        items.forEach((item) => {
          const text = item.textContent?.trim();
          if (text) subDocuments.push(text);
        });
      }

      filings.push({
        index: filings.length,
        date,
        type,
        description,
        subDocuments
      });
    }

    // Check if there are more filings (pagination or load more)
    const hasMoreFilings = rows.length > limit + 1;

    // Build text output
    let textOutput = `Filing History`;
    if (companyName) textOutput += ` for ${companyName}`;
    if (companyNumber) textOutput += ` (${companyNumber})`;
    textOutput += `\n${'='.repeat(40)}\n\n`;
    textOutput += `Showing ${filings.length} filings:\n\n`;

    textOutput += filings
      .map((f) => {
        let line = `[${f.index}] ${f.date}`;
        if (f.type) line += ` - ${f.type}`;
        line += `\n    ${f.description}`;
        if (f.subDocuments.length > 0) {
          f.subDocuments.forEach((doc) => {
            line += `\n      - ${doc}`;
          });
        }
        return line;
      })
      .join('\n\n');

    const structuredContent: StructuredContent = {
      filings,
      totalCount: filings.length,
      companyName,
      companyNumber,
      hasMoreFilings
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
