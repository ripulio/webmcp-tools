import {describe, it, expect, beforeEach, vi} from 'vitest';
import {tool} from './google_sheets_search.js';

describe('google_sheets_search', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('should have correct tool metadata', () => {
    expect(tool.name).toBe('google_sheets_search');
  });

  it('should return error when search input is not found', async () => {
    document.body.innerHTML = '<div>No search input here</div>';

    const result = await tool.execute({query: 'test'});

    expect(result.isError).toBe(true);
    expect(result.content[0]).toEqual({
      type: 'text',
      text: 'Search input not found. Make sure you are on the Google Sheets home page.'
    });
  });

  it('should search when input is found', async () => {
    document.body.innerHTML = `
      <div>
        <input type="text" name="q" />
      </div>
    `;

    const searchInput =
      document.querySelector<HTMLInputElement>('input[name="q"]')!;
    const inputListener = vi.fn();
    const changeListener = vi.fn();
    const keydownListener = vi.fn();

    searchInput.addEventListener('input', inputListener);
    searchInput.addEventListener('change', changeListener);
    searchInput.addEventListener('keydown', keydownListener);

    const result = await tool.execute({query: 'my spreadsheet'});

    expect(result.isError).toBeUndefined();
    expect(result.content[0]).toEqual({
      type: 'text',
      text: 'Searching for: "my spreadsheet"'
    });

    expect(document.activeElement).toBe(searchInput);
    expect(searchInput.value).toBe('my spreadsheet');
    expect(inputListener).toHaveBeenCalledTimes(1);
    expect(changeListener).toHaveBeenCalledTimes(1);
    expect(keydownListener).toHaveBeenCalledTimes(1);
  });

  it('should clear existing value before searching', async () => {
    document.body.innerHTML = `
      <div>
        <input type="text" name="q" value="old query" />
      </div>
    `;

    const searchInput =
      document.querySelector<HTMLInputElement>('input[name="q"]')!;
    expect(searchInput.value).toBe('old query');

    await tool.execute({query: 'new query'});

    expect(searchInput.value).toBe('new query');
  });
});
