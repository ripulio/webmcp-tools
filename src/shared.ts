// Main branch types (schema-based approach)
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

// Google Docs tools types
/**
 * Metadata for a tool, stored separately from the tool implementation.
 * This is used for the tool registry and catalog.
 */
export interface ToolMetadataLegacy {
  /** Unique identifier for the tool (must match filename). */
  name: string;
  /** Human-friendly description for UI/user consumption. */
  userDescription: string;
  /** The domains this tool should be available on. */
  domains: string[];
  /** A regex to run against the URL path to determine if the tool should be available. */
  pathPattern?: string;
}

/**
 * A group of related tools.
 */
export interface ToolGroup {
  /** Unique identifier for the group. */
  name: string;
  /** Description of the group. */
  description: string;
  /** Tool names/IDs that belong to this group. */
  tools: string[];
}
