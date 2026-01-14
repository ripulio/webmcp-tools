import type {ToolDefinition} from 'webmcp-polyfill';

interface ModelChunkItem {
  ty: string;
  s?: string;
  [key: string]: unknown;
}

interface ModelChunk {
  chunk: ModelChunkItem[];
}

export const tool: ToolDefinition = {
  name: 'google_docs_get_document_content',
  description:
    'Retrieve text content from the current Google Docs document by parsing the internal model data.',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  },
  async execute() {
    // Google Docs stores document content in a DOCS_modelChunk variable within a script tag.
    // The content is in items with ty='is' (inline string) in the 's' field.

    const scripts = document.querySelectorAll('script');

    for (const script of scripts) {
      const text = script.textContent || '';

      // Find the script containing the model chunk data
      if (!text.includes('DOCS_modelChunk = {"chunk"')) {
        continue;
      }

      // Find the start of the JSON object
      const startMarker = 'DOCS_modelChunk = ';
      const startIdx = text.indexOf(startMarker) + startMarker.length;

      // Parse JSON by finding matching closing brace
      let braceCount = 0;
      let endIdx = startIdx;
      let inString = false;
      let escapeNext = false;

      for (let i = startIdx; i < text.length; i++) {
        const char = text[i];

        if (escapeNext) {
          escapeNext = false;
          continue;
        }

        if (char === '\\') {
          escapeNext = true;
          continue;
        }

        if (char === '"') {
          inString = !inString;
          continue;
        }

        if (!inString) {
          if (char === '{') braceCount++;
          if (char === '}') {
            braceCount--;
            if (braceCount === 0) {
              endIdx = i + 1;
              break;
            }
          }
        }
      }

      const jsonStr = text.substring(startIdx, endIdx);

      try {
        const data = JSON.parse(jsonStr) as ModelChunk;
        const textParts = data.chunk
          .filter((c) => c.ty === 'is' && c.s)
          .map((c) => c.s as string);

        const content = textParts.join('');

        if (!content.trim()) {
          return {
            content: [
              {
                type: 'text',
                text: 'Document appears to be empty.'
              }
            ],
            structuredContent: {
              content: '',
              length: 0
            }
          };
        }

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
      } catch {
        return {
          content: [
            {
              type: 'text',
              text: 'Failed to parse document model data.'
            }
          ],
          isError: true
        };
      }
    }

    return {
      content: [
        {
          type: 'text',
          text: 'Unable to extract document content. The document model data was not found. Make sure you are viewing a Google Docs document.'
        }
      ],
      isError: true
    };
  }
};
