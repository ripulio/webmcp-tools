import type {ToolDefinition} from 'webmcp-polyfill';

export const tool: ToolDefinition = {
  name: 'google_docs_create_blank_document',
  description:
    'Start a new blank document in Google Docs. This will navigate to a new document editor.',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  },
  async execute() {
    // Find the blank document template in the template gallery
    const blankTemplate = Array.from(
      document.querySelectorAll('.docs-homescreen-templates-templateview')
    ).find((el) => el.textContent?.includes('Blank'));

    if (!blankTemplate) {
      return {
        content: [
          {
            type: 'text',
            text: 'Blank document template not found. Make sure you are on the Google Docs home page with the template gallery visible.'
          }
        ],
        isError: true
      };
    }

    (blankTemplate as HTMLElement).click();
    return {
      content: [{type: 'text', text: 'Creating new blank document...'}]
    };
  }
};
