import type {ToolDefinition} from 'webmcp-polyfill';

interface CellWrite {
  cell: string;
  value: string;
}

interface WriteResult {
  cell: string;
  value: string;
  error?: string;
}

export const tool: ToolDefinition = {
  name: 'google_sheets_write_cells',
  description:
    'Write values to cells in the currently open Google Sheets spreadsheet. Accepts a batch of cell writes.',
  inputSchema: {
    type: 'object',
    properties: {
      writes: {
        type: 'array',
        description: 'Array of cell writes to perform',
        items: {
          type: 'object',
          properties: {
            cell: {
              type: 'string',
              description: 'Cell reference in A1 notation (e.g., "A1", "B5")'
            },
            value: {
              type: 'string',
              description:
                'Value to write (text, numbers, or formulas starting with =)'
            }
          },
          required: ['cell', 'value']
        },
        minItems: 1
      }
    },
    required: ['writes']
  },
  async execute(input) {
    const {writes} = input as {writes: CellWrite[]};

    const nameBox = document.querySelector<HTMLInputElement>('#t-name-box');
    const formulaBarInput = document.querySelector<HTMLElement>(
      '#t-formula-bar-input .cell-input'
    );

    if (!nameBox || !formulaBarInput) {
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

    const writeCell = async (
      cellRef: string,
      value: string
    ): Promise<string | null> => {
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

      await new Promise((r) => setTimeout(r, 50));

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

      await new Promise((r) => setTimeout(r, 50));

      return null; // Success
    };

    const successful: WriteResult[] = [];
    const failed: WriteResult[] = [];

    for (const write of writes) {
      const cellRef = write.cell.toUpperCase();

      // Validate cell reference
      if (!/^[A-Z]+\d+$/.test(cellRef)) {
        failed.push({
          cell: write.cell,
          value: write.value,
          error: `Invalid cell reference: ${write.cell}. Use A1 notation.`
        });
        continue;
      }

      const error = await writeCell(cellRef, write.value);
      if (error) {
        failed.push({cell: cellRef, value: write.value, error});
      } else {
        successful.push({cell: cellRef, value: write.value});
      }
    }

    const successCount = successful.length;
    const failCount = failed.length;

    let text: string;
    if (failCount === 0) {
      text = `Wrote ${successCount} cell${successCount === 1 ? '' : 's'} successfully`;
    } else {
      text = `Wrote ${successCount} cell${successCount === 1 ? '' : 's'} successfully, ${failCount} failed`;
    }

    return {
      content: [{type: 'text', text}],
      structuredContent: {successful, failed},
      isError: failCount > 0 && successCount === 0
    };
  }
};
