import * as esbuild from 'esbuild';
import {writeFile, mkdir, readdir} from 'node:fs/promises';
import {join, dirname, basename} from 'node:path';
import {fileURLToPath} from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

// Config from environment variables
const BASE_URL = process.env.BASE_URL || '';
const OUTPUT_MODE = process.env.OUTPUT_MODE || 'separate';

interface ManifestTool {
  source?: string;
  sourceUrl?: string;
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

  return result.outputFiles[0].text;
}

function extractToolFromBundle(
  bundledCode: string,
  registryExportName: string,
  toolIndex: number
): string {
  // The bundled code assigns exports to ___bundle
  // Access the tool via the registry entry's tools array
  return `(function(){${bundledCode};return ___bundle.${registryExportName}.tools[${toolIndex}].tool;})()`;
}

async function buildManifest() {
  // Import the compiled main module to get tool registry entries
  const mainModule = await import(join(rootDir, 'lib/main.js'));

  // Find all exported tool registry entries
  const entries: Array<{
    id: string;
    name: string;
    version: string;
    description: string;
    domains: string[];
    tools: Array<{
      tool: {name: string};
      pathPattern?: string;
    }>;
    sourceFile: string;
    exportName: string;
  }> = [];

  // Map of tool IDs to their source files and export names
  const toolSources: Record<string, {file: string; exportName: string}> = {
    'google-sheets': {
      file: 'src/tools/google-sheets.ts',
      exportName: 'googleSheetsTools'
    }
  };

  for (const [exportName, value] of Object.entries(mainModule)) {
    if (
      value &&
      typeof value === 'object' &&
      'id' in value &&
      'tools' in value
    ) {
      const entry = value as {
        id: string;
        name: string;
        version: string;
        description: string;
        domains: string[];
        tools: Array<{tool: {name: string}; pathPattern?: string}>;
      };

      const sourceInfo = toolSources[entry.id];
      if (sourceInfo) {
        entries.push({
          ...entry,
          sourceFile: sourceInfo.file,
          exportName: sourceInfo.exportName
        });
      }
    }
  }

  const manifest: Manifest = {
    version: '1.0.0',
    generatedAt: new Date().toISOString(),
    registry: []
  };

  if (OUTPUT_MODE === 'separate' && BASE_URL) {
    manifest.baseUrl = BASE_URL;
  }

  await mkdir(join(rootDir, 'dist'), {recursive: true});

  for (const entry of entries) {
    const manifestEntry: ManifestEntry = {
      id: entry.id,
      name: entry.name,
      version: entry.version,
      description: entry.description,
      domains: entry.domains,
      tools: []
    };

    // Bundle the entire tool file once
    const bundledCode = await bundleToolFile(join(rootDir, entry.sourceFile));

    for (let i = 0; i < entry.tools.length; i++) {
      const binding = entry.tools[i];
      const toolName = binding.tool.name;

      // Extract tool via registry entry's tools array - no string-based lookup needed
      const toolSource = extractToolFromBundle(bundledCode, entry.exportName, i);

      if (OUTPUT_MODE === 'inline') {
        manifestEntry.tools.push({
          source: toolSource,
          pathPattern: binding.pathPattern
        });
      } else {
        // Write separate file
        const toolDir = join(rootDir, 'dist', 'tools', entry.id);
        await mkdir(toolDir, {recursive: true});

        const toolFileName = `${toolName}.js`;
        await writeFile(join(toolDir, toolFileName), toolSource);

        manifestEntry.tools.push({
          sourceUrl: `/tools/${entry.id}/${toolFileName}`,
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

  console.log(`Manifest written to dist/manifest.json`);
  console.log(`  Mode: ${OUTPUT_MODE}`);
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
