import type {ToolDefinition} from 'webmcp-polyfill';

export const tool: ToolDefinition = {
  name: 'google_sheets_write_cell',
  description:
    'Write a value to a specific cell in the currently open Google Sheets spreadsheet.',
  inputSchema: {
    type: 'object',
    properties: {
      cell: {
        type: 'string',
        description: 'Cell reference in A1 notation (e.g., "A1", "B5", "AA100")'
      },
      value: {
        type: 'string',
        description:
          'The value to write to the cell. Can be text, numbers, or formulas (start with =).'
      }
    },
    required: ['cell', 'value']
  },
  async execute(input) {
    const {cell, value} = input as {cell: string; value: string};

    const nameBox = document.querySelector<HTMLInputElement>('#t-name-box');
    const formulaBar = document.querySelector<HTMLElement>(
      '#t-formula-bar-input'
    );

    if (!nameBox || !formulaBar) {
      return {
        content: [
          {
            type: 'text',
            text: 'Spreadsheet editor elements not found. Make sure you have a spreadsheet open.'
          }
        ],
        isError: true
      };
    }

    // Validate cell reference
    const cellRef = cell.toUpperCase();
    if (!/^[A-Z]+\d+$/.test(cellRef)) {
      return {
        content: [
          {
            type: 'text',
            text: `Invalid cell reference: ${cell}. Use A1 notation (e.g., "A1", "B5").`
          }
        ],
        isError: true
      };
    }

    // Navigate to the cell
    nameBox.focus();
    nameBox.value = cellRef;
    nameBox.dispatchEvent(new Event('input', {bubbles: true}));
    nameBox.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'Enter',
        code: 'Enter',
        keyCode: 13,
        which: 13,
        bubbles: true
      })
    );

    // Wait for navigation
    await new Promise((r) => setTimeout(r, 100));

    // Focus the formula bar and enter the value
    formulaBar.focus();
    formulaBar.textContent = value;
    formulaBar.dispatchEvent(new Event('input', {bubbles: true}));

    // Press Enter to confirm
    formulaBar.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'Enter',
        code: 'Enter',
        keyCode: 13,
        which: 13,
        bubbles: true
      })
    );

    // Wait for the value to be committed
    await new Promise((r) => setTimeout(r, 100));

    return {
      content: [{type: 'text', text: `Wrote "${value}" to cell ${cellRef}`}],
      structuredContent: {cell: cellRef, value}
    };
  }
};
