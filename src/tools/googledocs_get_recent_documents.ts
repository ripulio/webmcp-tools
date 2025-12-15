export const tool = {
  name: 'googledocs_get_recent_documents',
  description: 'Get a list of recent documents from Google Docs homepage',
  inputSchema: {
    type: 'object',
    properties: {
      limit: {
        type: 'number',
        description: 'Maximum number of documents to return (default: 10)'
      }
    },
    required: []
  },
  async execute(rawInput: {limit?: number}) {
    const {limit = 10} = rawInput || {};

    const gridItems = document.querySelectorAll('.docs-homescreen-grid-item');
    if (gridItems.length === 0) {
      return {
        content: [
          {
            type: 'text' as const,
            text: 'No recent documents found. Make sure you are on the Google Docs homepage.'
          }
        ],
        isError: true
      };
    }

    const documents: Array<{
      index: number;
      title: string;
      timestamp: string;
      id: string;
    }> = [];

    gridItems.forEach((item, i) => {
      if (i >= limit) return;

      const title = item.querySelector('.docs-homescreen-grid-item-title');
      const time = item.querySelector('.docs-homescreen-grid-item-time');
      const sortId = item.querySelector(
        '.docs-homescreen-grid-item-sort-identifier'
      );
      const itemId = item.getAttribute('id') || '';

      const sortIdText = sortId?.textContent?.trim() || '';
      const timeText = time?.textContent?.trim() || '';
      const timestamp =
        sortIdText && timeText
          ? `${sortIdText} ${timeText}`
          : sortIdText || timeText;

      documents.push({
        index: i,
        title: title?.textContent?.trim() || 'Untitled',
        timestamp,
        id: itemId
      });
    });

    const summary = documents
      .map(
        (doc, i) => `${i + 1}. "${doc.title}" - ${doc.timestamp || 'No date'}`
      )
      .join('\n');

    return {
      content: [
        {
          type: 'text' as const,
          text: `Found ${documents.length} recent documents:\n${summary}`
        }
      ],
      structuredContent: {documents, total: documents.length}
    };
  }
};
