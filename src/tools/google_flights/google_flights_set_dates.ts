import type {ToolDefinition} from 'webmcp-polyfill';

export const tool: ToolDefinition = {
  name: 'google_flights_set_dates',
  description:
    'Set the departure and optional return dates for a flight search on Google Flights. Opens the date picker and selects the specified dates. For one-way flights, only provide the departure date.',
  inputSchema: {
    type: 'object',
    properties: {
      departureDate: {
        type: 'string',
        description:
          'The departure date in YYYY-MM-DD format (e.g., "2025-03-15")'
      },
      returnDate: {
        type: 'string',
        description:
          'The return date in YYYY-MM-DD format (e.g., "2025-03-22"). Optional for one-way flights.'
      }
    },
    required: ['departureDate']
  },
  async execute(input) {
    const {departureDate, returnDate} = input as {
      departureDate: string;
      returnDate?: string;
    };

    // Click on the departure date input to open the date picker
    const departureDateInput = document.querySelector<HTMLInputElement>(
      'input[aria-label="Departure"]'
    );
    if (!departureDateInput) {
      return {
        content: [
          {
            type: 'text',
            text: 'Departure date input not found. Make sure you are on the Google Flights search page.'
          }
        ],
        isError: true
      };
    }

    departureDateInput.click();

    // Wait for date picker to open
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Parse the dates
    const depDate = new Date(departureDate);
    const depDay = depDate.getDate();
    const depMonth = depDate.toLocaleString('en-US', {month: 'long'});
    const depYear = depDate.getFullYear();

    // Find and click the departure date in the calendar
    // Google Flights uses data-iso attribute for dates
    const depDateSelector = `[data-iso="${departureDate}"]`;
    let depDateCell = document.querySelector<HTMLElement>(depDateSelector);

    if (!depDateCell) {
      // Try alternative selector using aria-label
      const dateLabel = `${depMonth} ${depDay}, ${depYear}`;
      depDateCell = document.querySelector<HTMLElement>(
        `[aria-label*="${dateLabel}"], [aria-label*="${depDay}"][aria-label*="${depMonth}"]`
      );
    }

    if (depDateCell) {
      depDateCell.click();
      await new Promise((resolve) => setTimeout(resolve, 200));
    } else {
      return {
        content: [
          {
            type: 'text',
            text: `Could not find departure date ${departureDate} in the calendar. The date may be outside the visible range.`
          }
        ],
        isError: true
      };
    }

    // If return date is provided, select it
    if (returnDate) {
      const retDate = new Date(returnDate);
      const retDay = retDate.getDate();
      const retMonth = retDate.toLocaleString('en-US', {month: 'long'});
      const retYear = retDate.getFullYear();

      const retDateSelector = `[data-iso="${returnDate}"]`;
      let retDateCell = document.querySelector<HTMLElement>(retDateSelector);

      if (!retDateCell) {
        const dateLabel = `${retMonth} ${retDay}, ${retYear}`;
        retDateCell = document.querySelector<HTMLElement>(
          `[aria-label*="${dateLabel}"], [aria-label*="${retDay}"][aria-label*="${retMonth}"]`
        );
      }

      if (retDateCell) {
        retDateCell.click();
        await new Promise((resolve) => setTimeout(resolve, 200));
      } else {
        return {
          content: [
            {
              type: 'text',
              text: `Set departure date to ${departureDate}, but could not find return date ${returnDate} in the calendar.`
            }
          ],
          isError: true
        };
      }
    }

    // Click Done button to close the date picker
    const doneButton = document.querySelector<HTMLButtonElement>(
      'button[aria-label="Done. Search for round trip flights"],' +
        'button[aria-label="Done. Search for one way flights"],' +
        'button[aria-label*="Done"]'
    );
    if (doneButton) {
      doneButton.click();
    }

    const message = returnDate
      ? `Set dates: ${departureDate} to ${returnDate}`
      : `Set departure date: ${departureDate}`;

    return {
      content: [
        {
          type: 'text',
          text: message
        }
      ]
    };
  }
};
