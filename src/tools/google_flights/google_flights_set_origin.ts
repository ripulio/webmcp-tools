import type {ToolDefinition} from 'webmcp-polyfill';

export const tool: ToolDefinition = {
  name: 'google_flights_set_origin',
  description:
    'Set the departure airport/city for a flight search on Google Flights. Enters the origin location and selects the first matching result from the autocomplete dropdown.',
  inputSchema: {
    type: 'object',
    properties: {
      origin: {
        type: 'string',
        description:
          'The departure airport code (e.g., "JFK", "LAX") or city name (e.g., "New York", "London")'
      }
    },
    required: ['origin']
  },
  async execute(input) {
    const {origin} = input as {origin: string};

    const originInput = document.querySelector<HTMLInputElement>(
      'input[aria-label*="Where from"]'
    );
    if (!originInput) {
      return {
        content: [
          {
            type: 'text',
            text: 'Origin input not found. Make sure you are on the Google Flights search page.'
          }
        ],
        isError: true
      };
    }

    // Focus and clear the input
    originInput.focus();
    originInput.value = '';
    originInput.dispatchEvent(new Event('input', {bubbles: true}));

    // Type the origin
    originInput.value = origin;
    originInput.dispatchEvent(new Event('input', {bubbles: true}));

    // Wait for autocomplete dropdown to appear and select first result
    await new Promise((resolve) => setTimeout(resolve, 500));

    const firstResult = document.querySelector<HTMLElement>(
      'ul[role="listbox"] li[role="option"]'
    );
    if (firstResult) {
      firstResult.click();
      return {
        content: [
          {
            type: 'text',
            text: `Set origin to: "${origin}" - selected first matching result.`
          }
        ]
      };
    }

    return {
      content: [
        {
          type: 'text',
          text: `Entered origin: "${origin}". No autocomplete results appeared - you may need to verify the selection manually.`
        }
      ]
    };
  }
};
