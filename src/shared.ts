export interface ToolBinding {
  id: string;
  description?: string;
  domains: string[];
  pathFilter?: RegExp;
}

export interface ToolRegistryMeta {
  id: string;
  name: string;
  description: string;
  tools: ToolBinding[];
}
