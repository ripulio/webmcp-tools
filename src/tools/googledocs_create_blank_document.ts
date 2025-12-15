export const tool = {
  name: 'googledocs_create_blank_document',
  description: 'Create a new blank document in Google Docs',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  },
  async execute() {
    // Find the blank document template (first template in the showcase)
    const templates = document.querySelectorAll(
      '.docs-homescreen-templates-templateview'
    );
    let blankTemplate: Element | null = null;

    for (const template of templates) {
      const title = template.querySelector(
        '.docs-homescreen-templates-templateview-title'
      );
      if (title?.textContent?.trim() === 'Blank document') {
        blankTemplate = template;
        break;
      }
    }

    if (!blankTemplate) {
      return {
        content: [
          {
            type: 'text' as const,
            text: 'Blank document template not found. Make sure you are on the Google Docs homepage.'
          }
        ],
        isError: true
      };
    }

    // Click the blank template to create a new document
    (blankTemplate as HTMLElement).click();

    return {
      content: [
        {type: 'text' as const, text: 'Creating new blank document...'}
      ],
      structuredContent: {action: 'create_blank_document'}
    };
  }
};
