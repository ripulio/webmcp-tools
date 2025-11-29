import type {ToolDefinition} from 'webmcp-polyfill';

export interface ToolBinding {
  tool: ToolDefinition;
  pathMatches?: (path: string) => boolean;
}

export interface ToolRegistryEntry {
  id: string;
  name: string;
  description: string;
  domains: string[];
  tools: ToolBinding[];
}
