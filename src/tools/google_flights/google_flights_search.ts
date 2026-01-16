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
    // Find the Explore/Search button in the search form area
    // The button is typically inside .MXvFbd or .xFFcie containers
    let searchButton = document.querySelector<HTMLButtonElement>(
      '.xFFcie button, .MXvFbd button.VfPpkd-LgbsSe'
    );

    // Fallback: find button by text content "Explore" or "Search"
    if (!searchButton) {
      const buttons = document.querySelectorAll<HTMLButtonElement>('button');
      for (const btn of buttons) {
        const text = btn.textContent?.trim().toLowerCase() || '';
        // Match exact "explore" or "search" to avoid matching "Explore destinations" etc.
        if (text === 'explore' || text === 'search' || text === 'done') {
          searchButton = btn;
          break;
        }
      }
    }

    if (!searchButton) {
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
