export const tool = {
  name: 'googledocs_open_document',
  description:
    'Open a document from the recent documents list by index (0-based)',
  inputSchema: {
    type: 'object',
    properties: {
      index: {
        type: 'number',
        description:
          'Index of the document to open (0-based, from get_recent_documents)'
      }
    },
    required: ['index']
  },
  async execute(rawInput: {index?: number}) {
    const {index} = rawInput || {};

    if (index === undefined || index < 0) {
      return {
        content: [
          {
            type: 'text' as const,
            text: 'Valid document index is required (0 or greater)'
          }
        ],
        isError: true
      };
    }

    const gridItems = document.querySelectorAll('.docs-homescreen-grid-item');
    if (gridItems.length === 0) {
      return {
        content: [
          {
            type: 'text' as const,
            text: 'No documents found. Make sure you are on the Google Docs homepage.'
          }
        ],
        isError: true
      };
    }

    if (index >= gridItems.length) {
      return {
        content: [
          {
            type: 'text' as const,
            text: `Document index ${index} is out of range. Only ${gridItems.length} documents available.`
          }
        ],
        isError: true
      };
    }

    const targetItem = gridItems[index] as HTMLElement;
    const title =
      targetItem
        .querySelector('.docs-homescreen-grid-item-title')
        ?.textContent?.trim() || 'Untitled';

    // Double-click to open the document
    targetItem.dispatchEvent(
      new MouseEvent('dblclick', {bubbles: true, cancelable: true})
    );

    return {
      content: [
        {type: 'text' as const, text: `Opening document "${title}"...`}
      ],
      structuredContent: {action: 'open_document', index, title}
    };
  }
};
