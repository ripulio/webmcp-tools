import type {ToolDefinition} from 'webmcp-polyfill';

interface Account {
  index: number;
  name: string | null;
  email: string | null;
  hasAvatar: boolean;
}

export const googleSsoGetAccounts: ToolDefinition = {
  name: 'google_sso_get_accounts',
  description:
    'Get the list of available Google accounts on the account chooser page. Returns account names and emails. Use google_sso_select_account to select one.',
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

    // Get account items (exclude "Use another account" option which has mIVEJc class)
    const accountItems = accountList.querySelectorAll('li.aZvCDf:not(.mIVEJc)');

    if (accountItems.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: 'No accounts found on this page. The account list may be empty or the page structure has changed.'
          }
        ],
        isError: true
      };
    }

    const accounts: Account[] = [];

    accountItems.forEach((item, index) => {
      // Name is in div.pGzURd with jsname="V1ur5d"
      const nameEl = item.querySelector('div.pGzURd, [jsname="V1ur5d"]');
      const name = nameEl?.textContent?.trim() || null;

      // Email is in div.yAlK0b with jsname="bQIQze"
      const emailEl = item.querySelector('div.yAlK0b, [jsname="bQIQze"]');
      const email = emailEl?.textContent?.trim() || null;

      // Check for avatar
      const avatarEl = item.querySelector('img.MnFlu');
      const hasAvatar = !!avatarEl;

      accounts.push({
        index,
        name,
        email,
        hasAvatar
      });
    });

    // Check if "Use another account" option exists
    const useAnotherOption = accountList.querySelector('li.aZvCDf.mIVEJc');
    const hasUseAnotherOption = !!useAnotherOption;

    const summary = accounts
      .map((a, i) => `${i}. ${a.name || 'Unknown'} (${a.email || 'no email'})`)
      .join('\n');

    return {
      content: [
        {
          type: 'text',
          text: `Found ${accounts.length} account(s):\n\n${summary}${hasUseAnotherOption ? '\n\nUse google_sso_use_another_account to sign in with a different account.' : ''}`
        }
      ],
      structuredContent: {
        accounts,
        totalAccounts: accounts.length,
        hasUseAnotherOption
      }
    };
  }
};
