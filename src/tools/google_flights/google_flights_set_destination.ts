import type {ToolDefinition} from 'webmcp-polyfill';

export const tool: ToolDefinition = {
  name: 'google_flights_set_destination',
  description:
    'Set the arrival airport/city for a flight search on Google Flights. Enters the destination location and selects the first matching result from the autocomplete dropdown.',
  inputSchema: {
    type: 'object',
    properties: {
      destination: {
        type: 'string',
        description:
          'The arrival airport code (e.g., "JFK", "LAX") or city name (e.g., "New York", "London")'
      }
    },
    required: ['destination']
  },
  async execute(input) {
    const {destination} = input as {destination: string};

    const destinationInput = document.querySelector<HTMLInputElement>(
      'input[aria-label*="Where to"]'
    );
    if (!destinationInput) {
      return {
        content: [
          {
            type: 'text',
            text: 'Destination input not found. Make sure you are on the Google Flights search page.'
          }
        ],
        isError: true
      };
    }

    // Focus and clear the input
    destinationInput.focus();
    destinationInput.value = '';
    destinationInput.dispatchEvent(new Event('input', {bubbles: true}));

    // Type the destination
    destinationInput.value = destination;
    destinationInput.dispatchEvent(new Event('input', {bubbles: true}));

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
            text: `Set destination to: "${destination}" - selected first matching result.`
          }
        ]
      };
    }

    return {
      content: [
        {
          type: 'text',
          text: `Entered destination: "${destination}". No autocomplete results appeared - you may need to verify the selection manually.`
        }
      ]
    };
  }
};
