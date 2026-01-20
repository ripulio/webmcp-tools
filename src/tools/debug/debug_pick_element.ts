import type {ToolDefinition} from 'webmcp-polyfill';

export const tool: ToolDefinition = {
  name: 'debug_pick_element',
  description:
    "Opens an interactive element picker in the browser UI. The user will see a visual overlay and can click any element to select it. Returns the selected element's tag, id, classes, and a CSS selector. Press ESC to cancel.",
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  },
  async execute() {
    return new Promise((resolve) => {
      // Create overlay style
      const style = document.createElement('style');
      style.id = '__webmcp_picker_style';
      style.textContent = `
        .__webmcp_picker_highlight {
          outline: 2px solid #ff6b6b !important;
          outline-offset: 2px !important;
          cursor: crosshair !important;
        }
        .__webmcp_picker_overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 2147483647;
          cursor: crosshair;
        }
        .__webmcp_picker_banner {
          position: fixed;
          top: 10px;
          left: 50%;
          transform: translateX(-50%);
          background: #333;
          color: white;
          padding: 10px 20px;
          border-radius: 5px;
          font-family: system-ui, sans-serif;
          font-size: 14px;
          z-index: 2147483647;
          pointer-events: none;
        }
      `;
      document.head.appendChild(style);

      // Create banner
      const banner = document.createElement('div');
      banner.className = '__webmcp_picker_banner';
      banner.textContent = 'Click on an element to select it (ESC to cancel)';
      document.body.appendChild(banner);

      let currentElement: Element | null = null;

      const cleanup = () => {
        if (currentElement) {
          currentElement.classList.remove('__webmcp_picker_highlight');
        }
        document.removeEventListener('mouseover', onMouseOver, true);
        document.removeEventListener('mouseout', onMouseOut, true);
        document.removeEventListener('click', onClick, true);
        document.removeEventListener('keydown', onKeyDown, true);
        style.remove();
        banner.remove();
      };

      const getSelector = (el: Element): string => {
        if (el.id) {
          return `#${el.id}`;
        }

        const parts: string[] = [];
        let current: Element | null = el;

        while (current && current !== document.body) {
          let selector = current.tagName.toLowerCase();

          if (current.id) {
            selector = `#${current.id}`;
            parts.unshift(selector);
            break;
          } else if (
            current.className &&
            typeof current.className === 'string'
          ) {
            const classes = current.className
              .trim()
              .split(/\s+/)
              .filter((c) => !c.startsWith('__webmcp'));
            if (classes.length > 0) {
              selector += '.' + classes.slice(0, 2).join('.');
            }
          }

          const parent: Element | null = current.parentElement;
          if (parent) {
            const siblings = Array.from(parent.children).filter(
              (c: Element) => c.tagName === current!.tagName
            );
            if (siblings.length > 1) {
              const index = siblings.indexOf(current) + 1;
              selector += `:nth-of-type(${index})`;
            }
          }

          parts.unshift(selector);
          current = parent;
        }

        return parts.join(' > ');
      };

      const onMouseOver = (e: MouseEvent) => {
        const target = e.target as Element;
        if (
          target === banner ||
          target.classList.contains('__webmcp_picker_banner')
        ) {
          return;
        }
        if (currentElement) {
          currentElement.classList.remove('__webmcp_picker_highlight');
        }
        currentElement = target;
        target.classList.add('__webmcp_picker_highlight');
      };

      const onMouseOut = (e: MouseEvent) => {
        const target = e.target as Element;
        target.classList.remove('__webmcp_picker_highlight');
      };

      const onClick = (e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const target = e.target as Element;
        if (target === banner) {
          return;
        }

        const selector = getSelector(target);
        const rect = target.getBoundingClientRect();

        cleanup();

        resolve({
          content: [
            {
              type: 'text',
              text: `Selected element: <${target.tagName.toLowerCase()}>\nSelector: ${selector}\nID: ${target.id || '(none)'}\nClasses: ${target.className || '(none)'}\nText: ${(target.textContent || '').trim().slice(0, 100)}\nPosition: ${Math.round(rect.x)}, ${Math.round(rect.y)}\nSize: ${Math.round(rect.width)} x ${Math.round(rect.height)}`
            }
          ],
          structuredContent: {
            tag: target.tagName.toLowerCase(),
            id: target.id || null,
            classes: target.className
              ? target.className.split(/\s+/).filter(Boolean)
              : [],
            selector: selector,
            text: (target.textContent || '').trim().slice(0, 500),
            rect: {
              x: rect.x,
              y: rect.y,
              width: rect.width,
              height: rect.height
            }
          }
        });
      };

      const onKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          cleanup();
          resolve({
            content: [
              {
                type: 'text',
                text: 'Element selection cancelled.'
              }
            ],
            isError: true
          });
        }
      };

      document.addEventListener('mouseover', onMouseOver, true);
      document.addEventListener('mouseout', onMouseOut, true);
      document.addEventListener('click', onClick, true);
      document.addEventListener('keydown', onKeyDown, true);
    });
  }
};
