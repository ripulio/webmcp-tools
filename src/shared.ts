import {ToolDefinition} from 'webmcp-polyfill';

export interface ToolBindingInfo extends Omit<
  Omit<ToolDefinition, 'inputSchema'>,
  'execute'
> {
  /**
   * A regex to run against the URL path to determine if the tool should be available.
   */
  pathPattern?: string;
  /**
   * The domains this tool should be available on.
   */
  domains: string[];
}

export interface ToolBinding extends ToolDefinition {
  /**
   * A regex to run against the URL path to determine if the tool should be available.
   */
  pathPattern?: string;
  /**
   * The domains this tool should be available on.
   */
  domains: string[];
}
