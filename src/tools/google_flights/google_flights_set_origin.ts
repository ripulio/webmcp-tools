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

    // First, try to find and click the origin chip/button to activate the input
    const originChip = document.querySelector<HTMLElement>(
      '[data-placeholder="Where from?"], [aria-label*="Where from"], [aria-label*="origin"], .e5F5td input, input[placeholder*="Where from"]'
    );
    if (originChip) {
      originChip.click();
      await new Promise((r) => setTimeout(r, 200));
    }

    // Now find the input - it might be a combobox input
    const originInput = document.querySelector<HTMLInputElement>(
      'input[aria-label*="Where from"], input[aria-label*="origin" i], input[placeholder*="Where from"], .II2One input, input[aria-autocomplete="list"]'
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

    // Simulate typing the origin
    await simulateTyping(originInput, origin);

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
