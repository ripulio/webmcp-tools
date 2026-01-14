import type {ToolDefinition} from 'webmcp-polyfill';

export const tool: ToolDefinition = {
  name: 'google_sheets_read_cells',
  description:
    'Read cell contents from the currently open Google Sheets spreadsheet. Can read a single cell or a range of cells.',
  inputSchema: {
    type: 'object',
    properties: {
      cell: {
        type: 'string',
        description:
          'Single cell reference (e.g., "A1", "B5"). Use this OR range, not both.'
      },
      range: {
        type: 'string',
        description:
          'Cell range in A1 notation (e.g., "A1:C10", "B2:D5"). Use this OR cell, not both.'
      }
    },
    required: []
  },
  async execute(input) {
    const {cell, range} = input as {cell?: string; range?: string};

    if (!cell && !range) {
      return {
        content: [
          {type: 'text', text: 'Either cell or range must be provided.'}
        ],
        isError: true
      };
    }

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

    // Helper to navigate to a cell and get its content
    const readCell = async (cellRef: string): Promise<string> => {
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
      await new Promise((r) => setTimeout(r, 50));
      return formulaBar.textContent || '';
    };

    // Parse column letter to number (A=0, B=1, etc.)
    const colToNum = (col: string): number => {
      let num = 0;
      for (let i = 0; i < col.length; i++) {
        num = num * 26 + (col.charCodeAt(i) - 64);
      }
      return num - 1;
    };

    // Parse number to column letter
    const numToCol = (num: number): string => {
      let col = '';
      num++;
      while (num > 0) {
        const mod = (num - 1) % 26;
        col = String.fromCharCode(65 + mod) + col;
        num = Math.floor((num - 1) / 26);
      }
      return col;
    };

    // Parse cell reference (e.g., "AB123" -> { col: "AB", row: 123 })
    const parseCell = (ref: string): {col: string; row: number} | null => {
      const match = ref.toUpperCase().match(/^([A-Z]+)(\d+)$/);
      if (!match) return null;
      return {col: match[1], row: parseInt(match[2], 10)};
    };

    if (cell) {
      // Validate single cell reference
      if (!parseCell(cell)) {
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
      // Single cell read
      const content = await readCell(cell.toUpperCase());
      return {
        content: [
          {type: 'text', text: `${cell.toUpperCase()}: ${content || '(empty)'}`}
        ],
        structuredContent: {cell: cell.toUpperCase(), content}
      };
    }

    // Range read - at this point we know range is defined since we checked !cell && !range above
    const rangeValue = range as string;
    const rangeParts = rangeValue.toUpperCase().split(':');
    if (rangeParts.length !== 2) {
      return {
        content: [
          {type: 'text', text: 'Invalid range format. Use A1:B5 notation.'}
        ],
        isError: true
      };
    }

    const start = parseCell(rangeParts[0]);
    const end = parseCell(rangeParts[1]);

    if (!start || !end) {
      return {
        content: [
          {
            type: 'text',
            text: `Invalid range: ${rangeValue}. Use A1:B5 notation.`
          }
        ],
        isError: true
      };
    }

    const startColNum = colToNum(start.col);
    const endColNum = colToNum(end.col);
    const startRow = start.row;
    const endRow = end.row;

    const data: Array<Array<{cell: string; content: string}>> = [];

    for (let row = startRow; row <= endRow; row++) {
      const rowData: Array<{cell: string; content: string}> = [];
      for (let colNum = startColNum; colNum <= endColNum; colNum++) {
        const col = numToCol(colNum);
        const cellRef = `${col}${row}`;
        const content = await readCell(cellRef);
        rowData.push({cell: cellRef, content});
      }
      data.push(rowData);
    }

    // Format as text table
    const rangeUpper = rangeValue.toUpperCase();
    const textLines = data.map((row) =>
      row.map((c) => `${c.cell}: ${c.content || '(empty)'}`).join(' | ')
    );

    return {
      content: [
        {
          type: 'text',
          text: `Range ${rangeUpper}:\n${textLines.join('\n')}`
        }
      ],
      structuredContent: {range: rangeUpper, data}
    };
  }
};
