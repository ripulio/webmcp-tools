import type {ToolDefinition} from 'webmcp-polyfill';

interface Email {
  index: number;
  sender: string;
  subject: string;
  snippet: string;
  date: string;
  isUnread: boolean;
  isStarred: boolean;
}

export const tool: ToolDefinition = {
  name: 'gmail_get_emails',
  description:
    'Get a list of emails in the current view (inbox, starred, sent, etc). Returns sender, subject, snippet, date, and read/starred status.',
  inputSchema: {
    type: 'object',
    properties: {
      limit: {
        type: 'number',
        description: 'Maximum number of emails to return (default: 20)'
      }
    },
    required: []
  },
  async execute(input) {
    const {limit = 20} = input as {limit?: number};

    const rows = document.querySelectorAll('tr.zA');

    if (rows.length === 0) {
      return {
        content: [{type: 'text', text: 'No emails found in the current view.'}],
        isError: true
      };
    }

    const emails: Email[] = [];

    for (let i = 0; i < Math.min(rows.length, limit); i++) {
      const row = rows[i];
      const senderEl =
        row.querySelector('.yX .yW span') || row.querySelector('.yX .yW');
      const subjectEl =
        row.querySelector('.y6 span[data-thread-id]') ||
        row.querySelector('.y6 span');
      const snippetEl = row.querySelector('.y2');
      const dateEl = row.querySelector('.xW span');
      const starEl = row.querySelector('.T-KT');

      emails.push({
        index: i,
        sender: senderEl?.textContent?.trim() || '',
        subject: subjectEl?.textContent?.trim() || '',
        snippet: snippetEl?.textContent?.trim() || '',
        date: dateEl?.textContent?.trim() || '',
        isUnread: row.classList.contains('zE'),
        isStarred:
          starEl?.getAttribute('aria-label')?.includes('Starred') || false
      });
    }

    const currentView =
      window.location.hash.replace('#', '').split('/')[0] || 'inbox';

    return {
      content: [
        {
          type: 'text',
          text: `Found ${emails.length} emails in ${currentView}:\n\n${emails
            .map(
              (e) =>
                `[${e.index}] ${e.isUnread ? '[UNREAD] ' : ''}${e.isStarred ? '[*] ' : ''}${e.sender}: ${e.subject} (${e.date})`
            )
            .join('\n')}`
        }
      ],
      structuredContent: {
        view: currentView,
        totalShown: emails.length,
        emails
      }
    };
  }
};
