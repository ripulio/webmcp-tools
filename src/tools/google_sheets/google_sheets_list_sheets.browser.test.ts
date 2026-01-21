import {describe, it, expect, beforeEach} from 'vitest';
import {tool} from './google_sheets_list_sheets.js';

describe('google_sheets_list_sheets', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('should have correct tool metadata', () => {
    expect(tool.name).toBe('google_sheets_list_sheets');
  });

  it('should return error when no sheet tabs found', async () => {
    document.body.innerHTML = '<div>No tabs here</div>';

    const result = await tool.execute({});

    expect(result.isError).toBe(true);
    expect(result.content[0]).toEqual({
      type: 'text',
      text: 'No sheet tabs found. Make sure you have a spreadsheet open.'
    });
  });

  it('should list sheets with their names and active state', async () => {
    document.body.innerHTML = `
      <div class="docs-sheet-tab">
        <span class="docs-sheet-tab-name">Sheet1</span>
      </div>
      <div class="docs-sheet-tab docs-sheet-active-tab">
        <span class="docs-sheet-tab-name">Data</span>
      </div>
      <div class="docs-sheet-tab">
        <span class="docs-sheet-tab-name">Summary</span>
      </div>
    `;

    const result = await tool.execute({});

    expect(result.isError).toBeUndefined();
    expect(result.structuredContent).toEqual({
      sheets: [
        {index: 0, name: 'Sheet1', isActive: false},
        {index: 1, name: 'Data', isActive: true},
        {index: 2, name: 'Summary', isActive: false}
      ]
    });
    expect(result.content[0]).toEqual({
      type: 'text',
      text: 'Found 3 sheet(s):\n\n[0] Sheet1\n[1] Data (active)\n[2] Summary'
    });
  });

  it('should use fallback name when tab name element is missing', async () => {
    document.body.innerHTML = `
      <div class="docs-sheet-tab"></div>
      <div class="docs-sheet-tab">
        <span class="docs-sheet-tab-name">Named</span>
      </div>
    `;

    const result = await tool.execute({});

    expect(result.structuredContent).toEqual({
      sheets: [
        {index: 0, name: 'Sheet1', isActive: false},
        {index: 1, name: 'Named', isActive: false}
      ]
    });
  });
});
