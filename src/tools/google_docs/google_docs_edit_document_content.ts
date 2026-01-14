import type {ToolDefinition} from 'webmcp-polyfill';

export const tool: ToolDefinition = {
  name: 'google_docs_edit_document_content',
  description:
    'Add or modify text content in the document. Types text at the current cursor position. Use keyboard shortcuts like Enter for new lines.',
  inputSchema: {
    type: 'object',
    properties: {
      text: {
        type: 'string',
        description: 'The text to type into the document'
      },
      pressEnterBefore: {
        type: 'boolean',
        description: 'Press Enter before typing to start on a new line'
      },
      pressEnterAfter: {
        type: 'boolean',
        description: 'Press Enter after typing to end with a new line'
      }
    },
    required: ['text']
  },
  async execute(input) {
    const {
      text,
      pressEnterBefore = false,
      pressEnterAfter = false
    } = input as {
      text: string;
      pressEnterBefore?: boolean;
      pressEnterAfter?: boolean;
    };

    // Find the text input iframe
    const textIframe = document.querySelector(
      '.docs-texteventtarget-iframe'
    ) as HTMLIFrameElement | null;
    if (!textIframe) {
      return {
        content: [
          {
            type: 'text',
            text: 'Document editor not found. Make sure you are in the Google Docs editor.'
          }
        ],
        isError: true
      };
    }

    const iframeDoc =
      textIframe.contentDocument || textIframe.contentWindow?.document;
    if (!iframeDoc) {
      return {
        content: [
          {
            type: 'text',
            text: 'Cannot access document editor.'
          }
        ],
        isError: true
      };
    }

    const editableDiv = iframeDoc.querySelector(
      '[contenteditable="true"]'
    ) as HTMLElement | null;
    if (!editableDiv) {
      return {
        content: [
          {
            type: 'text',
            text: 'Editable content area not found.'
          }
        ],
        isError: true
      };
    }

    // Focus the editable area
    editableDiv.focus();

    // Helper to dispatch Enter key
    const dispatchEnter = () => {
      editableDiv.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'Enter',
          code: 'Enter',
          keyCode: 13,
          which: 13,
          bubbles: true,
          cancelable: true
        })
      );
    };

    // Press Enter before if requested
    if (pressEnterBefore) {
      dispatchEnter();
    }

    // Type text using beforeinput events (works with Google Docs canvas rendering)
    for (const char of text) {
      if (char === '\n') {
        dispatchEnter();
      } else {
        editableDiv.dispatchEvent(
          new InputEvent('beforeinput', {
            data: char,
            inputType: 'insertText',
            bubbles: true,
            cancelable: true,
            composed: true
          })
        );
      }
    }

    // Press Enter after if requested
    if (pressEnterAfter) {
      dispatchEnter();
    }

    return {
      content: [
        {
          type: 'text',
          text: `Typed ${text.length} character(s) into the document.`
        }
      ]
    };
  }
};
