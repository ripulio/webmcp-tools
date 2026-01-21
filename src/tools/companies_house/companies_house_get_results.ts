import type {ToolDefinition} from 'webmcp-polyfill';

interface SearchResult {
  [key: string]: unknown;
  index: number;
  type: 'company' | 'officer';
  name: string;
  url: string;
  companyNumber?: string;
  status?: string;
  address?: string;
  previousNames?: string[];
  appointmentCount?: string;
}

interface StructuredContent {
  [key: string]: unknown;
  results: SearchResult[];
  totalFound: number;
  query: string | null;
  currentPage: number;
  hasNextPage: boolean;
}

export const companiesHouseGetResults: ToolDefinition = {
  name: 'companies_house_get_results',
  description:
    'Get the list of search results from a Companies House search results page. Returns company or officer details including name, company number, status, and address. Use companies_house_click_result to navigate to a specific result.',
  inputSchema: {
    type: 'object',
    properties: {
      limit: {
        type: 'number',
        description: 'Maximum number of results to return (default: 20)'
      }
    },
    required: []
  },
  async execute(input) {
    const {limit = 20} = input as {limit?: number};

    // Get the current search query from the URL or input field
    const urlParams = new URLSearchParams(window.location.search);
    const currentQuery = urlParams.get('q');
    const currentPage = parseInt(urlParams.get('page') || '1', 10);

    // Get search results
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

    const results: SearchResult[] = [];

    for (let i = 0; i < resultItems.length && results.length < limit; i++) {
      const item = resultItems[i];
      const isCompany = item.classList.contains('type-company');
      const isOfficer = item.classList.contains('type-officer');

      const linkEl = item.querySelector<HTMLAnchorElement>('h3 a.govuk-link');
      if (!linkEl) continue;

      const name = linkEl.textContent?.trim() || 'Unknown';
      const url = linkEl.href;

      // Extract company-specific data
      const paragraphs = item.querySelectorAll('p');
      let companyNumber: string | undefined;
      let status: string | undefined;
      let address: string | undefined;
      let appointmentCount: string | undefined;
      const previousNames: string[] = [];

      paragraphs.forEach((p) => {
        const text = p.textContent?.trim() || '';

        if (text.includes('Company number')) {
          companyNumber = text.replace('Company number', '').trim();
        } else if (text.includes('Matching previous names:')) {
          const spans = p.querySelectorAll('span');
          spans.forEach((span) => {
            const prevName = span.textContent?.trim();
            if (prevName) previousNames.push(prevName);
          });
        } else if (text.includes('appointment')) {
          appointmentCount = text;
        } else if (
          !text.includes('Companies House') &&
          text.length > 0 &&
          !p.classList.contains('meta')
        ) {
          // Check for status indicators
          const statusSpan = p.querySelector('.status-tag');
          if (statusSpan) {
            status = statusSpan.textContent?.trim();
          }

          // Look for address-like content
          if (text.includes(',') && !status) {
            address = text;
          }
        }
      });

      // Also check for inline status
      const inlineStatus = item.querySelector('.status-tag');
      if (inlineStatus && !status) {
        status = inlineStatus.textContent?.trim();
      }

      results.push({
        index: results.length,
        type: isCompany ? 'company' : isOfficer ? 'officer' : 'company',
        name,
        url,
        companyNumber,
        status,
        address,
        previousNames: previousNames.length > 0 ? previousNames : undefined,
        appointmentCount
      });
    }

    // Check for pagination
    const nextPageLink = document.querySelector<HTMLAnchorElement>(
      'a.govuk-pagination__link[rel="next"], .govuk-pagination__next a'
    );
    const hasNextPage = !!nextPageLink;

    // Build the text output
    let textOutput = `Found ${results.length} search results`;
    if (currentQuery) {
      textOutput += ` for "${currentQuery}"`;
    }
    textOutput += ` (Page ${currentPage}):\n\n`;

    textOutput += results
      .map((r) => {
        let line = `[${r.index}] ${r.name}`;
        if (r.companyNumber) line += ` (${r.companyNumber})`;
        if (r.type === 'officer') line += ' [Officer]';
        if (r.status) line += ` - ${r.status}`;
        if (r.address) line += `\n    Address: ${r.address}`;
        if (r.previousNames && r.previousNames.length > 0) {
          line += `\n    Previous names: ${r.previousNames.join(', ')}`;
        }
        if (r.appointmentCount) line += `\n    ${r.appointmentCount}`;
        return line;
      })
      .join('\n\n');

    if (hasNextPage) {
      textOutput += `\n\n[More results available - use companies_house_next_page to see more]`;
    }

    const structuredContent: StructuredContent = {
      results,
      totalFound: results.length,
      query: currentQuery,
      currentPage,
      hasNextPage
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
