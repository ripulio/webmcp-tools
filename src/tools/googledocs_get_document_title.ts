export const tool = {
  name: 'googledocs_get_document_title',
  description: 'Get the title of the currently open Google Docs document',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  },
  async execute() {
    const titleInput =
      document.querySelector<HTMLInputElement>('.docs-title-input');
    if (!titleInput) {
      return {
        content: [
          {
            type: 'text' as const,
            text: 'Document title not found. Make sure you have a document open in Google Docs.'
          }
        ],
        isError: true
      };
    }

    const title =
      titleInput.value || titleInput.textContent || 'Untitled document';

    return {
      content: [{type: 'text' as const, text: `Document title: "${title}"`}],
      structuredContent: {title}
    };
  }
};
