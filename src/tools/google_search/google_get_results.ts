import type {ToolDefinition} from 'webmcp-polyfill';

interface SearchResult {
  [key: string]: unknown;
  index: number;
  title: string;
  url: string;
  displayUrl: string | null;
  snippet: string | null;
}

interface AiOverview {
  content: string;
  isExpanded: boolean;
}

interface StructuredContent {
  [key: string]: unknown;
  results: SearchResult[];
  totalFound: number;
  aiOverview: AiOverview | null;
  query: string | null;
}

export const googleGetResults: ToolDefinition = {
  name: 'google_get_results',
  description:
    'Get the list of search results from a Google search results page. Returns result details including title, URL, and snippet. Also returns AI Overview content if present. Use google_click_result to navigate to a specific result.',
  inputSchema: {
    type: 'object',
    properties: {
      limit: {
        type: 'number',
        description: 'Maximum number of results to return (default: 10)'
      }
    },
    required: []
  },
  async execute(input) {
    const {limit = 10} = input as {limit?: number};

    // Get the current search query from the input field
    const searchInput = document.querySelector<
      HTMLTextAreaElement | HTMLInputElement
    >('textarea[name="q"], input[name="q"]');
    const currentQuery = searchInput?.value || null;

    // Check for AI Overview
    let aiOverview: AiOverview | null = null;
    const aiOverviewButton = document.querySelector<HTMLElement>(
      '[aria-label*="AI Overview"]'
    );
    const aiOverviewContainer = document.querySelector<HTMLElement>('.M8OgIe');

    if (aiOverviewContainer) {
      // Try to get the AI overview content
      const aiContentEl = aiOverviewContainer.querySelector('.wDYxhc, .XzTjhb');
      if (aiContentEl) {
        const isExpanded =
          aiOverviewButton?.getAttribute('aria-label')?.includes('Show less') ??
          false;
        aiOverview = {
          content: aiContentEl.textContent?.trim() || '',
          isExpanded
        };
      }
    }

    // Get search results using the main link selector
    const resultLinks = document.querySelectorAll<HTMLAnchorElement>(
      '#rso a[jsname="UWckNb"]'
    );

    if (resultLinks.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: 'No search results found. Make sure you are on a Google search results page.'
          }
        ],
        isError: true
      };
    }

    const results: SearchResult[] = [];
    const seenUrls = new Set<string>();

    for (let i = 0; i < resultLinks.length && results.length < limit; i++) {
      const link = resultLinks[i];
      const url = link.href;

      // Skip duplicate URLs
      if (seenUrls.has(url)) continue;
      seenUrls.add(url);

      // Skip internal Google links
      if (url.includes('google.com/search') || url.startsWith('javascript:'))
        continue;

      const container = link.closest('.MjjYud') || link.closest('[data-hveid]');
      const h3 = link.querySelector('h3');
      const cite = container?.querySelector('cite');
      const snippetEl = container?.querySelector(
        '.VwiC3b, [data-sncf], .IsZvec'
      );

      results.push({
        index: results.length,
        title: h3?.textContent?.trim() || link.textContent?.trim() || 'Unknown',
        url,
        displayUrl: cite?.textContent?.trim() || null,
        snippet: snippetEl?.textContent?.trim() || null
      });
    }

    // Build the text output
    let textOutput = `Found ${results.length} search results`;
    if (currentQuery) {
      textOutput += ` for "${currentQuery}"`;
    }
    textOutput += ':\n\n';

    if (aiOverview) {
      textOutput += `--- AI Overview ---\n${aiOverview.content.substring(0, 500)}${aiOverview.content.length > 500 ? '...' : ''}\n${aiOverview.isExpanded ? '' : '(Click "Show more" to expand)'}\n\n`;
    }

    textOutput += results
      .map(
        (r) =>
          `[${r.index}] ${r.title}\n    URL: ${r.url}\n    ${r.snippet ? r.snippet.substring(0, 150) + (r.snippet.length > 150 ? '...' : '') : 'No snippet available'}`
      )
      .join('\n\n');

    const structuredContent: StructuredContent = {
      results,
      totalFound: results.length,
      aiOverview,
      query: currentQuery
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
