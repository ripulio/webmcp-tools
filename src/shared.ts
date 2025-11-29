import type {ToolDefinition} from 'webmcp-polyfill';

export interface ToolBinding {
  tool: ToolDefinition;
  pathPattern?: string;
}

export interface ToolRegistryEntry {
  id: string;
  name: string;
  version: string;
  description: string;
  domains: string[];
  tools: ToolBinding[];
}
