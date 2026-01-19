import type {ToolDefinition} from 'webmcp-polyfill';

interface TicketDetails {
  id: string;
  subject: string;
  status: string;
  priority: string;
  type: string;
  requester: string;
  assignee: string;
  tags: string[];
  comments: CommentInfo[];
}

interface CommentInfo {
  author: string;
  timestamp: string;
  content: string;
  isInternal: boolean;
}

export const tool: ToolDefinition = {
  name: 'zendesk_get_ticket_details',
  description: 'Get detailed information about the currently open ticket',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  },
  async execute() {
    const details: TicketDetails = {
      id: '',
      subject: '',
      status: '',
      priority: '',
      type: '',
      requester: '',
      assignee: '',
      tags: [],
      comments: []
    };

    // Extract ticket ID from URL
    const urlMatch = window.location.pathname.match(/\/tickets\/(\d+)/);
    if (urlMatch) {
      details.id = urlMatch[1];
    }

    // Extract subject from omni header
    const subjectEl = document.querySelector('[data-test-id="omni-header-subject"]');
    if (subjectEl) {
      details.subject = subjectEl.textContent?.trim() || '';
    }

    // Extract status from footer status view
    const statusEl = document.querySelector('[data-test-id="ticket-fields-status-view"]');
    if (statusEl) {
      details.status = statusEl.textContent?.trim() || '';
    }

    // Extract priority
    const priorityEl = document.querySelector('[data-test-id="ticket-fields-priority-select"]');
    if (priorityEl) {
      const valueEl = priorityEl.querySelector('[data-garden-id="dropdowns.combobox.value"]') || priorityEl;
      details.priority = valueEl.textContent?.trim() || '';
    }

    // Extract type
    const typeEl = document.querySelector('[data-test-id="ticket-fields-type-select"]');
    if (typeEl) {
      const valueEl = typeEl.querySelector('[data-garden-id="dropdowns.combobox.value"]') || typeEl;
      details.type = valueEl.textContent?.trim() || '';
    }

    // Extract requester
    const requesterEl = document.querySelector('[data-test-id="ticket-system-field-requester-select"]');
    if (requesterEl) {
      details.requester = requesterEl.textContent?.trim() || '';
    }

    // Extract assignee
    const assigneeEl = document.querySelector('[data-test-id="assignee-field"]');
    if (assigneeEl) {
      details.assignee = assigneeEl.textContent?.trim() || '';
    }

    // Extract tags
    const tagItems = document.querySelectorAll('[data-test-id="ticket-system-field-tags-item-selected"]');
    tagItems.forEach(tag => {
      const tagText = tag.textContent?.trim();
      if (tagText) {
        // Remove the 'x' delete button text
        details.tags.push(tagText.replace(/×$/, '').trim());
      }
    });

    // Extract comments from conversation log
    const commentItems = document.querySelectorAll('[data-test-id="omni-log-comment-item"]');
    commentItems.forEach(comment => {
      const authorEl = comment.querySelector('[data-test-id="omni-log-comment-user-link"]');
      const timestampEl = comment.querySelector('[data-test-id="timestamp-relative"]');
      const contentEl = comment.querySelector('[data-test-id="omni-log-message-content"]');
      const isInternal = comment.querySelector('[data-test-id="omni-log-internal-note-tag"]') !== null;

      if (contentEl) {
        details.comments.push({
          author: authorEl?.textContent?.trim() || 'Unknown',
          timestamp: timestampEl?.textContent?.trim() || '',
          content: contentEl.textContent?.trim() || '',
          isInternal
        });
      }
    });

    if (!details.id && !details.subject) {
      return {
        content: [{type: 'text', text: 'Could not find ticket details. Make sure a ticket is open.'}],
        isError: true
      };
    }

    // Build readable summary
    let summary = `Ticket #${details.id}: ${details.subject}\n\n`;
    summary += `Status: ${details.status || 'N/A'}\n`;
    summary += `Priority: ${details.priority || 'N/A'}\n`;
    summary += `Type: ${details.type || 'N/A'}\n`;
    summary += `Requester: ${details.requester || 'N/A'}\n`;
    summary += `Assignee: ${details.assignee || 'Unassigned'}\n`;
    summary += `Tags: ${details.tags.length > 0 ? details.tags.join(', ') : 'None'}\n`;

    if (details.comments.length > 0) {
      summary += `\nConversation (${details.comments.length} comments):\n`;
      details.comments.forEach((c, i) => {
        const visibility = c.isInternal ? 'Internal' : 'Public';
        summary += `\n[${i + 1}] ${c.author} (${visibility}) - ${c.timestamp}\n`;
        summary += `${c.content.substring(0, 500)}${c.content.length > 500 ? '...' : ''}\n`;
      });
    }

    return {
      content: [{type: 'text', text: summary}],
      structuredContent: {ticket: details}
    };
  }
};
