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

    // Helper to simulate typing with keyboard events
    const simulateTyping = async (element: HTMLInputElement, text: string) => {
      element.focus();
      // Clear existing value
      element.select();
      document.execCommand('delete');

      for (const char of text) {
        element.dispatchEvent(
          new KeyboardEvent('keydown', {key: char, bubbles: true})
        );
        element.value += char;
        element.dispatchEvent(new Event('input', {bubbles: true}));
        element.dispatchEvent(
          new KeyboardEvent('keyup', {key: char, bubbles: true})
        );
        await new Promise((r) => setTimeout(r, 30));
      }
    };

    // First, try to find and click the destination chip/button to activate the input
    const destChip = document.querySelector<HTMLElement>(
      '[data-placeholder="Where to?"], [aria-label*="Where to"], [aria-label*="destination"], input[placeholder*="Where to"]'
    );
    if (destChip) {
      destChip.click();
      await new Promise((r) => setTimeout(r, 200));
    }

    // Now find the input
    const destinationInput = document.querySelector<HTMLInputElement>(
      'input[aria-label*="Where to"], input[aria-label*="destination" i], input[placeholder*="Where to"], input[aria-autocomplete="list"]'
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

    // Simulate typing the destination
    await simulateTyping(destinationInput, destination);

    // Wait for autocomplete dropdown to appear
    await new Promise((resolve) => setTimeout(resolve, 600));

    // Try multiple selectors for the autocomplete results
    const firstResult = document.querySelector<HTMLElement>(
      'ul[role="listbox"] li[role="option"], [role="listbox"] [role="option"], .DFGgtd [role="option"], .n4HaVc'
    );
    if (firstResult) {
      firstResult.click();
      await new Promise((r) => setTimeout(r, 200));
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
