import type {ToolDefinition} from 'webmcp-polyfill';
import type {ToolRegistryEntry} from '../shared.js';

const MAX_ROWS = 50;

function findBootstrapDataScript(): HTMLScriptElement | null {
  return (
    document.querySelector<HTMLScriptElement>('body > script:nth-child(13)') ||
    Array.from(document.querySelectorAll<HTMLScriptElement>('script')).find(
      (script) => {
        const source = script?.textContent || '';
        return source.includes('bootstrapData') && source.includes('trixApp');
      }
    ) ||
    null
  );
}

function parseBootstrapDataFromScript(
  scriptEl: HTMLScriptElement | null
): unknown {
  const existing = (globalThis as {bootstrapData?: unknown}).bootstrapData;
  if (existing && typeof existing === 'object') {
    return existing;
  }

  if (!scriptEl) {
    throw new Error('Could not find the Google Sheets bootstrap script tag.');
  }

  const source = scriptEl.textContent || '';

  // 1) Object literal: var|let|const bootstrapData = { ... };
  const objectMatch = source.match(
    /(?:var|let|const)?\s*bootstrapData\s*=\s*({[\s\S]*?})\s*;/
  );
  if (objectMatch) {
    try {
      return JSON.parse(objectMatch[1]);
    } catch {
      throw new Error('Failed to parse bootstrapData JSON.');
    }
  }

  // 2) JSON.parse wrapper: bootstrapData = JSON.parse('...json...');
  const jsonParseMatch = source.match(
    /(?:var|let|const)?\s*bootstrapData\s*=\s*JSON\.parse\(\s*(['"])([\s\S]*?)\1\s*\)\s*;/
  );
  if (jsonParseMatch) {
    try {
      return JSON.parse(jsonParseMatch[2]);
    } catch {
      throw new Error('Failed to parse bootstrapData JSON.parse payload.');
    }
  }

  throw new Error(
    'bootstrapData assignment was not found in the script content.'
  );
}

function decodeCellValue(cell: Record<PropertyKey, unknown> | undefined) {
  if (!cell || typeof cell !== 'object') {
    return '';
  }

  const raw = cell['3'];
  if (raw == null) {
    return '';
  }

  if (Array.isArray(raw)) {
    if (raw.length === 0) {
      return '';
    }

    if (raw[0] === 2 && typeof raw[1] === 'string') {
      return raw[1];
    }

    const pieces = raw
      .map((part) => {
        if (part && typeof part === 'object' && '3' in part) {
          return part['3'];
        }

        if (typeof part === 'string' || typeof part === 'number') {
          return part;
        }

        return '';
      })
      .filter((piece) => piece !== null && piece !== undefined);

    return pieces.map((piece) => String(piece)).join('');
  }

  if (typeof raw === 'string' || typeof raw === 'number') {
    return String(raw);
  }

  if (typeof raw === 'object' && '3' in raw) {
    return String(raw['3']);
  }

  return '';
}

function normalizeRow(cells: unknown[]): string[] {
  const normalized = cells.map((cell) => {
    if (cell == null) {
      return '';
    }

    return typeof cell === 'string' ? cell.trim() : String(cell).trim();
  });

  let lastIndex = normalized.length - 1;
  while (lastIndex >= 0 && !normalized[lastIndex]) {
    lastIndex -= 1;
  }

  return normalized.slice(0, lastIndex + 1);
}

function isBootstrapDataLike(
  data: unknown
): data is {changes: {firstchunk: unknown}} {
  return (
    data != null &&
    typeof data === 'object' &&
    'changes' in data &&
    data.changes != null &&
    typeof data.changes === 'object' &&
    'firstchunk' in data.changes
  );
}

type SliceOptions = {
  startRow?: number;
  endRow?: number;
  startCol?: number;
  endCol?: number;
  maxRows?: number;
};

function extractRowsFromBootstrapData(
  bootstrapData: unknown,
  slice: SliceOptions
) {
  const rows: Array<string[]> = [];
  let totalRows = 0;
  const {
    startRow = 1,
    endRow,
    startCol = 1,
    endCol,
    maxRows = MAX_ROWS
  } = slice;

  const startRowIdx = Math.max(0, startRow - 1);
  const endRowIdx = endRow != null ? Math.max(endRow - 1, startRowIdx) : null;
  const startColIdx = Math.max(0, startCol - 1);
  const endColIdx = endCol != null ? Math.max(endCol - 1, startColIdx) : null;

  if (!isBootstrapDataLike(bootstrapData)) {
    throw new Error('Invalid bootstrapData structure.');
  }

  const chunks = Array.isArray(bootstrapData?.changes?.firstchunk)
    ? bootstrapData.changes.firstchunk
    : [];

  chunks.forEach((chunkEntry) => {
    if (!Array.isArray(chunkEntry) || typeof chunkEntry[1] !== 'string') {
      return;
    }

    let parsed;
    try {
      parsed = JSON.parse(chunkEntry[1]);
    } catch {
      return;
    }

    const meta = Array.isArray(parsed?.[0]) ? parsed[0] : [];
    const rowStart = Number(meta?.[1]) || 0;
    const colStart = Number(meta?.[3]) || 0;
    const colCount = Number(meta?.[4]) || 0;
    const flatCells = Array.isArray(parsed?.[3]) ? parsed[3] : [];

    if (!flatCells.length || !colCount) {
      return;
    }

    for (let i = 0; i < flatCells.length; i += colCount) {
      const rowSlice = flatCells.slice(i, i + colCount);
      const absoluteRow = rowStart + i / colCount;

      if (absoluteRow < startRowIdx) {
        continue;
      }
      if (endRowIdx != null && absoluteRow > endRowIdx) {
        break;
      }

      const cells = rowSlice.flatMap((columnBlock, localColIndex) => {
        const absoluteCol = colStart + localColIndex;
        if (absoluteCol < startColIdx) {
          return [];
        }
        if (endColIdx != null && absoluteCol > endColIdx) {
          return [];
        }

        const cellPayload = Array.isArray(columnBlock)
          ? columnBlock.find(
              (part): part is Record<PropertyKey, unknown> =>
                part && typeof part === 'object' && Object.keys(part).length > 0
            )
          : columnBlock && typeof columnBlock === 'object'
            ? (columnBlock as Record<PropertyKey, unknown>)
            : undefined;

        const decoded = decodeCellValue(cellPayload);
        return [decoded == null ? '' : String(decoded)];
      });

      const normalized = normalizeRow(cells);
      if (!normalized.length) {
        continue;
      }

      totalRows += 1;
      if (rows.length < maxRows) {
        rows.push(normalized);
      }
    }
  });

  return {
    rows,
    totalRows,
    truncated: totalRows > maxRows
  };
}

function formatAsMarkdownTable(rows: Array<string[]>): string {
  if (!rows.length) {
    return '';
  }

  const columnCount = rows.reduce((max, row) => Math.max(max, row.length), 0);
  const padRow = (row: string[]) => {
    const copy = row.slice();
    while (copy.length < columnCount) {
      copy.push('');
    }
    return copy;
  };

  const [header, ...body] = rows;
  const tableLines = [];

  if (header) {
    tableLines.push(
      '| ' +
        padRow(header)
          .map((value) => value || '(empty)')
          .join(' | ') +
        ' |'
    );
    tableLines.push(
      '| ' + new Array(columnCount).fill('---').join(' | ') + ' |'
    );
  }

  body.forEach((row) => {
    tableLines.push(
      '| ' +
        padRow(row)
          .map((value) => value || '')
          .join(' | ') +
        ' |'
    );
  });

  if (!header) {
    return rows.map((row) => row.join(' | ')).join('\\n');
  }

  return tableLines.join('\\n');
}

function getGoogleSheetsContent(slice: SliceOptions = {}) {
  const scriptEl = findBootstrapDataScript();
  const bootstrapData = parseBootstrapDataFromScript(scriptEl);
  const {rows, totalRows, truncated} = extractRowsFromBootstrapData(
    bootstrapData,
    slice
  );

  return {
    rows,
    totalRows,
    truncated,
    markdown: formatAsMarkdownTable(rows)
  };
}

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

function findNameBoxInput(): HTMLInputElement | null {
  const idMatch = document.getElementById('t-name-box');
  if (idMatch instanceof HTMLInputElement) {
    return idMatch;
  }

  return document.querySelector<HTMLInputElement>(
    'input.waffle-name-box, input[aria-label*="Name box"]'
  );
}

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

const getContentTool: ToolDefinition = {
  name: 'google_sheets_get_content',
  description:
    'Return the current Google Sheets grid content (optional row/column slice, defaults to first 50 rows). If the range is empty, it returns a "No data in the specified range." message (not an error); parsing failures return an error.',
  inputSchema: {
    type: 'object',
    properties: {
      startRow: {type: 'number', minimum: 1},
      endRow: {type: 'number', minimum: 1},
      startCol: {type: 'number', minimum: 1},
      endCol: {type: 'number', minimum: 1},
      maxRows: {type: 'number', minimum: 1}
    }
  },
  async execute(rawInput: unknown) {
    const input =
      (rawInput as {
        startRow?: number;
        endRow?: number;
        startCol?: number;
        endCol?: number;
        maxRows?: number;
      }) || {};
    try {
      const result = getGoogleSheetsContent({
        startRow: input?.startRow,
        endRow: input?.endRow,
        startCol: input?.startCol,
        endCol: input?.endCol,
        maxRows: input?.maxRows
      });
      const lines = [];

      if (result.rows.length) {
        lines.push(
          'Here are the first ' +
            result.rows.length +
            ' rows from the active sheet:'
        );
      } else {
        lines.push('No data in the specified range.');
      }

      if (result.markdown) {
        lines.push(result.markdown);
      }

      if (result.truncated) {
        lines.push(
          '',
          'Note: output truncated to ' + (input?.maxRows ?? MAX_ROWS) + ' rows.'
        );
      }

      return {
        content: [
          {
            type: 'text',
            text: lines.join('\\n')
          }
        ],
        structuredContent: {
          rows: result.rows,
          totalRows: result.totalRows,
          truncated: result.truncated
        }
      };
    } catch (error) {
      const message =
        error instanceof Error && typeof error.message === 'string'
          ? error.message
          : 'Failed to extract Google Sheets content.';
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

const setCellValueTool: ToolDefinition = {
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

export const googleSheetsTools: ToolRegistryEntry = {
  id: 'google-sheets',
  name: 'Google Sheets',
  version: '1.0.0',
  description: 'Tools for reading and writing Google Sheets content',
  domains: ['docs.google.com'],
  tools: [
    {
      tool: getContentTool,
      pathPattern: '^/spreadsheets/'
    },
    {
      tool: setCellValueTool,
      pathPattern: '^/spreadsheets/'
    }
  ]
};
