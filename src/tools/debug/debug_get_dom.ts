import type {ToolDefinition} from 'webmcp-polyfill';

interface DomNode {
  tag?: string;
  text?: string;
  attrs?: Record<string, string>;
  selector?: string;
  children?: DomNode[];
  [key: string]: unknown;
}

interface GetDomParams {
  selector?: string;
  maxDepth?: number;
  maxElements?: number;
  excludeTags?: string[];
  textOnly?: boolean;
  summarizeLists?: boolean;
}

export const tool: ToolDefinition = {
  name: 'debug_get_dom',
  description:
    'Extract DOM structure with filtering. Use selector to scope extraction. Returns element tree with attributes and truncation metadata.',
  inputSchema: {
    type: 'object',
    properties: {
      selector: {
        type: 'string',
        description: 'CSS selector to scope extraction (default: body)'
      },
      maxDepth: {
        type: 'number',
        description: 'Maximum nesting depth (default: 4)'
      },
      maxElements: {
        type: 'number',
        description: 'Maximum elements to return (default: 100)'
      },
      excludeTags: {
        type: 'array',
        items: {type: 'string'},
        description: 'Tags to exclude (default: script, style, noscript, svg)'
      },
      textOnly: {
        type: 'boolean',
        description: 'Return only text content hierarchy'
      },
      summarizeLists: {
        type: 'boolean',
        description: 'Collapse repeated sibling elements (default: true)'
      }
    },
    required: []
  },
  async execute(params: unknown) {
    const {
      selector = 'body',
      maxDepth = 4,
      maxElements = 100,
      excludeTags = ['script', 'style', 'noscript', 'svg'],
      textOnly = false,
      summarizeLists = true
    } = (params as GetDomParams) || {};

    const excludeTagsSet = new Set(excludeTags.map((t) => t.toUpperCase()));
    let elementCount = 0;
    let truncated = false;

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
      if (el.className && typeof el.className === 'string') {
        const classes = el.className
          .trim()
          .split(/\s+/)
          .filter((c) => c)
          .slice(0, 2)
          .join('.');
        if (classes) return el.tagName.toLowerCase() + '.' + classes;
      }
      return el.tagName.toLowerCase();
    }

    function extractNode(node: Node, depth: number): DomNode | null {
      if (elementCount >= maxElements) {
        truncated = true;
        return null;
      }
      if (depth > maxDepth) return {tag: '...', text: '[depth limit]'};
      if (node.nodeType === Node.TEXT_NODE) {
        const text = (node.textContent || '').trim();
        return text ? {text} : null;
      }
      if (node.nodeType !== Node.ELEMENT_NODE) return null;

      const el = node as Element;
      if (excludeTagsSet.has(el.tagName)) return null;
      if (!isVisible(el)) return null;

      elementCount++;
      const result: DomNode = {tag: el.tagName.toLowerCase()};

      if (!textOnly) {
        const attrs: Record<string, string> = {};
        for (const attr of Array.from(el.attributes)) {
          if (!attr.name.startsWith('data-')) {
            attrs[attr.name] = attr.value.slice(0, 100);
          }
        }
        if (Object.keys(attrs).length > 0) result.attrs = attrs;
        result.selector = getSelector(el);
      }

      const children: DomNode[] = [];
      let lastTag: string | null = null;
      let sameTagCount = 0;

      for (const child of Array.from(el.childNodes)) {
        if (truncated) break;
        const extracted = extractNode(child, depth + 1);
        if (!extracted) continue;

        if (summarizeLists && extracted.tag && extracted.tag === lastTag) {
          sameTagCount++;
          if (sameTagCount === 3) {
            children.push({tag: extracted.tag, text: '[... more items]'});
          }
          continue;
        }

        lastTag = extracted.tag || null;
        sameTagCount = 1;
        children.push(extracted);
      }

      if (children.length > 0) result.children = children;

      const directText = Array.from(el.childNodes)
        .filter((n) => n.nodeType === Node.TEXT_NODE)
        .map((n) => (n.textContent || '').trim())
        .filter((t) => t)
        .join(' ');
      if (directText) result.text = directText.slice(0, 200);

      return result;
    }

    const root = document.querySelector(selector);
    if (!root) {
      return {
        content: [
          {type: 'text', text: `Error: Selector not found: ${selector}`}
        ],
        structuredContent: {
          dom: null,
          meta: {elementCount: 0, truncated: false, maxElements, maxDepth},
          error: `Selector not found: ${selector}`
        },
        isError: true
      };
    }

    const dom = extractNode(root, 0);
    const result = {
      dom,
      meta: {elementCount, truncated, maxElements, maxDepth}
    };

    return {
      content: [{type: 'text', text: JSON.stringify(result, null, 2)}],
      structuredContent: result
    };
  }
};
