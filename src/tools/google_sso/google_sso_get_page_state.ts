import type {ToolDefinition} from 'webmcp-polyfill';

export const googleSsoGetPageState: ToolDefinition = {
  name: 'google_sso_get_page_state',
  description:
    'Detect the current state of the Google SSO page. Returns the page type (account_chooser, email_input, password_input, or unknown) and relevant information about the current state.',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  },
  async execute() {
    // Check for account chooser page
    const headingText = document.querySelector('#headingText')?.textContent?.trim();
    const accountList = document.querySelector('ul.Dl08I');

    if (headingText?.toLowerCase().includes('choose an account') && accountList) {
      const accounts = accountList.querySelectorAll('li.aZvCDf:not(.mIVEJc)');
      return {
        content: [
          {
            type: 'text',
            text: `Page state: account_chooser\nHeading: "${headingText}"\nAvailable accounts: ${accounts.length}\n\nUse google_sso_get_accounts to list accounts, or google_sso_select_account to select one.`
          }
        ],
        structuredContent: {
          pageState: 'account_chooser',
          heading: headingText,
          accountCount: accounts.length
        }
      };
    }

    // Check for email input page
    const emailInput = document.querySelector<HTMLInputElement>('input[type="email"]');
    if (emailInput || headingText?.toLowerCase().includes('sign in')) {
      return {
        content: [
          {
            type: 'text',
            text: `Page state: email_input\nHeading: "${headingText || 'Sign in'}"\n\nCredential entry required. The tool will not enter credentials.`
          }
        ],
        structuredContent: {
          pageState: 'email_input',
          heading: headingText || 'Sign in',
          requiresCredentials: true
        }
      };
    }

    // Check for password input page
    const passwordInput = document.querySelector<HTMLInputElement>('input[type="password"]');
    if (passwordInput) {
      const identifierEl = document.querySelector('[data-identifier], [data-email]');
      const identifier = identifierEl?.getAttribute('data-identifier') ||
                        identifierEl?.getAttribute('data-email') ||
                        document.querySelector('#profileIdentifier')?.textContent?.trim();
      return {
        content: [
          {
            type: 'text',
            text: `Page state: password_input\nAccount: ${identifier || 'Unknown'}\n\nCredential entry required. The tool will not enter credentials.`
          }
        ],
        structuredContent: {
          pageState: 'password_input',
          identifier: identifier || null,
          requiresCredentials: true
        }
      };
    }

    // Check for 2FA/verification page
    const verificationHeadings = ['2-step verification', 'verify', 'confirm'];
    if (headingText && verificationHeadings.some(v => headingText.toLowerCase().includes(v))) {
      return {
        content: [
          {
            type: 'text',
            text: `Page state: verification\nHeading: "${headingText}"\n\nAdditional verification required. The tool cannot complete this step.`
          }
        ],
        structuredContent: {
          pageState: 'verification',
          heading: headingText,
          requiresUserAction: true
        }
      };
    }

    // Unknown state
    return {
      content: [
        {
          type: 'text',
          text: `Page state: unknown\nHeading: "${headingText || 'None detected'}"\nURL: ${window.location.href}\n\nCould not determine page state. This may not be a Google SSO page.`
        }
      ],
      structuredContent: {
        pageState: 'unknown',
        heading: headingText || null,
        url: window.location.href
      }
    };
  }
};
