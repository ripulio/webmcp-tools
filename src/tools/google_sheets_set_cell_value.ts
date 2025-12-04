import {ToolDefinition} from 'webmcp-polyfill';

/**
 * Converts a 1-based column number to Excel-style letter notation (A, B, ..., Z, AA, AB, ...).
 * @param col - The 1-based column number.
 * @returns The column letter(s) (e.g., 1 -> "A", 27 -> "AA").
 * @throws If col is not a positive integer.
 */
function columnNumberToLetters(col: number): string {
  if (!Number.isInteger(col) || col < 1) {
    throw new Error('Column must be a positive integer.');
  }

  let n = col;
  let letters = '';
  while (n > 0) {
    const rem = (n - 1) % 26;
    letters = String.fromCharCode(65 + rem) + letters;
    n = Math.floor((n - 1) / 26);
  }
  return letters;
}

/**
 * Resolves a cell reference from either A1 notation or row/col coordinates.
 * If `cell` is provided and non-empty, it is returned as-is.
 * Otherwise, converts numeric row/col to A1 notation.
 * @param input - Object with optional cell string or row/col numbers.
 * @returns The cell reference in A1 notation (e.g., "A1", "C5").
 * @throws If neither a valid cell nor valid row/col coordinates are provided.
 */
function resolveCellReference(input: {
  cell?: string;
  row?: number;
  col?: number;
}): string {
  const trimmed = (input.cell || '').trim();
  if (trimmed) {
    return trimmed;
  }

  if (
    Number.isInteger(input.row) &&
    Number.isInteger(input.col) &&
    (input.row as number) > 0 &&
    (input.col as number) > 0
  ) {
    return columnNumberToLetters(input.col as number) + String(input.row);
  }

  throw new Error(
    'Provide either "cell" in A1 notation or both positive "row" and "col" numbers.'
  );
}

/**
 * Dispatches keyboard events simulating an Enter key press to commit input.
 * Sends keydown, keypress, and keyup events with the Enter key code.
 * @param target - The HTML element to receive the keyboard events.
 */
function commitEnter(target: HTMLElement) {
  ['keydown', 'keypress', 'keyup'].forEach((type) => {
    target.dispatchEvent(
      new KeyboardEvent(type, {
        key: 'Enter',
        code: 'Enter',
        keyCode: 13,
        which: 13,
        bubbles: true
      })
    );
  });
}

/**
 * Locates the Google Sheets Name Box input element used for cell navigation.
 * Tries the known ID first, then falls back to class/aria-label selectors.
 * @returns The Name Box input element if found, otherwise null.
 */
function findNameBoxInput(): HTMLInputElement | null {
  const idMatch = document.getElementById('t-name-box');
  if (idMatch instanceof HTMLInputElement) {
    return idMatch;
  }

  return document.querySelector<HTMLInputElement>(
    'input.waffle-name-box, input[aria-label*="Name box"]'
  );
}

/**
 * Locates the Google Sheets cell editor element where cell values are typed.
 * Tries multiple known selectors as the editor element varies by context.
 * @returns The cell editor element if found, otherwise null.
 */
function findCellEditor(): HTMLElement | null {
  return (
    document.getElementById('waffle-rich-text-editor') ||
    document.querySelector<HTMLElement>(
      '#t-formula-bar-input [contenteditable="true"]'
    ) ||
    document.querySelector<HTMLElement>('#t-formula-bar-input') ||
    document.querySelector<HTMLElement>('.cell-input[role="textbox"]') ||
    document.querySelector<HTMLElement>('.cell-input')
  );
}

/**
 * Sets the text content of a cell editor element and dispatches an input event.
 * Handles both contenteditable elements and input elements.
 * @param editor - The editor element to set text on.
 * @param value - The string value to set.
 */
function setEditorText(editor: HTMLElement, value: string) {
  // Try to select existing text so the next input replace is clean.
  const selection = window.getSelection();
  if (selection) {
    const range = document.createRange();
    range.selectNodeContents(editor);
    selection.removeAllRanges();
    selection.addRange(range);
  }

  if (
    'value' in editor &&
    typeof (editor as HTMLInputElement).value === 'string'
  ) {
    (editor as HTMLInputElement).value = value;
  } else {
    editor.textContent = value;
  }

  editor.dispatchEvent(
    new InputEvent('input', {
      bubbles: true,
      composed: true,
      data: value,
      inputType: 'insertText'
    })
  );
}

export const tool: ToolDefinition = {
  name: 'google_sheets_set_cell_value',
  description:
    'Set one or more values into specific Google Sheets cells using A1 notation or row/col coordinates.',
  inputSchema: {
    type: 'object',
    properties: {
      cell: {
        type: 'string',
        description: 'Target cell in A1 notation (e.g. A1 or C5).'
      },
      row: {
        type: 'number',
        minimum: 1,
        description: 'Row number (1-based).'
      },
      col: {
        type: 'number',
        minimum: 1,
        description: 'Column number (1-based).'
      },
      value: {
        type: 'string',
        description: 'Text to place into the cell.'
      },
      updates: {
        type: 'array',
        description:
          'Batch updates. Each item must include either "cell" or both "row" and "col", plus "value".',
        items: {
          type: 'object',
          required: ['value'],
          properties: {
            cell: {type: 'string'},
            row: {type: 'number', minimum: 1},
            col: {type: 'number', minimum: 1},
            value: {type: 'string'}
          }
        }
      }
    }
  },
  async execute(rawInput: unknown) {
    const input = (rawInput as {
      cell?: string;
      row?: number;
      col?: number;
      value?: string;
      updates?: Array<{
        cell?: string;
        row?: number;
        col?: number;
        value?: string;
      }>;
    }) || {value: ''};

    const normalizedUpdates =
      Array.isArray(input.updates) && input.updates.length > 0
        ? input.updates
        : input.value !== undefined
          ? [
              {
                cell: input.cell,
                row: input.row,
                col: input.col,
                value: input.value
              }
            ]
          : [];

    if (!normalizedUpdates.length) {
      return {
        content: [
          {
            type: 'text',
            text: 'Invalid input: provide either a single cell/value or an "updates" array.'
          }
        ],
        isError: true
      };
    }

    const updates: Array<{cellRef: string; value: string}> = [];

    for (const update of normalizedUpdates) {
      if (typeof update?.value !== 'string') {
        return {
          content: [
            {
              type: 'text',
              text: 'Invalid input: every update needs a string "value".'
            }
          ],
          isError: true
        };
      }

      try {
        const cellRef = resolveCellReference({
          cell: update.cell,
          row: update.row,
          col: update.col
        });
        updates.push({cellRef, value: update.value});
      } catch (err) {
        const message =
          err instanceof Error && err.message
            ? err.message
            : 'Unable to resolve target cell.';
        return {content: [{type: 'text', text: message}], isError: true};
      }
    }

    try {
      const nameBox = findNameBoxInput();
      if (!nameBox) {
        throw new Error('Could not locate the Name box to select a cell.');
      }

      const completed: Array<{cell: string; value: string}> = [];

      for (const {cellRef, value} of updates) {
        nameBox.focus();
        nameBox.select?.();
        nameBox.value = cellRef;
        nameBox.dispatchEvent(new Event('input', {bubbles: true}));
        commitEnter(nameBox);

        await new Promise((resolve) => setTimeout(resolve, 30));

        const editor = findCellEditor();
        if (!editor) {
          throw new Error('Could not find a cell editor element.');
        }

        editor.focus();
        setEditorText(editor, value);
        commitEnter(editor);

        completed.push({cell: cellRef, value});
      }

      const lines = completed.map(
        ({cell, value}) => `Set ${cell} to "${value}".`
      );

      return {
        content: [
          {
            type: 'text',
            text: lines.join('\n')
          }
        ],
        structuredContent: {
          updates: completed
        }
      };
    } catch (error) {
      const message =
        error instanceof Error && typeof error.message === 'string'
          ? error.message
          : 'Failed to set cell value.';
      return {
        content: [
          {
            type: 'text',
            text: message
          }
        ],
        isError: true
      };
    }
  }
};
