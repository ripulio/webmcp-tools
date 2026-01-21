import {describe, it, expect, beforeEach, vi} from 'vitest';
import {tool} from './google_sheets_open_spreadsheet.js';

describe('google_sheets_open_spreadsheet', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('should have correct tool metadata', () => {
    expect(tool.name).toBe('google_sheets_open_spreadsheet');
  });

  it('should return error when no spreadsheets found', async () => {
    document.body.innerHTML = '<div>No spreadsheets here</div>';

    const result = await tool.execute({index: 0});

    expect(result.isError).toBe(true);
    expect(result.content[0]).toEqual({
      type: 'text',
      text: 'No spreadsheets found. Make sure you are on the Google Sheets home page.'
    });
  });

  it('should return error when index is out of range', async () => {
    document.body.innerHTML = `
      <div class="docs-homescreen-list-item">
        <span class="docs-homescreen-list-item-title-value">Budget</span>
      </div>
    `;

    const result = await tool.execute({index: 5});

    expect(result.isError).toBe(true);
    expect(result.content[0]).toEqual({
      type: 'text',
      text: 'Invalid index 5. Valid range is 0-0.'
    });
  });

  it('should return error when index is negative', async () => {
    document.body.innerHTML = `
      <div class="docs-homescreen-list-item">
        <span class="docs-homescreen-list-item-title-value">Budget</span>
      </div>
    `;

    const result = await tool.execute({index: -1});

    expect(result.isError).toBe(true);
    expect(result.content[0]).toEqual({
      type: 'text',
      text: 'Invalid index -1. Valid range is 0-0.'
    });
  });

  it('should open spreadsheet by index', async () => {
    document.body.innerHTML = `
      <div class="docs-homescreen-list-item">
        <span class="docs-homescreen-list-item-title-value">Budget 2024</span>
      </div>
      <div class="docs-homescreen-list-item">
        <span class="docs-homescreen-list-item-title-value">Sales Report</span>
      </div>
    `;

    const targetItem = document.querySelectorAll(
      '.docs-homescreen-list-item'
    )[1];
    const clickListener = vi.fn();
    targetItem.addEventListener('click', clickListener);

    const result = await tool.execute({index: 1});

    expect(result.isError).toBeUndefined();
    expect(result.content[0]).toEqual({
      type: 'text',
      text: 'Opening spreadsheet: "Sales Report"'
    });
    expect(clickListener).toHaveBeenCalledTimes(1);
  });

  it('should use fallback title when title element is missing', async () => {
    document.body.innerHTML = `
      <div class="docs-homescreen-list-item"></div>
    `;

    const targetItem = document.querySelector('.docs-homescreen-list-item')!;
    const clickListener = vi.fn();
    targetItem.addEventListener('click', clickListener);

    const result = await tool.execute({index: 0});

    expect(result.isError).toBeUndefined();
    expect(result.content[0]).toEqual({
      type: 'text',
      text: 'Opening spreadsheet: "Untitled"'
    });
    expect(clickListener).toHaveBeenCalledTimes(1);
  });
});
