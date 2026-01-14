export interface DomainFilter {
  type: 'domain';
  domains: string[];
}

export interface PathFilter {
  type: 'path';
  paths: string[];
}

export interface QueryFilter {
  type: 'query';
  parameters: Record<string, string>;
}

export type ToolFilter = DomainFilter | PathFilter | QueryFilter;

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
