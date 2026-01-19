import type {ToolDefinition} from 'webmcp-polyfill';

export const tool: ToolDefinition = {
  name: 'zendesk_add_tags',
  description: 'Add tags to the current ticket',
  inputSchema: {
    type: 'object',
    properties: {
      tags: {
        type: 'array',
        items: {type: 'string'},
        description: 'Array of tags to add to the ticket'
      }
    },
    required: ['tags']
  },
  async execute(input) {
    const {tags} = input as {tags: string[]};

    if (!tags || tags.length === 0) {
      return {
        content: [{type: 'text', text: 'No tags provided.'}],
        isError: true
      };
    }

    // Find and click the tags multiselect to open it
    const tagsField = document.querySelector<HTMLElement>(
      '[data-test-id="ticket-system-field-tags-multiselect"]'
    );

    if (!tagsField) {
      return {
        content: [{type: 'text', text: 'Tags field not found. Make sure a ticket is open.'}],
        isError: true
      };
    }

    // Click to focus/open the field
    tagsField.click();
    await new Promise(resolve => setTimeout(resolve, 200));

    // Find the input within the tags field
    const tagsInput = tagsField.querySelector<HTMLInputElement>('input') ||
      document.querySelector<HTMLInputElement>('[data-test-id="ticket-fields-tags"] input');

    if (!tagsInput) {
      return {
        content: [{type: 'text', text: 'Tags input not found.'}],
        isError: true
      };
    }

    const addedTags: string[] = [];

    for (const tag of tags) {
      // Focus and type the tag
      tagsInput.focus();
      tagsInput.value = tag;
      tagsInput.dispatchEvent(new Event('input', {bubbles: true}));

      // Wait for autocomplete
      await new Promise(resolve => setTimeout(resolve, 200));

      // Press Enter to add the tag
      tagsInput.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'Enter',
        code: 'Enter',
        keyCode: 13,
        which: 13,
        bubbles: true
      }));

      await new Promise(resolve => setTimeout(resolve, 150));
      addedTags.push(tag);
    }

    return {
      content: [{type: 'text', text: `Added ${addedTags.length} tag(s): ${addedTags.join(', ')}. Remember to submit the ticket to save changes.`}]
    };
  }
};
