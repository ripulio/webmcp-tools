# WebMCP Tool Registry - Publishing Pipeline

## Goal
Enable `webmcp-tools` repo to publish tools that can be consumed by `web-mcp-extension`. Focus on webmcp-tools first.

## Current State

**webmcp-tools** (`/Users/eoghan/repos/webmcp-tools`):
- Tools defined as TypeScript with actual `execute` functions
- `ToolRegistryEntry` interface: `{id, name, description, domains, tools: ToolBinding[]}`
- `ToolBinding`: `{tool: ToolDefinition, pathMatches?: (path) => boolean}`
- Has CI workflows for npm publishing on release

**web-mcp-extension** expects:
- `ToolRegistryResult`: `{id, name, description, domains, tools: ToolSource[]}`
- `ToolSource`: `{source: string, pathPattern?: string}` (JS code as string, regex as string)
- Uses `new Function('return ' + tool.source)` to instantiate tools

## Key Transformation Required

| webmcp-tools (source) | Extension (target) |
|-----------------------|-------------------|
| `tool: ToolDefinition` (object) | `source: string` (bundled JS) |
| `pathMatches: (path) => bool` (function) | `pathPattern: string` (regex) |

---

## Phase 1: Update Tool Authoring Format

### 1.1 Change `pathMatches` to `pathPattern`

**File: `src/shared.ts`**

```typescript
// Before
export interface ToolBinding {
  tool: ToolDefinition;
  pathMatches?: (path: string) => boolean;
}

// After
export interface ToolBinding {
  tool: ToolDefinition;
  pathPattern?: string;  // Regex string, e.g. "^/spreadsheets/"
}
```

### 1.2 Update existing tools

**File: `src/tools/google-sheets.ts`**

```typescript
// Before
tools: [
  { tool: getContentTool, pathMatches: (path) => path.startsWith('/spreadsheets/') },
  { tool: setCellValueTool, pathMatches: (path) => path.startsWith('/spreadsheets/') }
]

// After
tools: [
  { tool: getContentTool, pathPattern: '^/spreadsheets/' },
  { tool: setCellValueTool, pathPattern: '^/spreadsheets/' }
]
```

---

## Phase 2: Build Script for Manifest Generation

### 2.1 Add dependencies

**File: `package.json`**

```json
{
  "devDependencies": {
    "esbuild": "^0.25.0"
  },
  "scripts": {
    "build:manifest": "node --experimental-strip-types scripts/build-manifest.ts"
  }
}
```

### 2.2 Create build script

**File: `scripts/build-manifest.ts`**

The script must:
1. Import compiled tool modules from `lib/`
2. For each tool, bundle it into a self-contained IIFE string using esbuild
3. Output manifest.json (and optionally separate .js files)

```typescript
import * as esbuild from 'esbuild';
import { writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

// Config passed via CLI or env
const BASE_URL = process.env.BASE_URL || '';
const OUTPUT_MODE = process.env.OUTPUT_MODE || 'inline'; // 'inline' | 'separate'

interface ManifestEntry {
  id: string;
  name: string;
  description: string;
  domains: string[];
  tools: Array<{
    source?: string;      // For inline mode
    sourceUrl?: string;   // For separate mode
    pathPattern?: string;
  }>;
}

async function bundleTool(toolFilePath: string, toolExportName: string): Promise<string> {
  // Create virtual entry that exports just this tool
  const result = await esbuild.build({
    stdin: {
      contents: `import { ${toolExportName} } from '${toolFilePath}'; export default ${toolExportName};`,
      loader: 'ts',
      resolveDir: rootDir
    },
    bundle: true,
    write: false,
    format: 'iife',
    globalName: '___tool',
    platform: 'browser',
    minify: true,
    target: 'es2022'
  });

  // Extract tool object from IIFE wrapper
  const code = result.outputFiles[0].text;
  // Returns: (function(){...;var ___tool={...};})() - we need to return ___tool
  return `(function(){${code.replace(/;$/, '')};return ___tool.default;})()`;
}

async function buildManifest() {
  // Dynamic import of compiled modules
  const { googleSheetsTools } = await import('../lib/main.js');
  const entries = [googleSheetsTools]; // Add more as tools are added

  const manifest: { version: string; baseUrl?: string; generatedAt: string; registry: ManifestEntry[] } = {
    version: '1.0.0',
    generatedAt: new Date().toISOString(),
    registry: []
  };

  if (OUTPUT_MODE === 'separate') {
    manifest.baseUrl = BASE_URL;
  }

  await mkdir(join(rootDir, 'dist/tools'), { recursive: true });

  for (const entry of entries) {
    const manifestEntry: ManifestEntry = {
      id: entry.id,
      name: entry.name,
      description: entry.description,
      domains: entry.domains,
      tools: []
    };

    for (const binding of entry.tools) {
      const toolName = binding.tool.name;
      const bundled = await bundleTool(
        join(rootDir, 'src/tools/google-sheets.ts'), // TODO: dynamic path
        toolName === 'google_sheets_get_content' ? 'getContentTool' : 'setCellValueTool'
      );

      if (OUTPUT_MODE === 'inline') {
        manifestEntry.tools.push({
          source: bundled,
          pathPattern: binding.pathPattern
        });
      } else {
        // Write separate file
        const toolPath = `tools/${entry.id}/${toolName}.js`;
        await writeFile(join(rootDir, 'dist', toolPath), bundled);
        manifestEntry.tools.push({
          sourceUrl: `/${toolPath}`,
          pathPattern: binding.pathPattern
        });
      }
    }

    manifest.registry.push(manifestEntry);
  }

  await writeFile(
    join(rootDir, 'dist/manifest.json'),
    JSON.stringify(manifest, null, 2)
  );

  console.log(`Manifest written to dist/manifest.json (mode: ${OUTPUT_MODE})`);
}

buildManifest();
```

---

## Phase 3: CI/CD Workflow

### GitHub Pages Setup (One-time)

1. Go to repo Settings → Pages
2. Set Source to "GitHub Actions"
3. That's it - no branch configuration needed

### Workflow for Separate Files + GitHub Pages

**File: `.github/workflows/publish-registry.yml`**

```yaml
name: Publish Tool Registry

on:
  push:
    branches: [main]

# Required for GitHub Pages deployment
permissions:
  contents: read
  pages: write
  id-token: write

# Only one deployment at a time
concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 22.x
          cache: npm

      - run: npm ci
      - run: npm run build
      - run: npm run build:manifest
        env:
          OUTPUT_MODE: separate
          # GitHub Pages URL is predictable: https://<owner>.github.io/<repo>
          BASE_URL: https://${{ github.repository_owner }}.github.io/${{ github.event.repository.name }}

      - uses: actions/configure-pages@v4

      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist/

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

### Alternative: Inline Manifest (Simpler)

For inline mode, you can use the same workflow but change:
```yaml
- run: npm run build:manifest
  env:
    OUTPUT_MODE: inline
    # No BASE_URL needed for inline
```

---

## Manifest Format Options

### Option A: Inline Manifest

All tool source code embedded in single `manifest.json`:

```json
{
  "version": "1.0.0",
  "generatedAt": "2024-11-29T12:00:00Z",
  "registry": [
    {
      "id": "google-sheets",
      "name": "Google Sheets",
      "description": "Tools for reading and writing Google Sheets content",
      "domains": ["docs.google.com"],
      "tools": [
        {
          "source": "(function(){...bundled code...;return ___tool.default;})()",
          "pathPattern": "^/spreadsheets/"
        }
      ]
    }
  ]
}
```

**Pros**: Single fetch, simple hosting, atomic updates
**Cons**: File size grows with tools, all-or-nothing updates

### Option B: Separate Files with GitHub Pages

Manifest contains metadata + URLs, source in separate `.js` files hosted on GitHub Pages.

#### Why GitHub Pages Works Well

1. **Predictable URLs**: The base URL is always `https://<owner>.github.io/<repo>/`
   - Known at build time - no chicken-and-egg problem
   - Stable - URLs don't change unless you rename the repo

2. **CORS enabled**: GitHub Pages serves with `Access-Control-Allow-Origin: *`
   - Extension can fetch tool files directly

3. **Free CDN**: GitHub Pages is backed by Fastly CDN
   - Good caching, global distribution

4. **Atomic deploys**: All files deploy together
   - No version skew between manifest and tool files

#### URL Structure

```
https://ripulio.github.io/webmcp-tools/
├── manifest.json
└── tools/
    └── google-sheets/
        ├── google_sheets_get_content.js
        └── google_sheets_set_cell_value.js
```

#### Manifest Format

```json
{
  "version": "1.0.0",
  "baseUrl": "https://ripulio.github.io/webmcp-tools",
  "generatedAt": "2024-11-29T12:00:00Z",
  "registry": [
    {
      "id": "google-sheets",
      "name": "Google Sheets",
      "description": "Tools for reading and writing Google Sheets content",
      "domains": ["docs.google.com"],
      "tools": [
        {
          "sourceUrl": "/tools/google-sheets/google_sheets_get_content.js",
          "pathPattern": "^/spreadsheets/"
        }
      ]
    }
  ]
}
```

The extension resolves full URLs: `baseUrl + sourceUrl` = `https://ripulio.github.io/webmcp-tools/tools/google-sheets/google_sheets_get_content.js`

#### Extension Fetch Flow

```
1. Fetch manifest.json (~2KB)
   └── Display tool groups in settings panel (metadata only)

2. User enables "Google Sheets" tool group
   └── Fetch each tool's .js file in parallel
       ├── GET /tools/google-sheets/google_sheets_get_content.js
       └── GET /tools/google-sheets/google_sheets_set_cell_value.js

3. Store resolved tools in chrome.storage.local
   └── Tools cached locally, no refetch needed until version changes
```

#### Versioning Strategy

For cache invalidation, two options:

**Option 1: Version in manifest** (recommended)
```json
{
  "version": "1.2.0",
  "registry": [...]
}
```
Extension compares stored version vs fetched version, refetches tools if changed.

**Option 2: Version in URL path**
```
https://ripulio.github.io/webmcp-tools/v1/manifest.json
https://ripulio.github.io/webmcp-tools/v1/tools/...
```
Requires extension to handle version discovery.

**Pros**: Small manifest (~2KB), lazy loading, per-tool caching, scalable, predictable URLs
**Cons**: Multiple HTTP requests on first enable, requires GitHub Pages setup

---

## Output Structure

### Inline Mode
```
dist/
  manifest.json          # Contains all source code inline
```

### Separate Mode
```
dist/
  manifest.json          # Contains metadata + sourceUrls
  tools/
    google-sheets/
      google_sheets_get_content.js
      google_sheets_set_cell_value.js
```

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/shared.ts` | Modify | Change `pathMatches` to `pathPattern` |
| `src/tools/google-sheets.ts` | Modify | Update to use `pathPattern` regex |
| `scripts/build-manifest.ts` | Create | Build script for manifest generation |
| `package.json` | Modify | Add esbuild, add `build:manifest` script |
| `.github/workflows/publish-registry.yml` | Create | CI workflow for publishing |

---

## Future: Extension Integration

Once webmcp-tools publishes manifests, the extension will need:
1. Update `tool-registry.ts` to fetch from remote URL(s)
2. Support both inline and separate file formats
3. Cache manifests in `chrome.storage.local`
4. Handle lazy fetching for separate files mode

This is out of scope for the current phase (webmcp-tools first).
