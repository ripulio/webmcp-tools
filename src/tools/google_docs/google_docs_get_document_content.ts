import type {ToolDefinition} from 'webmcp-polyfill';

export const tool: ToolDefinition = {
  name: 'google_docs_get_document_content',
  description:
    'Attempt to retrieve text content from the current Google Docs document. Note: Due to canvas rendering, this may not work reliably. Consider using the Google Docs API for programmatic content access.',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  },
  async execute() {
    // Try multiple approaches to get document content

    // Approach 1: Look for the kix-page elements which contain actual text in spans
    const pages = document.querySelectorAll('.kix-page');
    if (pages.length > 0) {
      const textContent: string[] = [];
      pages.forEach((page) => {
        // Get text from line views
        const lines = page.querySelectorAll('.kix-lineview');
        lines.forEach((line) => {
          const lineText = line.textContent || '';
          textContent.push(lineText);
        });
      });

      const content = textContent.join('\n').trim();
      if (content) {
        return {
          content: [
            {
              type: 'text',
              text: `Document content (${content.length} characters):\n\n${content}`
            }
          ],
          structuredContent: {
            content,
            length: content.length
          }
        };
      }
    }

    // Approach 2: Look for paragraph containers
    const paragraphs = document.querySelectorAll('.kix-paragraphrenderer');
    if (paragraphs.length > 0) {
      const textContent: string[] = [];
      paragraphs.forEach((para) => {
        const paraText = para.textContent || '';
        if (paraText.trim()) {
          textContent.push(paraText);
        }
      });

      const content = textContent.join('\n').trim();
      if (content) {
        return {
          content: [
            {
              type: 'text',
              text: `Document content (${content.length} characters):\n\n${content}`
            }
          ],
          structuredContent: {
            content,
            length: content.length
          }
        };
      }
    }

    // Approach 3: Try the docs-editor container
    const editor = document.querySelector('.docs-editor');
    if (editor) {
      const content = editor.textContent?.trim() || '';
      if (content) {
        return {
          content: [
            {
              type: 'text',
              text: `Document content (${content.length} characters):\n\n${content}`
            }
          ],
          structuredContent: {
            content,
            length: content.length
          }
        };
      }
    }

    return {
      content: [
        {
          type: 'text',
          text: 'Unable to extract document content. The document may be empty or Google Docs is using a rendering method that prevents text extraction. Consider using the Google Docs API for programmatic access.'
        }
      ],
      isError: true
    };
  }
};
