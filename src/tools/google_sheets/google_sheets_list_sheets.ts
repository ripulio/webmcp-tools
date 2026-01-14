import type {ToolDefinition} from 'webmcp-polyfill';

export const tool: ToolDefinition = {
  name: 'google_sheets_list_sheets',
  description:
    'List all sheets (tabs) in the currently open Google Sheets spreadsheet.',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  },
  async execute() {
    const sheetTabs = document.querySelectorAll('.docs-sheet-tab');

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

    const sheets: Array<{
      index: number;
      name: string;
      isActive: boolean;
    }> = [];

    sheetTabs.forEach((tab, i) => {
      const name =
        tab.querySelector('.docs-sheet-tab-name')?.textContent?.trim() ||
        `Sheet${i + 1}`;
      const isActive = tab.classList.contains('docs-sheet-active-tab');
      sheets.push({index: i, name, isActive});
    });

    const text = sheets
      .map((s) => `[${s.index}] ${s.name}${s.isActive ? ' (active)' : ''}`)
      .join('\n');

    return {
      content: [
        {type: 'text', text: `Found ${sheets.length} sheet(s):\n\n${text}`}
      ],
      structuredContent: {sheets}
    };
  }
};
