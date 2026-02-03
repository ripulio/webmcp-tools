import type {ToolDefinition} from 'webmcp-polyfill';

interface GetComputedStylesParams {
  selector: string;
  multiSelect?: boolean;
  limit?: number;
  styleProperties?: string[];
}

interface ElementInfo {
  tagName: string;
  id: string;
  className: string;
}

interface StyleResult {
  selector: string;
  index?: number;
  element: ElementInfo;
  computedStyles: Record<string, string>;
}

function getElementInfo(el: Element): ElementInfo {
  return {
    tagName: el.tagName.toLowerCase(),
    id: el.id || '',
    className:
      typeof el.className === 'string' ? el.className.trim() : ''
  };
}

function getElementLabel(info: ElementInfo): string {
  let label = `<${info.tagName}`;
  if (info.id) label += `#${info.id}`;
  if (info.className) {
    const classes = info.className.split(/\s+/).slice(0, 2).join('.');
    label += `.${classes}`;
  }
  label += '>';
  return label;
}

function getStyles(
  el: Element,
  styleProperties?: string[]
): Record<string, string> {
  const computed = window.getComputedStyle(el);
  const styles: Record<string, string> = {};

  if (styleProperties && styleProperties.length > 0) {
    for (const prop of styleProperties) {
      const value = computed.getPropertyValue(prop);
      if (value) {
        styles[prop] = value;
      }
    }
  } else {
    for (let i = 0; i < computed.length; i++) {
      const prop = computed[i];
      styles[prop] = computed.getPropertyValue(prop);
    }
  }

  return styles;
}

export const tool: ToolDefinition = {
  name: 'debug_get_computed_styles',
  description:
    'Get computed CSS styles from elements matching a selector. Returns actual rendered style values. Only properties with non-empty values are included in results.',
  inputSchema: {
    type: 'object',
    properties: {
      selector: {
        type: 'string',
        description: 'CSS selector to find element(s)'
      },
      multiSelect: {
        type: 'boolean',
        description:
          'If true, return styles for all matching elements. If false (default), return styles for first match only.'
      },
      limit: {
        type: 'number',
        description:
          'Maximum number of elements to return styles for when multiSelect is true (default: 50)'
      },
      styleProperties: {
        type: 'array',
        items: {type: 'string'},
        description:
          'Specific CSS properties to retrieve (e.g., ["color", "font-size"]). If omitted, returns all computed styles.'
      }
    },
    required: ['selector']
  },
  async execute(params: unknown) {
    const {
      selector,
      multiSelect = false,
      limit = 50,
      styleProperties
    } = (params as GetComputedStylesParams) || {};

    if (multiSelect) {
      const elements = document.querySelectorAll(selector);
      if (elements.length === 0) {
        return {
          content: [
            {type: 'text', text: `No elements found matching: ${selector}`}
          ],
          structuredContent: {
            selector,
            results: []
          }
        };
      }

      const results: StyleResult[] = [];
      const count = Math.min(elements.length, limit);
      for (let i = 0; i < count; i++) {
        const el = elements[i];
        const elementInfo = getElementInfo(el);
        results.push({
          selector,
          index: i,
          element: elementInfo,
          computedStyles: getStyles(el, styleProperties)
        });
      }

      const truncated = elements.length > limit;
      return {
        content: [
          {
            type: 'text',
            text: `Got computed styles for ${results.length} element(s) matching "${selector}"${truncated ? ` (truncated from ${elements.length})` : ''}`
          }
        ],
        structuredContent: {
          selector,
          results,
          totalElements: elements.length,
          truncated
        }
      };
    } else {
      const elements = document.querySelectorAll(selector);
      const el = elements[0];
      const elementCount = elements.length;

      if (!el) {
        return {
          content: [
            {type: 'text', text: `Error: No element found matching: ${selector}`}
          ],
          structuredContent: {
            selector,
            element: null,
            computedStyles: null,
            elementCount: 0,
            error: `No element found matching: ${selector}`
          },
          isError: true
        };
      }

      const elementInfo = getElementInfo(el);
      const computedStyles = getStyles(el, styleProperties);

      return {
        content: [
          {
            type: 'text',
            text: `Got computed styles for ${getElementLabel(elementInfo)}`
          }
        ],
        structuredContent: {
          selector,
          element: elementInfo,
          computedStyles,
          elementCount
        }
      };
    }
  }
};
