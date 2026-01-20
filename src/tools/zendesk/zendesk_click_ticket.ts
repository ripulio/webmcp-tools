import type {ToolDefinition} from 'webmcp-polyfill';

export const tool: ToolDefinition = {
  name: 'zendesk_click_ticket',
  description: 'Click on a ticket in the list to open it',
  inputSchema: {
    type: 'object',
    properties: {
      index: {
        type: 'number',
        description:
          'The index of the ticket to click (from zendesk_get_tickets results)'
      }
    },
    required: ['index']
  },
  async execute(input) {
    const {index} = input as {index: number};

    // Find all ticket rows
    const ticketRows = document.querySelectorAll(
      '[data-test-id="generic-table-row"]'
    );

    if (index < 0 || index >= ticketRows.length) {
      return {
        content: [
          {
            type: 'text',
            text: `Invalid index ${index}. Available range: 0-${ticketRows.length - 1}`
          }
        ],
        isError: true
      };
    }

    const row = ticketRows[index];

    // Find the subject link within the row
    const ticketLink = row.querySelector<HTMLAnchorElement>(
      '[data-test-id="ticket-table-cells-subject"] a'
    );

    if (ticketLink) {
      ticketLink.click();
      return {
        content: [
          {
            type: 'text',
            text: `Clicked ticket at index ${index}. Use zendesk_get_ticket_details after the page loads.`
          }
        ]
      };
    }

    // Fallback: try clicking the row itself
    (row as HTMLElement).click();

    return {
      content: [
        {
          type: 'text',
          text: `Clicked ticket row at index ${index}. Use zendesk_get_ticket_details after the page loads.`
        }
      ]
    };
  }
};
