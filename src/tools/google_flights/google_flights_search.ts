import type {ToolDefinition} from 'webmcp-polyfill';

export const tool: ToolDefinition = {
  name: 'google_flights_search',
  description:
    'Click the search button to search for flights on Google Flights. Make sure origin, destination, and dates are set before calling this tool. After searching, use google_flights_get_results to retrieve the flight options.',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  },
  async execute() {
    // Try multiple selectors for the search button
    const searchButton = document.querySelector<HTMLButtonElement>(
      'button[aria-label*="Search" i], button[aria-label*="flight" i], button.VfPpkd-LgbsSe[jsname], .MXvFbd button, button[jsname="vLv7Lb"]'
    );

    if (!searchButton) {
      // Fallback: try to find by text content
      const buttons = document.querySelectorAll<HTMLButtonElement>('button');
      for (const btn of buttons) {
        const text = btn.textContent?.toLowerCase() || '';
        if (
          text.includes('search') ||
          text.includes('explore') ||
          text.includes('done')
        ) {
          btn.click();
          return {
            content: [
              {
                type: 'text',
                text: 'Searching for flights. Use google_flights_get_results to retrieve the results after the page loads.'
              }
            ]
          };
        }
      }

      return {
        content: [
          {
            type: 'text',
            text: 'Search button not found. Make sure you are on the Google Flights search page and have entered origin and destination.'
          }
        ],
        isError: true
      };
    }

    searchButton.click();

    return {
      content: [
        {
          type: 'text',
          text: 'Searching for flights. Use google_flights_get_results to retrieve the results after the page loads.'
        }
      ]
    };
  }
};
