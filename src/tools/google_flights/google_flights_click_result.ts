import type {ToolDefinition} from 'webmcp-polyfill';

export const tool: ToolDefinition = {
  name: 'google_flights_click_result',
  description:
    'Click on a specific flight result to view its details. Use the index from google_flights_get_results to specify which flight to select.',
  inputSchema: {
    type: 'object',
    properties: {
      index: {
        type: 'number',
        description: 'The index of the flight result to click (0-based)'
      }
    },
    required: ['index']
  },
  async execute(input) {
    const {index} = input as {index: number};

    // Find flight result rows using multiple possible selectors
    const flightRows = document.querySelectorAll<HTMLElement>(
      'ul[role="list"] > li, .pIav2d, [jsname="IWWDBc"], .yR1fYc, .Rk10dc > li, [role="button"][aria-label*="$"]'
    );

    if (flightRows.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: 'No flight results found. Make sure you are on a Google Flights search results page.'
          }
        ],
        isError: true
      };
    }

    if (index < 0 || index >= flightRows.length) {
      return {
        content: [
          {
            type: 'text',
            text: `Invalid index ${index}. There are ${flightRows.length} results available (indices 0-${flightRows.length - 1}).`
          }
        ],
        isError: true
      };
    }

    const targetRow = flightRows[index];

    // Try to find a clickable element within the row
    const clickable =
      targetRow.querySelector<HTMLElement>('[role="button"], button, a') ||
      targetRow;

    clickable.click();

    // Get some info about what was clicked for feedback
    const ariaLabel = targetRow.getAttribute('aria-label') || '';
    const textContent = targetRow.textContent?.slice(0, 100) || '';

    return {
      content: [
        {
          type: 'text',
          text: `Clicked flight result ${index + 1}. ${ariaLabel || textContent}... Use google_flights_get_flight_details to view the full details.`
        }
      ]
    };
  }
};
