import type {ToolDefinition} from 'webmcp-polyfill';

interface GetInteractiveParams {
  type?: 'button' | 'link' | 'input' | 'all';
  limit?: number;
}

export const tool: ToolDefinition = {
  name: 'debug_get_interactive_elements',
  description:
    'Get interactive elements (buttons, links, inputs) with their selectors and properties. Use to discover clickable/typeable elements.',
  inputSchema: {
    type: 'object',
    properties: {
      type: {
        type: 'string',
        enum: ['button', 'link', 'input', 'all'],
        description: 'Filter by element type (default: all)'
      },
      limit: {
        type: 'number',
        description: 'Maximum elements to return (default: 50)'
      }
    },
    required: []
  },
  async execute(params: unknown) {
    const {type: typeFilter = 'all', limit = 50} =
      (params as GetInteractiveParams) || {};
    const results: Array<{[key: string]: unknown}> = [];
    let total = 0;

    function isVisible(el: Element): boolean {
      if ((el as HTMLElement).offsetParent !== null) return true;
      const style = getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden')
        return false;
      if (style.position === 'fixed' || style.position === 'sticky')
        return true;
      if (el === document.body || el === document.documentElement) return true;
      return false;
    }

    function getSelector(el: Element): string {
      if (el.id) return '#' + el.id;
      const path: string[] = [];
      let current: Element | null = el;
      while (current && current.nodeType === Node.ELEMENT_NODE) {
        let selector = current.tagName.toLowerCase();
        if (current.id) {
          selector = '#' + current.id;
          path.unshift(selector);
          break;
        }
        if (current.className && typeof current.className === 'string') {
          const classes = current.className
            .trim()
            .split(/\s+/)
            .filter((c) => c && !c.includes(':'))
            .slice(0, 2);
          if (classes.length) selector += '.' + classes.join('.');
        }
        const parent: Element | null = current.parentElement;
        if (parent) {
          const siblings = Array.from(parent.children).filter(
            (c: Element) => c.tagName === current!.tagName
          );
          if (siblings.length > 1) {
            const index = siblings.indexOf(current) + 1;
            selector += ':nth-of-type(' + index + ')';
          }
        }
        path.unshift(selector);
        current = parent;
        if (path.length > 4) break;
      }
      return path.join(' > ');
    }

    function addResult(item: {[key: string]: unknown}): void {
      total++;
      if (results.length < limit) {
        results.push(item);
      }
    }

    // Buttons
    if (typeFilter === 'all' || typeFilter === 'button') {
      document
        .querySelectorAll(
          'button, [role="button"], input[type="button"], input[type="submit"]'
        )
        .forEach((el) => {
          if (!isVisible(el)) return;
          addResult({
            type: 'button',
            selector: getSelector(el),
            text:
              el.textContent?.trim().slice(0, 50) ||
              (el as HTMLInputElement).value ||
              '',
            disabled: (el as HTMLButtonElement).disabled || false
          });
        });
    }

    // Links
    if (typeFilter === 'all' || typeFilter === 'link') {
      document.querySelectorAll('a[href]').forEach((el) => {
        if (!isVisible(el)) return;
        addResult({
          type: 'link',
          selector: getSelector(el),
          text: el.textContent?.trim().slice(0, 50) || '',
          href: (el as HTMLAnchorElement).href
        });
      });
    }

    // Inputs
    if (typeFilter === 'all' || typeFilter === 'input') {
      document
        .querySelectorAll('input:not([type="hidden"]), textarea, select')
        .forEach((el) => {
          if (!isVisible(el)) return;
          const inputEl = el as HTMLInputElement;
          addResult({
            type: 'input',
            selector: getSelector(el),
            inputType: inputEl.type || el.tagName.toLowerCase(),
            name: inputEl.name || '',
            placeholder: inputEl.placeholder || '',
            value:
              inputEl.type === 'password'
                ? '***'
                : inputEl.value?.slice(0, 50) || ''
          });
        });
    }

    const summary = results
      .map((el) => {
        if (el.type === 'button')
          return `[button] ${el.selector} - "${el.text}"`;
        if (el.type === 'link') return `[link] ${el.selector} - "${el.text}"`;
        return `[input:${el.inputType}] ${el.selector} - name="${el.name}"`;
      })
      .join('\n');

    return {
      content: [
        {
          type: 'text',
          text: `Found ${total} interactive elements (showing ${results.length}):\n\n${summary}`
        }
      ],
      structuredContent: {
        elements: results,
        meta: {
          total,
          returned: results.length,
          truncated: total > results.length,
          limit
        }
      }
    };
  }
};
