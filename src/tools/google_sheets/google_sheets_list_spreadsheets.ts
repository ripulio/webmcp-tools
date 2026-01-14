import type {ToolDefinition} from 'webmcp-polyfill';

export const tool: ToolDefinition = {
  name: 'google_sheets_list_spreadsheets',
  description:
    'List recent spreadsheets shown on the Google Sheets home page. Returns titles, owners, and indices for opening.',
  inputSchema: {
    type: 'object',
    properties: {
      limit: {
        type: 'number',
        description: 'Maximum number of spreadsheets to return (default: 20)'
      }
    },
    required: []
  },
  async execute(input) {
    const {limit = 20} = input as {limit?: number};

    const listItems = document.querySelectorAll('.docs-homescreen-list-item');
    if (listItems.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: 'No spreadsheets found. Make sure you are on the Google Sheets home page.'
          }
        ],
        isError: true
      };
    }

    const spreadsheets: Array<{
      index: number;
      title: string;
      owner: string;
      date: string;
      isShared: boolean;
    }> = [];

    listItems.forEach((item, i) => {
      if (i < limit) {
        const title =
          item
            .querySelector('.docs-homescreen-list-item-title-value')
            ?.textContent?.trim() || 'Untitled';
        const owner =
          item
            .querySelector('.docs-homescreen-list-item-owner')
            ?.textContent?.trim() || '';
        const date =
          item
            .querySelector('.docs-homescreen-list-item-date')
            ?.textContent?.trim() || '';
        const isShared = item.classList.contains('docs-homescreen-item-shared');

        spreadsheets.push({
          index: i,
          title,
          owner,
          date,
          isShared
        });
      }
    });

    const text = spreadsheets
      .map(
        (s) =>
          `[${s.index}] ${s.title}${s.isShared ? ' (shared)' : ''} - Owner: ${s.owner || 'me'}${s.date ? ` - ${s.date}` : ''}`
      )
      .join('\n');

    return {
      content: [
        {
          type: 'text',
          text: `Found ${spreadsheets.length} spreadsheets:\n\n${text}`
        }
      ],
      structuredContent: {spreadsheets}
    };
  }
};
