import type {ToolDefinition} from 'webmcp-polyfill';

export const amazonSearch: ToolDefinition = {
  name: 'amazon-search',
  description: 'Search for products on Amazon. Navigates to Amazon and performs a search with the given query.',
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'The search term to look for on Amazon'
      }
    },
    required: ['query']
  },
  async execute(input, context) {
    const {query} = input as {query: string};
    const {page} = context;

    // Navigate to Amazon if not already there
    const currentUrl = page.url();
    if (!currentUrl.includes('amazon.com')) {
      await page.goto('https://www.amazon.com', {waitUntil: 'domcontentloaded'});
    }

    // Find and fill the search box
    const searchSelectors = [
      '#twotabsearchtextbox',
      'input[name="field-keywords"]',
      '#nav-search-bar-form input[type="text"]',
      'input[aria-label="Search Amazon"]'
    ];

    let searchInput = null;
    for (const selector of searchSelectors) {
      searchInput = await page.$(selector);
      if (searchInput) break;
    }

    if (!searchInput) {
      return {
        content: [
          {
            type: 'text',
            text: 'Error: Could not find Amazon search box. The page may not have loaded correctly or Amazon may be showing a CAPTCHA.'
          }
        ]
      };
    }

    // Clear any existing text and type the search query
    await searchInput.click({clickCount: 3});
    await searchInput.type(query);

    // Submit the search
    const submitSelectors = [
      '#nav-search-submit-button',
      'input[type="submit"][value="Go"]',
      'button[type="submit"]'
    ];

    let submitButton = null;
    for (const selector of submitSelectors) {
      submitButton = await page.$(selector);
      if (submitButton) break;
    }

    if (submitButton) {
      await submitButton.click();
    } else {
      await searchInput.press('Enter');
    }

    // Wait for navigation
    await page.waitForNavigation({waitUntil: 'domcontentloaded'}).catch(() => {});

    return {
      content: [
        {
          type: 'text',
          text: `Searched Amazon for: "${query}". Use amazon-list-results to see the search results.`
        }
      ]
    };
  }
};
