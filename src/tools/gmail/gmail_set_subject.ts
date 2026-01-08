import type {ToolDefinition} from 'webmcp-polyfill';

export const tool: ToolDefinition = {
  name: 'gmail_set_subject',
  description:
    'Set the subject line in the Gmail compose dialog. The compose dialog must be open first.',
  inputSchema: {
    type: 'object',
    properties: {
      subject: {
        type: 'string',
        description: 'The email subject line'
      }
    },
    required: ['subject']
  },
  async execute(input) {
    const {subject} = input as {subject: string};

    // Find the subject input field
    const subjectInput = document.querySelector<HTMLInputElement>(
      'input[name="subjectbox"]'
    );

    if (!subjectInput) {
      return {
        content: [
          {
            type: 'text',
            text: 'Subject field not found. Make sure the compose dialog is open.'
          }
        ],
        isError: true
      };
    }

    // Focus and set the value
    subjectInput.focus();
    subjectInput.value = subject;

    // Dispatch events to trigger Gmail's handlers
    subjectInput.dispatchEvent(new Event('input', {bubbles: true}));
    subjectInput.dispatchEvent(new Event('change', {bubbles: true}));

    return {
      content: [{type: 'text', text: `Subject set to: ${subject}`}]
    };
  }
};
