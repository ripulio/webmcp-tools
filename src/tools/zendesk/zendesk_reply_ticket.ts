import type {ToolDefinition} from 'webmcp-polyfill';

export const tool: ToolDefinition = {
  name: 'zendesk_reply_ticket',
  description: 'Add a reply to the current ticket',
  inputSchema: {
    type: 'object',
    properties: {
      message: {
        type: 'string',
        description: 'The reply message content'
      },
      internal: {
        type: 'boolean',
        description: 'Whether this is an internal note (true) or public reply (false). Defaults to false.'
      }
    },
    required: ['message']
  },
  async execute(input) {
    const {message, internal = false} = input as {message: string; internal?: boolean};

    // Switch channel if needed using the channel switcher
    if (internal) {
      const channelSwitcher = document.querySelector<HTMLElement>(
        '[data-test-id="omnichannel-channel-switcher-button"]'
      );
      if (channelSwitcher) {
        channelSwitcher.click();
        await new Promise(resolve => setTimeout(resolve, 200));

        // Look for internal note option in the menu
        const internalOption = document.querySelector<HTMLElement>(
          '[data-test-id="omnichannel-channel-switcher-menu"] [data-value="internal"],' +
          '[role="option"]:has-text("Internal note")'
        );
        if (internalOption) {
          internalOption.click();
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }
    }

    // Find the CKEditor rich text editor
    const editor = document.querySelector<HTMLElement>(
      '[data-test-id="omnicomposer-rich-text-ckeditor"]'
    );

    if (!editor) {
      return {
        content: [{type: 'text', text: 'Reply composer not found. Make sure a ticket is open.'}],
        isError: true
      };
    }

    // Focus the editor
    editor.focus();

    // Clear existing content and set new message
    // CKEditor uses contenteditable, so we set innerHTML
    editor.innerHTML = `<p>${message.replace(/\n/g, '</p><p>')}</p>`;

    // Dispatch input event to notify CKEditor of the change
    editor.dispatchEvent(new Event('input', {bubbles: true}));

    const replyType = internal ? 'internal note' : 'public reply';
    return {
      content: [{type: 'text', text: `${replyType.charAt(0).toUpperCase() + replyType.slice(1)} composed. Click Submit to send, or use zendesk_update_status to submit with a status change.`}]
    };
  }
};
