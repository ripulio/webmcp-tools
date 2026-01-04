import type {ToolDefinition} from 'webmcp-polyfill';

export const tool: ToolDefinition = {
  name: 'allrecipes_print_recipe',
  description:
    'Click the print button to open the print-friendly version of the current recipe.',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  },
  async execute() {
    // Check if we're on a recipe page
    if (!window.location.pathname.includes('/recipe/')) {
      return {
        content: [
          {
            type: 'text',
            text: 'Not on a recipe page. Navigate to a recipe first.'
          }
        ],
        isError: true
      };
    }

    const title =
      document.querySelector('h1.article-heading')?.textContent?.trim() ||
      'this recipe';

    // Find the print button
    const printWrapper = document.querySelector(
      '.mm-recipes-social-share__print-wrapper'
    );
    const printButton = printWrapper?.querySelector(
      'button'
    ) as HTMLButtonElement | null;

    if (!printButton) {
      return {
        content: [
          {
            type: 'text',
            text: 'Could not find print button on this page.'
          }
        ],
        isError: true
      };
    }

    // Click the print button
    printButton.click();

    return {
      content: [
        {
          type: 'text',
          text: `Triggered print dialog for "${title}". The browser's print dialog should now be open.`
        }
      ]
    };
  }
};
