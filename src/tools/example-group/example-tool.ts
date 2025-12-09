import type {ToolDefinition} from 'webmcp-polyfill';

export const exampleTool: ToolDefinition = {
  name: 'example-tool',
  description: 'An example tool for demonstration purposes.',
  inputSchema: {
    type: 'object',
    properties: {
      text: {
        type: 'string',
        description: 'The text to be processed by the example tool.'
      }
    },
    required: ['text']
  },
  async execute(input) {
    const {text} = input as {text: string};
    return {
      content: [
        {
          type: 'text',
          text: `You provided the following text: ${text}`
        }
      ]
    };
  }
};
