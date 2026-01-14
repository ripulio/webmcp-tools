import type {ToolDefinition} from 'webmcp-polyfill';

export const tool: ToolDefinition = {
  name: 'google_docs_toggle_editing_mode',
  description:
    'Switch between Editing, Suggesting, and Viewing modes in Google Docs. Opens the mode switcher dropdown.',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  },
  async execute() {
    const modeSwitcher = document.querySelector<HTMLElement>(
      '#docs-toolbar-mode-switcher'
    );
    if (!modeSwitcher) {
      return {
        content: [
          {
            type: 'text',
            text: 'Mode switcher not found. Make sure you are in the Google Docs editor.'
          }
        ],
        isError: true
      };
    }

    // Get current mode from text content
    const currentMode = modeSwitcher.textContent?.trim() || 'Unknown';

    modeSwitcher.click();

    return {
      content: [
        {
          type: 'text',
          text: `Mode switcher opened. Current mode: "${currentMode}". Select a mode from the dropdown.`
        }
      ],
      structuredContent: {currentMode}
    };
  }
};
