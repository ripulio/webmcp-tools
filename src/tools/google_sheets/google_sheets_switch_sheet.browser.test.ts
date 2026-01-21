import {describe, it, expect, beforeEach, vi} from 'vitest';
import {tool} from './google_sheets_switch_sheet.js';

describe('google_sheets_switch_sheet', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('should have correct tool metadata', () => {
    expect(tool.name).toBe('google_sheets_switch_sheet');
  });

  it('should return error when neither index nor name provided', async () => {
    const result = await tool.execute({});

    expect(result.isError).toBe(true);
    expect(result.content[0]).toEqual({
      type: 'text',
      text: 'Either index or name must be provided.'
    });
  });

  it('should return error when no sheet tabs found', async () => {
    document.body.innerHTML = '<div>No tabs here</div>';

    const result = await tool.execute({index: 0});

    expect(result.isError).toBe(true);
    expect(result.content[0]).toEqual({
      type: 'text',
      text: 'No sheet tabs found. Make sure you have a spreadsheet open.'
    });
  });

  it('should return error when index is out of range', async () => {
    document.body.innerHTML = `
      <div class="docs-sheet-tab">
        <span class="docs-sheet-tab-name">Sheet1</span>
      </div>
    `;

    const result = await tool.execute({index: 5});

    expect(result.isError).toBe(true);
    expect(result.content[0]).toEqual({
      type: 'text',
      text: 'Invalid index 5. Valid range is 0-0.'
    });
  });

  it('should return error when name does not match any sheet', async () => {
    document.body.innerHTML = `
      <div class="docs-sheet-tab">
        <span class="docs-sheet-tab-name">Sheet1</span>
      </div>
    `;

    const result = await tool.execute({name: 'NonExistent'});

    expect(result.isError).toBe(true);
    expect(result.content[0]).toEqual({
      type: 'text',
      text: 'No sheet found matching "NonExistent".'
    });
  });

  it('should switch to sheet by index', async () => {
    document.body.innerHTML = `
      <div class="docs-sheet-tab">
        <span class="docs-sheet-tab-name">Sheet1</span>
      </div>
      <div class="docs-sheet-tab">
        <span class="docs-sheet-tab-name">Data</span>
      </div>
    `;

    const targetTab = document.querySelectorAll('.docs-sheet-tab')[1];
    const mousedownListener = vi.fn();
    targetTab.addEventListener('mousedown', mousedownListener);

    const result = await tool.execute({index: 1});

    expect(result.isError).toBeUndefined();
    expect(result.content[0]).toEqual({
      type: 'text',
      text: 'Switched to sheet: "Data"'
    });
    expect(result.structuredContent).toEqual({sheetName: 'Data'});
    expect(mousedownListener).toHaveBeenCalledTimes(1);
  });

  it('should switch to sheet by name with partial match', async () => {
    document.body.innerHTML = `
      <div class="docs-sheet-tab">
        <span class="docs-sheet-tab-name">Sheet1</span>
      </div>
      <div class="docs-sheet-tab">
        <span class="docs-sheet-tab-name">Sales Data</span>
      </div>
    `;

    const targetTab = document.querySelectorAll('.docs-sheet-tab')[1];
    const mousedownListener = vi.fn();
    targetTab.addEventListener('mousedown', mousedownListener);

    const result = await tool.execute({name: 'sales'});

    expect(result.isError).toBeUndefined();
    expect(result.content[0]).toEqual({
      type: 'text',
      text: 'Switched to sheet: "Sales Data"'
    });
    expect(result.structuredContent).toEqual({sheetName: 'Sales Data'});
    expect(mousedownListener).toHaveBeenCalledTimes(1);
  });

  it('should use fallback name when tab name element is missing', async () => {
    document.body.innerHTML = `
      <div class="docs-sheet-tab"></div>
    `;

    const targetTab = document.querySelector('.docs-sheet-tab')!;
    const mousedownListener = vi.fn();
    targetTab.addEventListener('mousedown', mousedownListener);

    const result = await tool.execute({index: 0});

    expect(result.isError).toBeUndefined();
    expect(result.content[0]).toEqual({
      type: 'text',
      text: 'Switched to sheet: "Sheet1"'
    });
    expect(mousedownListener).toHaveBeenCalledTimes(1);
  });
});
