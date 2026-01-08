import type {ToolDefinition} from 'webmcp-polyfill';

export const tool: ToolDefinition = {
  name: 'google_docs_open_comments_panel',
  description: 'Open the comments panel to view all comments in the document.',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  },
  async execute() {
    const commentsButton = document.querySelector<HTMLElement>(
      '#docs-docos-commentsbutton'
    );
    if (!commentsButton) {
      return {
        content: [
          {
            type: 'text',
            text: 'Comments button not found. Make sure you are in the Google Docs editor.'
          }
        ],
        isError: true
      };
    }

    // Get the comment count from the button text
    const commentCount = commentsButton.textContent?.trim() || '0';

    commentsButton.click();

    return {
      content: [
        {
          type: 'text',
          text: `Comments panel opened. Document has ${commentCount} comment(s).`
        }
      ],
      structuredContent: {commentCount: parseInt(commentCount, 10) || 0}
    };
  }
};
