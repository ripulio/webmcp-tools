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
    // Google Docs uses canvas rendering, so text is not directly accessible from the DOM.
    // We use keyboard shortcuts to select all and copy, then read from clipboard.

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

    // Detect platform for correct modifier key
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;

    // Send Cmd/Ctrl+A to select all
    editableDiv.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'a',
        code: 'KeyA',
        keyCode: 65,
        metaKey: isMac,
        ctrlKey: !isMac,
        bubbles: true,
        cancelable: true
      })
    );

    // Small delay for selection to complete
    await new Promise((r) => setTimeout(r, 100));

    // Send Cmd/Ctrl+C to copy
    editableDiv.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'c',
        code: 'KeyC',
        keyCode: 67,
        metaKey: isMac,
        ctrlKey: !isMac,
        bubbles: true,
        cancelable: true
      })
    );

    // Small delay for copy to complete
    await new Promise((r) => setTimeout(r, 100));

    // Click to deselect (move cursor to end)
    editableDiv.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'ArrowRight',
        code: 'ArrowRight',
        keyCode: 39,
        bubbles: true,
        cancelable: true
      })
    );

    // Try to read from clipboard
    try {
      const content = await navigator.clipboard.readText();
      if (content && content.trim()) {
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
    } catch {
      // Clipboard access denied - this is expected in some contexts
    }

    return {
      content: [
        {
          type: 'text',
          text: 'Unable to extract document content. Google Docs uses canvas rendering which prevents direct text extraction. The content has been copied to your clipboard - you can paste it elsewhere. For programmatic access, consider using the Google Docs API.'
        }
      ],
      isError: true
    };
  }
};
