import {describe, it, expect, beforeEach} from 'vitest';
import {tool} from './google_sheets_list_spreadsheets.js';

describe('google_sheets_list_spreadsheets', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('should have correct tool metadata', () => {
    expect(tool.name).toBe('google_sheets_list_spreadsheets');
  });

  it('should return error when no spreadsheets found', async () => {
    document.body.innerHTML = '<div>No spreadsheets here</div>';

    const result = await tool.execute({});

    expect(result.isError).toBe(true);
    expect(result.content[0]).toEqual({
      type: 'text',
      text: 'No spreadsheets found. Make sure you are on the Google Sheets home page.'
    });
  });

  it('should list spreadsheets with all metadata', async () => {
    document.body.innerHTML = `
      <div class="docs-homescreen-list-item">
        <span class="docs-homescreen-list-item-title-value">Budget 2024</span>
        <span class="docs-homescreen-list-item-owner">me</span>
        <span class="docs-homescreen-list-item-date">Jan 15</span>
      </div>
      <div class="docs-homescreen-list-item docs-homescreen-item-shared">
        <span class="docs-homescreen-list-item-title-value">Team Report</span>
        <span class="docs-homescreen-list-item-owner">alice@example.com</span>
        <span class="docs-homescreen-list-item-date">Jan 10</span>
      </div>
    `;

    const result = await tool.execute({});

    expect(result.isError).toBeUndefined();
    expect(result.structuredContent).toEqual({
      spreadsheets: [
        {
          index: 0,
          title: 'Budget 2024',
          owner: 'me',
          date: 'Jan 15',
          isShared: false
        },
        {
          index: 1,
          title: 'Team Report',
          owner: 'alice@example.com',
          date: 'Jan 10',
          isShared: true
        }
      ]
    });
    expect(result.content[0]).toEqual({
      type: 'text',
      text: 'Found 2 spreadsheets:\n\n[0] Budget 2024 - Owner: me - Jan 15\n[1] Team Report (shared) - Owner: alice@example.com - Jan 10'
    });
  });

  it('should use fallback values when elements are missing', async () => {
    document.body.innerHTML = `
      <div class="docs-homescreen-list-item"></div>
    `;

    const result = await tool.execute({});

    expect(result.structuredContent).toEqual({
      spreadsheets: [
        {
          index: 0,
          title: 'Untitled',
          owner: '',
          date: '',
          isShared: false
        }
      ]
    });
  });

  it('should respect the limit parameter', async () => {
    document.body.innerHTML = `
      <div class="docs-homescreen-list-item">
        <span class="docs-homescreen-list-item-title-value">Sheet 1</span>
      </div>
      <div class="docs-homescreen-list-item">
        <span class="docs-homescreen-list-item-title-value">Sheet 2</span>
      </div>
      <div class="docs-homescreen-list-item">
        <span class="docs-homescreen-list-item-title-value">Sheet 3</span>
      </div>
    `;

    const result = await tool.execute({limit: 2});

    expect(result.structuredContent).toEqual({
      spreadsheets: [
        {index: 0, title: 'Sheet 1', owner: '', date: '', isShared: false},
        {index: 1, title: 'Sheet 2', owner: '', date: '', isShared: false}
      ]
    });
  });
});
