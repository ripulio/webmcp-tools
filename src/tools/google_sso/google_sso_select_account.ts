import type {ToolDefinition} from 'webmcp-polyfill';

export const googleSsoSelectAccount: ToolDefinition = {
  name: 'google_sso_select_account',
  description:
    'Select a Google account from the account chooser page. Specify either the index (0-based) or email address. This will click the account to proceed with sign-in.',
  inputSchema: {
    type: 'object',
    properties: {
      index: {
        type: 'number',
        description:
          'The index of the account to select (0-based). Use google_sso_get_accounts to see available indices.'
      },
      email: {
        type: 'string',
        description:
          'The email address of the account to select. Alternative to using index.'
      }
    },
    required: []
  },
  async execute(input) {
    const {index, email} = input as {index?: number; email?: string};

    if (index === undefined && !email) {
      return {
        content: [
          {
            type: 'text',
            text: 'Either index or email must be provided. Use google_sso_get_accounts to see available accounts.'
          }
        ],
        isError: true
      };
    }

    // Check if we're on the account chooser page
    const accountList = document.querySelector('ul.Dl08I');
    if (!accountList) {
      return {
        content: [
          {
            type: 'text',
            text: 'Account list not found. Make sure you are on the Google account chooser page. Use google_sso_get_page_state to check the current page state.'
          }
        ],
        isError: true
      };
    }

    // Get account items (exclude "Use another account" option)
    const accountItems = accountList.querySelectorAll('li.aZvCDf:not(.mIVEJc)');

    if (accountItems.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: 'No accounts found on this page.'
          }
        ],
        isError: true
      };
    }

    let targetItem: Element | null = null;
    let selectedEmail: string | null = null;
    let selectedName: string | null = null;

    if (index !== undefined) {
      // Select by index
      if (index < 0 || index >= accountItems.length) {
        return {
          content: [
            {
              type: 'text',
              text: `Invalid index: ${index}. Valid indices are 0 to ${accountItems.length - 1}.`
            }
          ],
          isError: true
        };
      }
      targetItem = accountItems[index];
    } else if (email) {
      // Select by email
      const emailLower = email.toLowerCase();
      for (const item of accountItems) {
        const emailEl = item.querySelector('div.yAlK0b, [jsname="bQIQze"]');
        const itemEmail = emailEl?.textContent?.trim()?.toLowerCase();
        if (itemEmail === emailLower) {
          targetItem = item;
          break;
        }
      }

      if (!targetItem) {
        return {
          content: [
            {
              type: 'text',
              text: `Account with email "${email}" not found. Use google_sso_get_accounts to see available accounts.`
            }
          ],
          isError: true
        };
      }
    }

    if (!targetItem) {
      return {
        content: [
          {
            type: 'text',
            text: 'Could not find the target account.'
          }
        ],
        isError: true
      };
    }

    // Get account info for response
    const nameEl = targetItem.querySelector('div.pGzURd, [jsname="V1ur5d"]');
    selectedName = nameEl?.textContent?.trim() || null;
    const emailEl = targetItem.querySelector('div.yAlK0b, [jsname="bQIQze"]');
    selectedEmail = emailEl?.textContent?.trim() || null;

    // Find the clickable element within the account item
    const clickableEl = targetItem.querySelector<HTMLElement>(
      'div.VV3oRb[role="link"]'
    );
    if (!clickableEl) {
      return {
        content: [
          {
            type: 'text',
            text: 'Could not find clickable element for the account. The page structure may have changed.'
          }
        ],
        isError: true
      };
    }

    // Click the account
    clickableEl.click();

    return {
      content: [
        {
          type: 'text',
          text: `Selected account: ${selectedName || 'Unknown'} (${selectedEmail || 'no email'})\n\nThe page will navigate to the next step. Use google_sso_get_page_state to check if password entry is required.`
        }
      ],
      structuredContent: {
        action: 'account_selected',
        name: selectedName,
        email: selectedEmail
      }
    };
  }
};
