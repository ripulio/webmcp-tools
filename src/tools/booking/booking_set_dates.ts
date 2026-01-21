import type {ToolDefinition} from 'webmcp-polyfill';

export const bookingSetDates: ToolDefinition = {
  name: 'booking_set_dates',
  description:
    'Set the check-in and check-out dates for a Booking.com search. Opens the date picker and selects the specified dates. Dates should be in YYYY-MM-DD format.',
  inputSchema: {
    type: 'object',
    properties: {
      checkIn: {
        type: 'string',
        description: 'Check-in date in YYYY-MM-DD format (e.g., "2025-03-15")'
      },
      checkOut: {
        type: 'string',
        description: 'Check-out date in YYYY-MM-DD format (e.g., "2025-03-18")'
      }
    },
    required: ['checkIn', 'checkOut']
  },
  async execute(input) {
    const {checkIn, checkOut} = input as {checkIn: string; checkOut: string};

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(checkIn) || !dateRegex.test(checkOut)) {
      return {
        content: [
          {
            type: 'text',
            text: 'Invalid date format. Please use YYYY-MM-DD format (e.g., "2025-03-15").'
          }
        ],
        isError: true
      };
    }

    // Validate check-out is after check-in
    if (new Date(checkOut) <= new Date(checkIn)) {
      return {
        content: [
          {
            type: 'text',
            text: 'Check-out date must be after check-in date.'
          }
        ],
        isError: true
      };
    }

    // Find and click the date button to open the picker
    const dateButtons = document.querySelectorAll<HTMLButtonElement>(
      'button[class*="dc15842869"]'
    );
    const dateButton = dateButtons[0];

    if (!dateButton) {
      return {
        content: [
          {
            type: 'text',
            text: 'Date picker button not found. Make sure you are on the Booking.com homepage or search page.'
          }
        ],
        isError: true
      };
    }

    dateButton.click();

    // Wait for calendar to appear
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Helper to click a date
    const clickDate = (dateStr: string): boolean => {
      const dateSpan = document.querySelector<HTMLSpanElement>(
        `span[data-date="${dateStr}"]`
      );
      if (dateSpan) {
        dateSpan.click();
        return true;
      }
      return false;
    };

    // Helper to navigate to the correct month
    const navigateToMonth = async (targetDate: string): Promise<boolean> => {
      const maxAttempts = 24; // Up to 2 years forward

      for (let i = 0; i < maxAttempts; i++) {
        // Check if the date is visible
        const dateSpan = document.querySelector<HTMLSpanElement>(
          `span[data-date="${targetDate}"]`
        );
        if (dateSpan) {
          return true;
        }

        // Click next month button
        const nextButton = document.querySelector<HTMLButtonElement>(
          'button[aria-label="Next month"]'
        );
        if (!nextButton) {
          return false;
        }
        nextButton.click();
        await new Promise((resolve) => setTimeout(resolve, 150));
      }
      return false;
    };

    // Navigate to and select check-in date
    const foundCheckIn = await navigateToMonth(checkIn);
    if (!foundCheckIn) {
      return {
        content: [
          {
            type: 'text',
            text: `Could not navigate to check-in date: ${checkIn}. The date may be too far in the future.`
          }
        ],
        isError: true
      };
    }

    if (!clickDate(checkIn)) {
      return {
        content: [
          {
            type: 'text',
            text: `Could not select check-in date: ${checkIn}.`
          }
        ],
        isError: true
      };
    }

    await new Promise((resolve) => setTimeout(resolve, 200));

    // Navigate to and select check-out date
    const foundCheckOut = await navigateToMonth(checkOut);
    if (!foundCheckOut) {
      return {
        content: [
          {
            type: 'text',
            text: `Could not navigate to check-out date: ${checkOut}. The date may be too far in the future.`
          }
        ],
        isError: true
      };
    }

    if (!clickDate(checkOut)) {
      return {
        content: [
          {
            type: 'text',
            text: `Could not select check-out date: ${checkOut}.`
          }
        ],
        isError: true
      };
    }

    return {
      content: [
        {
          type: 'text',
          text: `Dates set: Check-in ${checkIn}, Check-out ${checkOut}. Use booking_search or booking_set_guests to continue configuring your search.`
        }
      ]
    };
  }
};
