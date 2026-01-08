import type {ToolDefinition} from 'webmcp-polyfill';

export const tool: ToolDefinition = {
  name: 'google_docs_open_document',
  description:
    'Open a document by clicking on it in the document list. Use google_docs_list_recent_documents first to see available documents.',
  inputSchema: {
    type: 'object',
    properties: {
      index: {
        type: 'number',
        description: 'The 1-based index of the document to open from the list'
      }
    },
    required: ['index']
  },
  async execute(input) {
    const {index} = input as {index: number};

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

    const itemIndex = index - 1;
    if (itemIndex < 0 || itemIndex >= gridItems.length) {
      return {
        content: [
          {
            type: 'text',
            text: `Invalid index ${index}. Please provide a number between 1 and ${gridItems.length}.`
          }
        ],
        isError: true
      };
    }

    const targetItem = gridItems[itemIndex] as HTMLElement;
    const titleEl = targetItem.querySelector(
      '.docs-homescreen-grid-item-title'
    );
    const title = titleEl?.textContent?.trim() || 'Untitled';

    // Double-click to open the document
    targetItem.dispatchEvent(
      new MouseEvent('dblclick', {
        bubbles: true,
        cancelable: true,
        view: window
      })
    );

    return {
      content: [{type: 'text', text: `Opening document: "${title}"`}]
    };
  }
};
