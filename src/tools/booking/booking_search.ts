import type {ToolDefinition} from 'webmcp-polyfill';

export const bookingSearch: ToolDefinition = {
  name: 'booking_search',
  description:
    'Search for accommodations on Booking.com by entering a destination. Enters the destination in the search box and submits the search. After calling this tool, use booking_get_results to retrieve the search results.',
  inputSchema: {
    type: 'object',
    properties: {
      destination: {
        type: 'string',
        description:
          'The destination to search for (city, region, hotel name, etc.)'
      }
    },
    required: ['destination']
  },
  async execute(input) {
    const {destination} = input as {destination: string};

    const searchInput =
      document.querySelector<HTMLInputElement>('input[name="ss"]');
    if (!searchInput) {
      return {
        content: [
          {
            type: 'text',
            text: 'Search input not found. Make sure you are on the Booking.com homepage.'
          }
        ],
        isError: true
      };
    }

    const searchButton = document.querySelector<HTMLButtonElement>(
      'button[type="submit"]'
    );
    if (!searchButton) {
      return {
        content: [
          {
            type: 'text',
            text: 'Search button not found. Make sure you are on the Booking.com homepage.'
          }
        ],
        isError: true
      };
    }

    searchInput.value = destination;
    searchInput.dispatchEvent(new Event('input', {bubbles: true}));

    // Small delay to allow autocomplete to process, then click search
    setTimeout(() => {
      searchButton.click();
    }, 100);

    return {
      content: [
        {
          type: 'text',
          text: `Searching Booking.com for: "${destination}". Use booking_get_results to retrieve the search results after the page loads.`
        }
      ]
    };
  }
};
