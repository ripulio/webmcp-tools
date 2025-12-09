export interface DomainFilter {
  type: 'domain';
  domains: string[];
}

export interface PathFilter {
  type: 'path';
  patterns: string[];
}

export type ToolFilter = DomainFilter | PathFilter;

export interface ToolMetadata {
  id: string;
  description?: string;
  filters?: ToolFilter[];
}

export interface ToolRegistryMeta {
  id: string;
  name: string;
  description: string;
  tools: string[];
}
