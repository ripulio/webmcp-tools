import * as esbuild from 'esbuild';
import {writeFile, mkdir, readdir, access} from 'node:fs/promises';
import {join, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

// Config from environment variables
const BASE_URL = process.env.BASE_URL || '';

interface ManifestTool {
  name: string;
  description: string;
  pathPattern?: string;
}

interface ManifestEntry {
  id: string;
  name: string;
  version: string;
  description: string;
  domains: string[];
  tools: ManifestTool[];
}

interface Manifest {
  version: string;
  baseUrl?: string;
  generatedAt: string;
  registry: ManifestEntry[];
}

interface ToolRegistryEntry {
  id: string;
  name: string;
  version: string;
  description: string;
  domains: string[];
  tools: Array<{name: string; description: string; pathPattern?: string}>;
}

function isToolRegistryEntry(value: unknown): value is ToolRegistryEntry {
  return (
    value != null &&
    typeof value === 'object' &&
    'id' in value &&
    'tools' in value &&
    'domains' in value &&
    Array.isArray((value as ToolRegistryEntry).tools)
  );
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function bundleToolFile(toolFilePath: string): Promise<string> {
  const result = await esbuild.build({
    entryPoints: [toolFilePath],
    bundle: true,
    write: false,
    format: 'iife',
    globalName: '___bundle',
    platform: 'browser',
    minify: true,
    target: 'es2022',
    external: ['webmcp-polyfill']
  });

  const bundledCode = result.outputFiles[0].text;

  // Wrap to return the exported tool directly
  return `(function(){${bundledCode};return ___bundle.tool;})()`;
}

async function buildManifest() {
  // Scan src/servers/ directory for server files
  const serversDir = join(rootDir, 'src/servers');
  const serverFiles = await readdir(serversDir);
  const tsFiles = serverFiles.filter(
    (f) => f.endsWith('.ts') && !f.endsWith('.d.ts')
  );

  // Discover registry entries from server files
  const entries: Array<{entry: ToolRegistryEntry}> = [];

  for (const serverFile of tsFiles) {
    const modulePath = join(
      rootDir,
      'lib/servers',
      serverFile.replace('.ts', '.js')
    );
    const serverModule = await import(modulePath);

    for (const [, value] of Object.entries(serverModule)) {
      if (isToolRegistryEntry(value)) {
        entries.push({entry: value});
      }
    }
  }

  const manifest: Manifest = {
    version: '1.0.0',
    generatedAt: new Date().toISOString(),
    registry: []
  };

  if (BASE_URL) {
    manifest.baseUrl = BASE_URL;
  }

  await mkdir(join(rootDir, 'dist'), {recursive: true});

  for (const {entry} of entries) {
    const manifestEntry: ManifestEntry = {
      id: entry.id,
      name: entry.name,
      version: entry.version,
      description: entry.description,
      domains: entry.domains,
      tools: []
    };

    for (const binding of entry.tools) {
      const toolName = binding.name;

      // Find tool source file using naming convention: src/tools/<tool.name>.ts
      const toolSourcePath = join(rootDir, 'src/tools', `${toolName}.ts`);

      if (!(await fileExists(toolSourcePath))) {
        throw new Error(
          `Tool source file not found: ${toolSourcePath}\n` +
            `Expected file named "${toolName}.ts" for tool with name "${toolName}"`
        );
      }

      // Bundle just this tool file
      const toolSource = await bundleToolFile(toolSourcePath);

      // Write to dist
      const toolDir = join(rootDir, 'dist', 'tools', entry.id);
      await mkdir(toolDir, {recursive: true});

      const toolFileName = `${toolName}.js`;
      await writeFile(join(toolDir, toolFileName), toolSource);

      manifestEntry.tools.push({
        name: binding.name,
        description: binding.description,
        pathPattern: binding.pathPattern
      });
    }

    manifest.registry.push(manifestEntry);
  }

  await writeFile(
    join(rootDir, 'dist/manifest.json'),
    JSON.stringify(manifest, null, 2)
  );

  console.log(`Manifest written to dist/manifest.json`);
  console.log(`  Base URL: ${BASE_URL || '(none)'}`);
  console.log(`  Tool groups: ${manifest.registry.length}`);
  console.log(
    `  Total tools: ${manifest.registry.reduce((sum, e) => sum + e.tools.length, 0)}`
  );
}

buildManifest().catch((err) => {
  console.error('Build failed:', err);
  process.exit(1);
});
