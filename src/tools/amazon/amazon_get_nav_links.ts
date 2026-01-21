import type {ToolDefinition} from 'webmcp-polyfill';

interface NavLink {
  [key: string]: unknown;
  text: string;
  href: string;
}

export const amazonGetNavLinks: ToolDefinition = {
  name: 'amazon_get_nav_links',
  description:
    "Get the main navigation links from the Amazon navigation bar (e.g., Today's Deals, Prime Video, Gift Cards, etc.).",
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  },
  async execute() {
    const navLinks =
      document.querySelectorAll<HTMLAnchorElement>('#nav-xshop a.nav-a');

    if (navLinks.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: 'Navigation links not found. Make sure you are on an Amazon page.'
          }
        ],
        isError: true
      };
    }

    const links: NavLink[] = [];
    navLinks.forEach((link) => {
      const text = link.textContent?.trim();
      if (text && link.href) {
        links.push({
          text,
          href: link.href
        });
      }
    });

    return {
      content: [
        {
          type: 'text',
          text: `Navigation links:\n${links.map((l) => `- ${l.text}`).join('\n')}`
        }
      ],
      structuredContent: {
        links
      }
    };
  }
};
