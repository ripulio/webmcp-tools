import type {DomainToolServer} from '../shared.js';
import {tool as getContentTool} from '../tools/google_sheets_get_content.js';
import {tool as setCellValueTool} from '../tools/google_sheets_set_cell_value.js';

export const googleSheetsTools: DomainToolServer = {
  id: 'google-sheets',
  name: 'Google Sheets',
  version: '1.0.0',
  description: 'Tools for reading and writing Google Sheets content',
  domains: ['docs.google.com'],
  tools: [getContentTool, setCellValueTool]
};
