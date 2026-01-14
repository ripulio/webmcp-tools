import type {ToolDefinition} from 'webmcp-polyfill';

export const bookingSetGuests: ToolDefinition = {
  name: 'booking_set_guests',
  description:
    'Set the number of adults, children, and rooms for a Booking.com search. Opens the occupancy selector and adjusts the values.',
  inputSchema: {
    type: 'object',
    properties: {
      adults: {
        type: 'number',
        description: 'Number of adults (1-30, default: 2)'
      },
      children: {
        type: 'number',
        description: 'Number of children (0-10, default: 0)'
      },
      rooms: {
        type: 'number',
        description: 'Number of rooms (1-30, default: 1)'
      }
    },
    required: []
  },
  async execute(input) {
    const {
      adults = 2,
      children = 0,
      rooms = 1
    } = input as {
      adults?: number;
      children?: number;
      rooms?: number;
    };

    // Validate ranges
    if (adults < 1 || adults > 30) {
      return {
        content: [
          {
            type: 'text',
            text: 'Adults must be between 1 and 30.'
          }
        ],
        isError: true
      };
    }
    if (children < 0 || children > 10) {
      return {
        content: [
          {
            type: 'text',
            text: 'Children must be between 0 and 10.'
          }
        ],
        isError: true
      };
    }
    if (rooms < 1 || rooms > 30) {
      return {
        content: [
          {
            type: 'text',
            text: 'Rooms must be between 1 and 30.'
          }
        ],
        isError: true
      };
    }

    // Find and click the occupancy button (second button with dc15842869 class)
    const occupancyButtons = document.querySelectorAll<HTMLButtonElement>(
      'button[class*="dc15842869"]'
    );
    const occupancyButton = occupancyButtons[1];

    if (!occupancyButton) {
      return {
        content: [
          {
            type: 'text',
            text: 'Occupancy selector button not found. Make sure you are on the Booking.com homepage or search page.'
          }
        ],
        isError: true
      };
    }

    occupancyButton.click();

    // Wait for popup to appear
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Find the range inputs
    const adultsInput =
      document.querySelector<HTMLInputElement>('#group_adults');
    const childrenInput =
      document.querySelector<HTMLInputElement>('#group_children');
    const roomsInput = document.querySelector<HTMLInputElement>('#no_rooms');

    if (!adultsInput || !childrenInput || !roomsInput) {
      return {
        content: [
          {
            type: 'text',
            text: 'Occupancy inputs not found. The popup may not have opened correctly.'
          }
        ],
        isError: true
      };
    }

    // Set values using the range inputs
    const setRangeValue = (input: HTMLInputElement, value: number) => {
      input.value = String(value);
      input.setAttribute('aria-valuenow', String(value));
      input.dispatchEvent(new Event('input', {bubbles: true}));
      input.dispatchEvent(new Event('change', {bubbles: true}));
    };

    setRangeValue(adultsInput, adults);
    setRangeValue(childrenInput, children);
    setRangeValue(roomsInput, rooms);

    // Click Done button to close the popup
    await new Promise((resolve) => setTimeout(resolve, 100));
    const doneButton = Array.from(
      document.querySelectorAll<HTMLButtonElement>('button')
    ).find((b) => b.textContent?.trim() === 'Done');
    if (doneButton) {
      doneButton.click();
    }

    return {
      content: [
        {
          type: 'text',
          text: `Guests set: ${adults} adult${adults !== 1 ? 's' : ''}, ${children} child${children !== 1 ? 'ren' : ''}, ${rooms} room${rooms !== 1 ? 's' : ''}. Use booking_search to search or booking_set_dates to set dates.`
        }
      ]
    };
  }
};
