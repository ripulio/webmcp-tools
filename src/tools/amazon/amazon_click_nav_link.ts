import type {ToolDefinition} from 'webmcp-polyfill';

export const amazonClickNavLink: ToolDefinition = {
  name: 'amazon_click_nav_link',
  description:
    'Click on a navigation link in Amazon\'s main navigation bar by its text (e.g., "Today\'s Deals", "Gift Cards", "Customer Service").',
  inputSchema: {
    type: 'object',
    properties: {
      linkText: {
        type: 'string',
        description:
          'The text of the navigation link to click (case-insensitive, partial match supported)'
      }
    },
    required: ['linkText']
  },
  async execute(input) {
    const {linkText} = input as {linkText: string};

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

    const searchText = linkText.toLowerCase();
    let targetLink: HTMLAnchorElement | null = null;

    for (const link of navLinks) {
      const text = link.textContent?.trim().toLowerCase() || '';
      if (text === searchText || text.includes(searchText)) {
        targetLink = link;
        break;
      }
    }

    if (!targetLink) {
      const availableLinks = Array.from(navLinks)
        .map((l) => l.textContent?.trim())
        .filter(Boolean)
        .join(', ');

      return {
        content: [
          {
            type: 'text',
            text: `Navigation link "${linkText}" not found. Available links: ${availableLinks}`
          }
        ],
        isError: true
      };
    }

    const clickedText = targetLink.textContent?.trim() || linkText;
    targetLink.click();

    return {
      content: [
        {
          type: 'text',
          text: `Navigating to: ${clickedText}`
        }
      ]
    };
  }
};
