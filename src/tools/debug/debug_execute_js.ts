import type {ToolDefinition} from 'webmcp-polyfill';

interface ExecuteJsParams {
  code: string;
}

export const tool: ToolDefinition = {
  name: 'debug_execute_js',
  description:
    'Execute JavaScript code in the page context. Use to interact with elements (click, type, scroll), read values, or modify the DOM. The code is wrapped in an async function, so you can use await.',
  inputSchema: {
    type: 'object',
    properties: {
      code: {
        type: 'string',
        description: 'JavaScript code to execute. Can use await. Last expression is returned.'
      }
    },
    required: ['code']
  },
  async execute(params: unknown) {
    const {code} = params as ExecuteJsParams;
    try {
      // Wrap in async function to support await, evaluate last expression
      const wrappedCode = `(async () => { return ${code} })()`;
      // eslint-disable-next-line no-eval
      const result = await eval(wrappedCode);

      // Serialize result for display
      let serialized: string;
      let resultType: string;

      if (result === undefined) {
        serialized = 'undefined';
        resultType = 'undefined';
      } else if (result === null) {
        serialized = 'null';
        resultType = 'null';
      } else if (result instanceof Element) {
        serialized = `<${result.tagName.toLowerCase()}${result.id ? ' id="' + result.id + '"' : ''}>`;
        resultType = 'Element';
      } else if (result instanceof NodeList || result instanceof HTMLCollection) {
        serialized = `[${result.length} elements]`;
        resultType = 'NodeList';
      } else {
        try {
          serialized = JSON.stringify(result, null, 2);
          resultType = typeof result;
        } catch {
          serialized = String(result);
          resultType = typeof result;
        }
      }

      return {
        content: [{type: 'text', text: `Result (${resultType}): ${serialized}`}],
        structuredContent: {result: serialized, type: resultType}
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        content: [{type: 'text', text: `Error: ${message}`}],
        structuredContent: {result: '', type: 'error', error: message},
        isError: true
      };
    }
  }
};
