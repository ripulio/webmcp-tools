import type {ToolDefinition} from 'webmcp-polyfill';

export const tool: ToolDefinition = {
  name: 'pastebin_get_paste_metadata',
  description:
    'Get metadata about the currently viewed paste (title, author, date, syntax, size). Must be on a paste view page.',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  },
  async execute() {
    const postView = document.querySelector('.post-view');
    if (!postView) {
      return {
        content: [
          {
            type: 'text',
            text: 'Paste view not found. Make sure you are viewing a paste (pastebin.com/XXXXX).'
          }
        ],
        isError: true
      };
    }

    // Get title
    const titleEl = postView.querySelector('.info-top h1');
    const title = titleEl?.textContent?.trim() || 'Untitled';

    // Get author
    const authorEl = postView.querySelector('.info-bottom .username a');
    const author = authorEl?.textContent?.trim() || 'Guest';

    // Get date
    const dateEl = postView.querySelector('.info-bottom .date span');
    const date = dateEl?.textContent?.trim() || '';
    const fullDate = dateEl?.getAttribute('title') || date;

    // Get syntax/format from the left buttons area
    const formatLink = postView.querySelector(
      '.top-buttons .left a.btn.-small'
    );
    const syntax = formatLink?.textContent?.trim() || 'None';

    // Get size
    const leftDiv = postView.querySelector('.top-buttons .left');
    const sizeMatch = leftDiv?.textContent?.match(
      /([\d.]+\s*(?:KB|MB|B|bytes))/i
    );
    const size = sizeMatch ? sizeMatch[1] : '';

    // Get paste ID from URL
    const pasteId =
      window.location.pathname
        .split('/')
        .filter(
          (p) => p && !['raw', 'dl', 'clone', 'embed', 'print'].includes(p)
        )[0] || '';

    // Get raw URL
    const rawUrl = `https://pastebin.com/raw/${pasteId}`;

    const metadata = {
      title,
      author,
      date,
      fullDate,
      syntax,
      size,
      pasteId,
      rawUrl,
      url: window.location.href
    };

    const summary = [
      `Title: ${title}`,
      `Author: ${author}`,
      `Date: ${fullDate || date}`,
      `Syntax: ${syntax}`,
      `Size: ${size}`,
      `Paste ID: ${pasteId}`,
      `Raw URL: ${rawUrl}`
    ].join('\n');

    return {
      content: [{type: 'text', text: summary}],
      structuredContent: metadata
    };
  }
};
