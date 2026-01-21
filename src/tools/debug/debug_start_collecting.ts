import type {ToolDefinition} from 'webmcp-polyfill';

declare global {
  interface Window {
    __webmcp_debug_logs: Array<{
      timestamp: number;
      level: string;
      args: unknown[];
    }>;
    __webmcp_original_console_log: typeof console.log | undefined;
    __webmcp_original_console_warn: typeof console.warn | undefined;
    __webmcp_original_console_error: typeof console.error | undefined;
  }
}

export const tool: ToolDefinition = {
  name: 'debug_start_collecting',
  description:
    'Start collecting console.log, console.warn, and console.error calls. Captures all logged messages while still passing them through to the original console.',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  },
  async execute() {
    // Wipe previous logs
    window.__webmcp_debug_logs = [];

    // If already collecting, just return
    if (window.__webmcp_original_console_log) {
      return {
        content: [
          {
            type: 'text',
            text: 'Cleared logs. Still collecting.'
          }
        ]
      };
    }

    // Store original console methods
    window.__webmcp_original_console_log = console.log;
    window.__webmcp_original_console_warn = console.warn;
    window.__webmcp_original_console_error = console.error;

    // Override console.log
    console.log = (...args: unknown[]) => {
      window.__webmcp_debug_logs.push({
        timestamp: Date.now(),
        level: 'log',
        args: args
      });
      window.__webmcp_original_console_log?.apply(console, args);
    };

    // Override console.warn
    console.warn = (...args: unknown[]) => {
      window.__webmcp_debug_logs.push({
        timestamp: Date.now(),
        level: 'warn',
        args: args
      });
      window.__webmcp_original_console_warn?.apply(console, args);
    };

    // Override console.error
    console.error = (...args: unknown[]) => {
      window.__webmcp_debug_logs.push({
        timestamp: Date.now(),
        level: 'error',
        args: args
      });
      window.__webmcp_original_console_error?.apply(console, args);
    };

    return {
      content: [
        {
          type: 'text',
          text: 'Started collecting console.log, console.warn, and console.error calls. Use debug_get_logs to retrieve collected logs.'
        }
      ]
    };
  }
};
