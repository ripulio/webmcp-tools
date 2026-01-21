import type {ToolDefinition} from 'webmcp-polyfill';

export const tool: ToolDefinition = {
  name: 'google_sheets_switch_sheet',
  description:
    'Switch to a different sheet (tab) in the currently open Google Sheets spreadsheet by index or name.',
  inputSchema: {
    type: 'object',
    properties: {
      index: {
        type: 'number',
        description:
          'The index of the sheet to switch to (from list_sheets). Use this OR name.'
      },
      name: {
        type: 'string',
        description:
          'The name of the sheet to switch to (partial match supported). Use this OR index.'
      }
    },
    required: []
  },
  async execute(input) {
    const {index, name} = input as {index?: number; name?: string};

    if (index === undefined && !name) {
      return {
        content: [
          {type: 'text', text: 'Either index or name must be provided.'}
        ],
        isError: true
      };
    }

    const sheetTabs = document.querySelectorAll<HTMLElement>('.docs-sheet-tab');

    if (sheetTabs.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: 'No sheet tabs found. Make sure you have a spreadsheet open.'
          }
        ],
        isError: true
      };
    }

    let targetTab: HTMLElement | null = null;
    let targetName = '';

    if (index !== undefined) {
      if (index < 0 || index >= sheetTabs.length) {
        return {
          content: [
            {
              type: 'text',
              text: `Invalid index ${index}. Valid range is 0-${sheetTabs.length - 1}.`
            }
          ],
          isError: true
        };
      }
      targetTab = sheetTabs[index];
      targetName =
        targetTab.querySelector('.docs-sheet-tab-name')?.textContent?.trim() ||
        `Sheet${index + 1}`;
    } else if (name) {
      const lowerName = name.toLowerCase();
      for (const tab of sheetTabs) {
        const tabName =
          tab.querySelector('.docs-sheet-tab-name')?.textContent?.trim() || '';
        if (tabName.toLowerCase().includes(lowerName)) {
          targetTab = tab;
          targetName = tabName;
          break;
        }
      }
      if (!targetTab) {
        return {
          content: [{type: 'text', text: `No sheet found matching "${name}".`}],
          isError: true
        };
      }
    }

    if (!targetTab) {
      return {
        content: [
          {type: 'text', text: 'Could not find the sheet to switch to.'}
        ],
        isError: true
      };
    }

    // Dispatch mousedown event (Google Sheets uses mousedown, not click)
    const mousedownEvent = new MouseEvent('mousedown', {
      bubbles: true,
      cancelable: true,
      view: window,
      button: 0
    });
    targetTab.dispatchEvent(mousedownEvent);

    return {
      content: [{type: 'text', text: `Switched to sheet: "${targetName}"`}],
      structuredContent: {sheetName: targetName}
    };
  }
};
