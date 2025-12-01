import {ToolDefinition} from 'webmcp-polyfill';

export interface ToolBindingInfo extends Omit<
  Omit<ToolDefinition, 'inputSchema'>,
  'execute'
> {
  /**
   * A regex to run against the URL path to determine if the tool should be available.
   */
  pathPattern?: string;
}

export interface ToolBinding extends ToolDefinition {
  /**
   * A regex to run against the URL path to determine if the tool should be available.
   */
  pathPattern?: string;
}

export interface DomainToolServer {
  id: string;
  name: string;
  version: string;
  description: string;
  domains: string[];
  tools: ToolBindingInfo[];
}
