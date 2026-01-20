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

    // Helper to set input value and trigger React/framework updates
    const setInputValue = (element: HTMLInputElement, text: string) => {
      // Get the native value setter to bypass React's synthetic events
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        'value'
      )?.set;
      if (nativeInputValueSetter) {
        nativeInputValueSetter.call(element, text);
      } else {
        element.value = text;
      }
      // Dispatch input event to trigger framework updates
      element.dispatchEvent(new Event('input', {bubbles: true}));
      element.dispatchEvent(new Event('change', {bubbles: true}));
    };

    // Helper to simulate typing character by character for autocomplete
    const simulateTyping = async (element: HTMLInputElement, text: string) => {
      element.focus();
      // Clear existing value using native setter
      setInputValue(element, '');
      await new Promise((r) => setTimeout(r, 50));

      // Type character by character to trigger autocomplete
      for (let i = 1; i <= text.length; i++) {
        const partial = text.substring(0, i);
        setInputValue(element, partial);
        element.dispatchEvent(
          new KeyboardEvent('keydown', {key: text[i - 1], bubbles: true})
        );
        element.dispatchEvent(
          new KeyboardEvent('keyup', {key: text[i - 1], bubbles: true})
        );
        await new Promise((r) => setTimeout(r, 50));
      }
    };

    // Find the destination input by aria-label "Where to?"
    let destinationInput = document.querySelector<HTMLInputElement>(
      'input.II2One[aria-label="Where to?"]'
    );

    // Fallback: try second II2One input
    if (!destinationInput) {
      const allInputs =
        document.querySelectorAll<HTMLInputElement>('input.II2One');
      if (allInputs.length > 1) {
        destinationInput = allInputs[1];
      }
    }

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

    // Click on the container to open the location picker
    // The clickable area is the parent container with class cQnuXe or e5F5td
    const container =
      destinationInput.closest('.cQnuXe') ||
      destinationInput.closest('.e5F5td');
    if (container) {
      (container as HTMLElement).click();
    } else {
      destinationInput.click();
    }
    await new Promise((r) => setTimeout(r, 300));

    // Now find the input that's active/focused - it may be a different input in a dialog
    const activeInput =
      document.querySelector<HTMLInputElement>(
        'input.II2One:focus, input[aria-expanded="true"], input.II2One[aria-label="Where to?"]'
      ) || destinationInput;

    // Simulate typing the destination
    await simulateTyping(activeInput, destination);

    // Wait for autocomplete dropdown to appear
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Try multiple selectors for the autocomplete results
    const firstResult = document.querySelector<HTMLElement>(
      'ul[role="listbox"] li[role="option"], [role="listbox"] [role="option"], .DFGgtd [role="option"], .n4HaVc, li[data-ved]'
    );
    if (firstResult) {
      firstResult.click();
      await new Promise((r) => setTimeout(r, 300));
      return {
        content: [
          {
            type: 'text',
            text: `Set destination to: "${destination}" - selected first matching result.`
          }
        ]
      };
    }

    // Check if the input value was set even without autocomplete click
    const currentValue = activeInput.value || destinationInput.value;
    return {
      content: [
        {
          type: 'text',
          text: `Entered destination: "${destination}". ${currentValue ? `Input shows: "${currentValue}".` : ''} No autocomplete results appeared - you may need to verify the selection manually.`
        }
      ]
    };
  }
};
