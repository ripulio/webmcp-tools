import type {ToolDefinition} from 'webmcp-polyfill';

export const amazonOpenMenu: ToolDefinition = {
  name: 'amazon_open_menu',
  description:
    'Open the main hamburger navigation menu ("All" menu) on Amazon. This reveals the full category navigation sidebar.',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  },
  async execute() {
    const hamburgerMenu = document.querySelector<HTMLElement>(
      '#nav-hamburger-menu'
    );
    if (!hamburgerMenu) {
      return {
        content: [
          {
            type: 'text',
            text: 'Hamburger menu button not found. Make sure you are on an Amazon page.'
          }
        ],
        isError: true
      };
    }

    hamburgerMenu.click();

    return {
      content: [
        {
          type: 'text',
          text: 'Opening the main navigation menu. Use amazon_get_menu_categories to see available categories.'
        }
      ]
    };
  }
};
