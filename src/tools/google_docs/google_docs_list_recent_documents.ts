import type {ToolDefinition} from 'webmcp-polyfill';

export const tool: ToolDefinition = {
  name: 'google_docs_list_recent_documents',
  description:
    'Get a list of recently accessed documents from the Google Docs home page. Returns document titles and last modified times.',
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
  async execute(input) {
    const {limit = 10} = input as {limit?: number};

    const gridItems = document.querySelectorAll('.docs-homescreen-grid-item');
    if (gridItems.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: 'No documents found. Make sure you are on the Google Docs home page.'
          }
        ],
        isError: true
      };
    }

    const documents: Array<{
      index: number;
      title: string;
      lastModified: string;
      isShared: boolean;
    }> = [];

    gridItems.forEach((item, index) => {
      if (index >= limit) return;

      const titleEl = item.querySelector('.docs-homescreen-grid-item-title');
      const timeEl = item.querySelector('.docs-homescreen-grid-item-time');
      const isShared = item.classList.contains('docs-homescreen-item-shared');

      documents.push({
        index: index + 1,
        title: titleEl?.textContent?.trim() || 'Untitled',
        lastModified: timeEl?.textContent?.trim() || 'Unknown',
        isShared
      });
    });

    const summary = documents
      .map(
        (doc) =>
          `${doc.index}. ${doc.title} (${doc.lastModified})${doc.isShared ? ' [Shared]' : ''}`
      )
      .join('\n');

    return {
      content: [
        {
          type: 'text',
          text: `Found ${documents.length} recent documents:\n\n${summary}`
        }
      ],
      structuredContent: {documents}
    };
  }
};
