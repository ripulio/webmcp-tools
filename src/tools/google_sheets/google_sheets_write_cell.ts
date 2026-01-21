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

    if (!nameBox) {
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

    // Navigate to the cell using character-by-character input
    nameBox.focus();
    nameBox.select();
    nameBox.value = '';
    for (const char of cellRef) {
      nameBox.value += char;
      nameBox.dispatchEvent(
        new InputEvent('input', {
          bubbles: true,
          cancelable: true,
          inputType: 'insertText',
          data: char
        })
      );
    }
    nameBox.click();
    nameBox.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'Enter',
        code: 'Enter',
        keyCode: 13,
        which: 13,
        bubbles: true
      })
    );

    // Write using ClipboardEvent paste to the formula bar's cell-input
    const formulaBarInput = document.querySelector<HTMLElement>(
      '#t-formula-bar-input .cell-input'
    );
    if (!formulaBarInput) {
      return {
        content: [{type: 'text', text: 'Formula bar input not found.'}],
        isError: true
      };
    }

    formulaBarInput.focus();

    // Clear existing content and paste new value
    document.execCommand('selectAll', false, undefined);
    const pasteData = new DataTransfer();
    pasteData.setData('text/plain', value);
    formulaBarInput.dispatchEvent(
      new ClipboardEvent('paste', {
        bubbles: true,
        cancelable: true,
        clipboardData: pasteData
      })
    );

    // Blur to commit
    formulaBarInput.blur();

    return {
      content: [{type: 'text', text: `Wrote "${value}" to cell ${cellRef}`}],
      structuredContent: {cell: cellRef, value}
    };
  }
};
