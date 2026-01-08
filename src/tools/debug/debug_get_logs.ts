import type {ToolDefinition} from 'webmcp-polyfill';

declare global {
  interface Window {
    __webmcp_debug_logs: Array<{timestamp: number; level: string; args: unknown[]}>;
    __webmcp_original_console_log: typeof console.log | undefined;
  }
}

export const tool: ToolDefinition = {
  name: 'debug_get_logs',
  description:
    'Get all console.log, console.warn, and console.error calls collected since debug_start_collecting was called. Returns timestamps, level, and arguments for each call. Does not clear logs.',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  },
  async execute() {
    if (!window.__webmcp_original_console_log) {
      return {
        content: [
          {
            type: 'text',
            text: 'Log collection has not been started. Call debug_start_collecting first.'
          }
        ],
        isError: true
      };
    }

    const logs = window.__webmcp_debug_logs || [];

    if (logs.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: 'No logs collected yet.'
          }
        ],
        structuredContent: {
          logs: [],
          count: 0
        }
      };
    }

    // Format logs for display
    const formattedLogs = logs.map((entry) => {
      const date = new Date(entry.timestamp);
      const timeStr = date.toISOString();
      const argsStr = entry.args
        .map((arg) => {
          try {
            return typeof arg === 'string' ? arg : JSON.stringify(arg);
          } catch {
            return String(arg);
          }
        })
        .join(' ');
      const level = (entry.level || 'log').toUpperCase();
      return `[${timeStr}] [${level}] ${argsStr}`;
    });

    return {
      content: [
        {
          type: 'text',
          text: `Collected ${logs.length} log(s):\n\n${formattedLogs.join('\n')}`
        }
      ],
      structuredContent: {
        logs: logs,
        count: logs.length
      }
    };
  }
};
