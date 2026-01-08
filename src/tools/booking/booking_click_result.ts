import type {ToolDefinition} from 'webmcp-polyfill';

export const bookingClickResult: ToolDefinition = {
  name: 'booking_click_result',
  description:
    'Click on a property from the search results to view its details page. Use the index from booking_get_results to specify which property to click.',
  inputSchema: {
    type: 'object',
    properties: {
      index: {
        type: 'number',
        description:
          'The index of the property to click (from booking_get_results)'
      }
    },
    required: ['index']
  },
  async execute(input) {
    const {index} = input as {index: number};

    const cards = document.querySelectorAll<HTMLElement>(
      '[data-testid="property-card"]'
    );

    if (cards.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: 'No property results found. Make sure you are on a Booking.com search results page.'
          }
        ],
        isError: true
      };
    }

    if (index < 0 || index >= cards.length) {
      return {
        content: [
          {
            type: 'text',
            text: `Invalid index ${index}. Please provide an index between 0 and ${cards.length - 1}.`
          }
        ],
        isError: true
      };
    }

    const card = cards[index];
    const titleLink = card.querySelector<HTMLAnchorElement>(
      '[data-testid="title-link"]'
    );

    if (!titleLink) {
      return {
        content: [
          {
            type: 'text',
            text: `Could not find link for property at index ${index}.`
          }
        ],
        isError: true
      };
    }

    const title =
      card.querySelector('[data-testid="title"]')?.textContent?.trim() ||
      'Unknown';
    titleLink.click();

    return {
      content: [
        {
          type: 'text',
          text: `Navigating to property: "${title}". Use booking_get_property_details to get the property information after the page loads.`
        }
      ]
    };
  }
};
