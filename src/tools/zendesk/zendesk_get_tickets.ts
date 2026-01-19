import type {ToolDefinition} from 'webmcp-polyfill';

interface TicketInfo {
  id: string;
  subject: string;
  status: string;
  updated: string;
  created: string;
  assignee: string;
  index: number;
}

export const tool: ToolDefinition = {
  name: 'zendesk_get_tickets',
  description: 'Get the list of tickets currently displayed on the page',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  },
  async execute() {
    const tickets: TicketInfo[] = [];

    // Find ticket rows in the generic table (search results, views)
    const ticketRows = document.querySelectorAll('[data-test-id="generic-table-row"]');

    if (ticketRows.length === 0) {
      return {
        content: [{type: 'text', text: 'No tickets found on the current page. Make sure you are viewing a ticket list or search results.'}],
        isError: true
      };
    }

    ticketRows.forEach((row, index) => {
      const ticket: TicketInfo = {
        id: '',
        subject: '',
        status: '',
        updated: '',
        created: '',
        assignee: '',
        index
      };

      // Extract ticket ID
      const idCell = row.querySelector('[data-test-id="generic-table-cells-id"]');
      if (idCell) {
        ticket.id = idCell.textContent?.trim().replace('#', '') || '';
      }

      // Extract subject
      const subjectCell = row.querySelector('[data-test-id="ticket-table-cells-subject"]');
      if (subjectCell) {
        const link = subjectCell.querySelector('a');
        ticket.subject = link?.textContent?.trim() || subjectCell.textContent?.trim() || '';
      }

      // Extract status from status badge
      const statusBadge = row.querySelector('[data-test-id^="status-badge"]');
      if (statusBadge) {
        ticket.status = statusBadge.textContent?.trim() || '';
      }

      // Extract dates (first is updated, second is created)
      const dateCells = row.querySelectorAll('[data-test-id="generic-table-cells-date"]');
      if (dateCells.length >= 1) {
        ticket.updated = dateCells[0]?.textContent?.trim() || '';
      }
      if (dateCells.length >= 2) {
        ticket.created = dateCells[1]?.textContent?.trim() || '';
      }

      // Extract assignee
      const assigneeCell = row.querySelector('[data-test-id="ticket-table-cells-assignee"]');
      if (assigneeCell) {
        ticket.assignee = assigneeCell.textContent?.trim() || '';
      }

      tickets.push(ticket);
    });

    const ticketSummary = tickets.map(t =>
      `[${t.index}] #${t.id}: ${t.subject} (${t.status}${t.assignee ? `, ${t.assignee}` : ''})`
    ).join('\n');

    return {
      content: [{type: 'text', text: `Found ${tickets.length} tickets:\n\n${ticketSummary}\n\nUse zendesk_click_ticket with the index number to open a ticket.`}],
      structuredContent: {tickets}
    };
  }
};
