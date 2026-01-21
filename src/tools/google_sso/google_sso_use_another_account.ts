import type {ToolDefinition} from 'webmcp-polyfill';

export const googleSsoUseAnotherAccount: ToolDefinition = {
  name: 'google_sso_use_another_account',
  description:
    'Click the "Use another account" option on the Google account chooser page. This navigates to the email input page where credentials can be entered. The tool will NOT enter credentials.',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  },
  async execute() {
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

    // Find the "Use another account" option (has mIVEJc class)
    const useAnotherItem = accountList.querySelector('li.aZvCDf.mIVEJc');
    if (!useAnotherItem) {
      return {
        content: [
          {
            type: 'text',
            text: '"Use another account" option not found on this page. This option may not be available.'
          }
        ],
        isError: true
      };
    }

    // Find the clickable element
    const clickableEl = useAnotherItem.querySelector<HTMLElement>(
      'div.VV3oRb[role="link"]'
    );
    if (!clickableEl) {
      return {
        content: [
          {
            type: 'text',
            text: 'Could not find clickable element for "Use another account". The page structure may have changed.'
          }
        ],
        isError: true
      };
    }

    // Click the option
    clickableEl.click();

    return {
      content: [
        {
          type: 'text',
          text: 'Clicked "Use another account". The page will navigate to the email input page.\n\nCredential entry required. The tool will not enter credentials. Use google_sso_get_page_state to confirm the page state.'
        }
      ],
      structuredContent: {
        action: 'use_another_account_clicked',
        requiresCredentials: true
      }
    };
  }
};
