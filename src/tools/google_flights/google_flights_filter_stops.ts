import type {ToolDefinition} from 'webmcp-polyfill';

export const tool: ToolDefinition = {
  name: 'google_flights_filter_stops',
  description:
    'Filter flight results by number of stops. Opens the Stops filter dropdown and selects the desired option.',
  inputSchema: {
    type: 'object',
    properties: {
      stops: {
        type: 'string',
        description:
          'Filter option: "any" for any number of stops, "nonstop" for direct flights only, "1" for 1 stop or fewer, "2" for 2 stops or fewer'
      }
    },
    required: ['stops']
  },
  async execute(input) {
    const {stops} = input as {stops: string};

    // Find the Stops filter button by aria-label or text content
    let filterButton: HTMLButtonElement | null =
      document.querySelector<HTMLButtonElement>('button[aria-label*="Stops"]');

    // If not found by aria-label, search by text content
    if (!filterButton) {
      const allButtons = document.querySelectorAll<HTMLButtonElement>('button');
      for (const btn of allButtons) {
        if (btn.textContent?.toLowerCase().includes('stops')) {
          filterButton = btn;
          break;
        }
      }
    }

    if (!filterButton) {
      return {
        content: [
          {
            type: 'text',
            text: 'Stops filter button not found. Make sure you are on a Google Flights search results page.'
          }
        ],
        isError: true
      };
    }

    filterButton.click();

    // Wait for dropdown to open
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Find the appropriate filter option based on the stops parameter
    const optionMap: {[key: string]: string[]} = {
      any: ['any', 'all'],
      nonstop: ['nonstop', 'non-stop', 'direct', '0'],
      '1': ['1 stop', '1 or fewer'],
      '2': ['2 stop', '2 or fewer']
    };

    const searchTerms = optionMap[stops.toLowerCase()] || [stops];

    // Find checkboxes or radio buttons in the dropdown
    const options = document.querySelectorAll<HTMLElement>(
      '[role="menuitem"], [role="option"], [role="checkbox"], [role="radio"], input[type="checkbox"], input[type="radio"]'
    );

    let found = false;
    for (const option of options) {
      const label =
        option.getAttribute('aria-label')?.toLowerCase() ||
        option.textContent?.toLowerCase() ||
        '';
      for (const term of searchTerms) {
        if (label.includes(term.toLowerCase())) {
          option.click();
          found = true;
          break;
        }
      }
      if (found) break;
    }

    // Close the dropdown by clicking elsewhere or finding a done/close button
    const doneButton = document.querySelector<HTMLButtonElement>(
      'button[aria-label*="Done"], button[aria-label*="Apply"], button[aria-label*="Close"]'
    );
    if (doneButton) {
      doneButton.click();
    }

    if (found) {
      return {
        content: [
          {
            type: 'text',
            text: `Applied stops filter: ${stops}. Results should update shortly.`
          }
        ]
      };
    }

    return {
      content: [
        {
          type: 'text',
          text: `Could not find filter option for "${stops}". Available options may be: Any, Nonstop, 1 stop or fewer, 2 stops or fewer.`
        }
      ],
      isError: true
    };
  }
};
