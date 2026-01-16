import type {ToolDefinition} from 'webmcp-polyfill';

export const tool: ToolDefinition = {
  name: 'google_flights_open_passengers',
  description:
    'Open the passenger selection dialog on Google Flights to view and modify passenger counts. Use the increment/decrement buttons in the dialog to adjust adults, children, and infants.',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  },
  async execute() {
    const passengerButton = document.querySelector<HTMLButtonElement>(
      'button[aria-label*="passenger"]'
    );
    if (!passengerButton) {
      return {
        content: [
          {
            type: 'text',
            text: 'Passenger selector button not found. Make sure you are on the Google Flights search page.'
          }
        ],
        isError: true
      };
    }

    passengerButton.click();

    // Wait for dialog to open
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Try to read current passenger counts from the dialog
    const dialog = document.querySelector('[role="dialog"]');
    if (!dialog) {
      return {
        content: [
          {
            type: 'text',
            text: 'Opened passenger selector, but dialog did not appear.'
          }
        ],
        isError: true
      };
    }

    // Extract current passenger counts
    const passengerRows = dialog.querySelectorAll('[role="group"]');
    const counts: {type: string; count: string}[] = [];

    passengerRows.forEach((row) => {
      const label = row.querySelector('span, label')?.textContent?.trim();
      const countSpan = row.querySelector(
        '[aria-live="polite"], input[type="number"]'
      );
      const count =
        countSpan?.textContent?.trim() ||
        (countSpan as HTMLInputElement)?.value ||
        '?';
      if (label) {
        counts.push({type: label, count});
      }
    });

    const currentLabel = passengerButton.getAttribute('aria-label') || '';
    const countInfo =
      counts.length > 0
        ? counts.map((c) => `${c.type}: ${c.count}`).join(', ')
        : currentLabel;

    return {
      content: [
        {
          type: 'text',
          text: `Passenger dialog opened. Current: ${countInfo}. Use the increment/decrement buttons to adjust.`
        }
      ]
    };
  }
};
