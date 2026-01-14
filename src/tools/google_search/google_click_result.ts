import type {ToolDefinition} from 'webmcp-polyfill';

export const googleClickResult: ToolDefinition = {
  name: 'google_click_result',
  description:
    'Click on a specific search result to navigate to that page. Use the index from google_get_results to specify which result to click.',
  inputSchema: {
    type: 'object',
    properties: {
      index: {
        type: 'number',
        description:
          'The index of the search result to click (0-based, from google_get_results)'
      }
    },
    required: ['index']
  },
  async execute(input) {
    const {index} = input as {index: number};

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

    // Filter to unique URLs (same logic as get_results)
    const uniqueLinks: HTMLAnchorElement[] = [];
    const seenUrls = new Set<string>();

    for (const link of resultLinks) {
      const url = link.href;
      if (seenUrls.has(url)) continue;
      if (url.includes('google.com/search') || url.startsWith('javascript:'))
        continue;
      seenUrls.add(url);
      uniqueLinks.push(link);
    }

    if (index < 0 || index >= uniqueLinks.length) {
      return {
        content: [
          {
            type: 'text',
            text: `Invalid index: ${index}. Valid range is 0-${uniqueLinks.length - 1}.`
          }
        ],
        isError: true
      };
    }

    const targetLink = uniqueLinks[index];
    const title =
      targetLink.querySelector('h3')?.textContent ||
      targetLink.textContent ||
      'Unknown';
    const url = targetLink.href;

    targetLink.click();

    return {
      content: [
        {
          type: 'text',
          text: `Clicking on result [${index}]: "${title.substring(0, 80)}${title.length > 80 ? '...' : ''}"\nNavigating to: ${url}`
        }
      ]
    };
  }
};
