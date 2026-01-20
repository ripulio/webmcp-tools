import type {ToolDefinition} from 'webmcp-polyfill';

export const tool: ToolDefinition = {
  name: 'zendesk_update_status',
  description: 'Update the status of the current ticket and optionally submit',
  inputSchema: {
    type: 'object',
    properties: {
      status: {
        type: 'string',
        description:
          'The new status (e.g., "new", "open", "pending", "hold", "solved", "closed")'
      },
      submit: {
        type: 'boolean',
        description:
          'Whether to submit the ticket after changing status. Defaults to false.'
      }
    },
    required: ['status']
  },
  async execute(input) {
    const {status, submit = false} = input as {
      status: string;
      submit?: boolean;
    };
    const normalizedStatus = status.toLowerCase();

    // Click the submit menu button to open status options
    const submitMenuBtn = document.querySelector<HTMLElement>(
      '[data-test-id="submit_button-menu-button"]'
    );

    if (!submitMenuBtn) {
      return {
        content: [
          {
            type: 'text',
            text: 'Submit button not found. Make sure a ticket is open.'
          }
        ],
        isError: true
      };
    }

    // Open the dropdown menu
    submitMenuBtn.click();
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Find and click the status option
    const menuItems = document.querySelectorAll(
      '[role="menuitem"], [role="option"]'
    );
    let found = false;

    for (const item of menuItems) {
      const itemText = item.textContent?.toLowerCase().trim() || '';
      if (itemText.includes(normalizedStatus)) {
        (item as HTMLElement).click();
        found = true;
        break;
      }
    }

    if (!found) {
      // Close the menu if we didn't find the status
      document.body.click();
      return {
        content: [
          {
            type: 'text',
            text: `Status option "${status}" not found. Available statuses may vary by your Zendesk configuration.`
          }
        ],
        isError: true
      };
    }

    // If submit is true, click the main submit button
    if (submit) {
      await new Promise((resolve) => setTimeout(resolve, 200));
      const submitBtn = document.querySelector<HTMLElement>(
        '[data-test-id="submit_button-button"]'
      );
      if (submitBtn) {
        submitBtn.click();
        return {
          content: [{type: 'text', text: `Ticket submitted as "${status}".`}]
        };
      }
    }

    return {
      content: [
        {
          type: 'text',
          text: `Status set to "${status}". Click Submit to save changes.`
        }
      ]
    };
  }
};
