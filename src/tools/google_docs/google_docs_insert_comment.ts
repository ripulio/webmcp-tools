import type {ToolDefinition} from 'webmcp-polyfill';

export const tool: ToolDefinition = {
  name: 'google_docs_insert_comment',
  description:
    'Add a comment to the current selection in Google Docs. Select text first, then use this tool to open the comment dialog.',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  },
  async execute() {
    const insertCommentButton = document.querySelector<HTMLElement>(
      '#insertCommentButton'
    );
    if (!insertCommentButton) {
      return {
        content: [
          {
            type: 'text',
            text: 'Insert comment button not found. Make sure you are in the Google Docs editor.'
          }
        ],
        isError: true
      };
    }

    const isDisabled = insertCommentButton.classList.contains(
      'goog-toolbar-button-disabled'
    );
    if (isDisabled) {
      return {
        content: [
          {
            type: 'text',
            text: 'Cannot add comment. Please select some text first.'
          }
        ],
        isError: true
      };
    }

    insertCommentButton.click();

    return {
      content: [
        {type: 'text', text: 'Comment dialog opened. Type your comment.'}
      ]
    };
  }
};
