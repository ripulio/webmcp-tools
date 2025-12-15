export const tool = {
  name: 'googledocs_get_outline',
  description:
    'Get the document outline (table of contents) showing headings in the current Google Docs document',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  },
  async execute() {
    const outlineItems = document.querySelectorAll('.navigation-item-content');
    if (outlineItems.length === 0) {
      return {
        content: [
          {
            type: 'text' as const,
            text: 'No outline found. The document may not have any headings, or the outline panel may be hidden.'
          }
        ],
        structuredContent: {headings: [], total: 0}
      };
    }

    const headings: Array<{
      index: number;
      text: string;
      level: number;
    }> = [];

    outlineItems.forEach((item, i) => {
      const text = item.textContent?.trim() || '';
      // Extract level from class name (e.g., navigation-item-level-0, navigation-item-level-1)
      const levelMatch = item.className.match(/navigation-item-level-(\d+)/);
      const level = levelMatch ? parseInt(levelMatch[1], 10) : 0;

      headings.push({
        index: i,
        text,
        level
      });
    });

    const summary = headings
      .map((h) => {
        const indent = '  '.repeat(h.level);
        return `${indent}${h.index + 1}. ${h.text}`;
      })
      .join('\n');

    return {
      content: [{type: 'text' as const, text: `Document outline:\n${summary}`}],
      structuredContent: {headings, total: headings.length}
    };
  }
};
