export const tool = {
  name: 'googledocs_get_document_content',
  description:
    'Get the text content of the currently open Google Docs document',
  inputSchema: {
    type: 'object',
    properties: {
      maxLength: {
        type: 'number',
        description: 'Maximum number of characters to return (default: 5000)'
      }
    },
    required: []
  },
  async execute(rawInput: {maxLength?: number}) {
    const {maxLength = 5000} = rawInput || {};

    // Google Docs uses complex canvas rendering, so we extract content from the accessibility layer
    const bodyText = document.body.innerText;

    // Find the document content by looking for the screen reader marker
    const contentStart = bodyText.indexOf('Screen reader support enabled.');
    if (contentStart === -1) {
      return {
        content: [
          {
            type: 'text' as const,
            text: 'Document content not found. Make sure you have a document open in Google Docs.'
          }
        ],
        isError: true
      };
    }

    const afterSr = bodyText.substring(
      contentStart + 'Screen reader support enabled.'.length
    );

    // Skip the tab info and page number
    const pageMarker = afterSr.indexOf('On page');
    if (pageMarker === -1) {
      return {
        content: [
          {type: 'text' as const, text: 'Could not parse document content.'}
        ],
        isError: true
      };
    }

    const pageInfo = afterSr.substring(pageMarker);
    const periodIndex = pageInfo.indexOf('.');
    let textContent = pageInfo.substring(periodIndex + 1).trim();

    const totalLength = textContent.length;
    const truncated = textContent.length > maxLength;
    if (truncated) {
      textContent = textContent.substring(0, maxLength) + '...';
    }

    return {
      content: [
        {
          type: 'text' as const,
          text: textContent || 'Document appears to be empty'
        }
      ],
      structuredContent: {
        content: textContent,
        truncated,
        totalLength
      }
    };
  }
};
