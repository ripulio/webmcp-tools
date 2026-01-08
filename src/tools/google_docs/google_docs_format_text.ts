import type {ToolDefinition} from 'webmcp-polyfill';

export const tool: ToolDefinition = {
  name: 'google_docs_format_text',
  description:
    'Apply text formatting to the current selection in Google Docs. Supports bold, italic, and underline.',
  inputSchema: {
    type: 'object',
    properties: {
      format: {
        type: 'string',
        description: 'The format to apply: "bold", "italic", or "underline"',
        enum: ['bold', 'italic', 'underline']
      }
    },
    required: ['format']
  },
  async execute(input) {
    const {format} = input as {format: 'bold' | 'italic' | 'underline'};

    const buttonIds: Record<string, string> = {
      bold: '#boldButton',
      italic: '#italicButton',
      underline: '#underlineButton'
    };

    const button = document.querySelector<HTMLElement>(buttonIds[format]);
    if (!button) {
      return {
        content: [
          {
            type: 'text',
            text: `${format} button not found. Make sure you are in the Google Docs editor.`
          }
        ],
        isError: true
      };
    }

    button.click();

    const isActive = button.classList.contains('goog-toolbar-button-checked');
    const formatLabel = format.charAt(0).toUpperCase() + format.slice(1);

    return {
      content: [
        {
          type: 'text',
          text: `${formatLabel} formatting ${isActive ? 'applied' : 'toggled'}`
        }
      ]
    };
  }
};
