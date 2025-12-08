export interface ToolBinding {
  id: string;
  description?: string;
  domains: string[];
  pathFilter?: string;
}

export interface ToolRegistryMeta {
  id: string;
  name: string;
  description: string;
  tools: ToolBinding[];
}
