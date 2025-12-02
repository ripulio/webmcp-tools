import * as esbuild from 'esbuild';
import {writeFile, mkdir, readdir} from 'node:fs/promises';
import {join, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

interface ToolRegistryEntry {
  name: string;
  description: string;
  domains: string[];
  pathPattern?: string;
}

function isToolBinding(value: unknown): value is ToolRegistryEntry {
  return (
    value != null &&
    typeof value === 'object' &&
    'name' in value &&
    'description' in value &&
    'domains' in value &&
    Array.isArray((value as ToolRegistryEntry).domains)
  );
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
  // Scan src/tools/ directory for tool files
  const toolsDir = join(rootDir, 'src/tools');
  const toolFiles = await readdir(toolsDir);
  const tsFiles = toolFiles.filter(
    (f) => f.endsWith('.ts') && !f.endsWith('.d.ts') && !f.endsWith('.test.ts')
  );

  const entries: ToolRegistryEntry[] = [];

  for (const toolFile of tsFiles) {
    const modulePath = join(
      rootDir,
      'lib/tools',
      toolFile.replace('.ts', '.js')
    );
    const toolModule = await import(modulePath);

    if (isToolBinding(toolModule.tool)) {
      entries.push({
        name: toolModule.tool.name,
        description: toolModule.tool.description,
        domains: toolModule.tool.domains,
        pathPattern: toolModule.tool.pathPattern
      });
    }
  }

  await mkdir(join(rootDir, 'dist/tools'), {recursive: true});

  for (const entry of entries) {
    const toolSourcePath = join(rootDir, 'src/tools', `${entry.name}.ts`);
    const toolSource = await bundleToolFile(toolSourcePath);

    const toolFileName = `${entry.name}.js`;
    await writeFile(join(rootDir, 'dist/tools', toolFileName), toolSource);
  }

  await writeFile(
    join(rootDir, 'dist/index.json'),
    JSON.stringify(entries, null, 2)
  );

  console.log(`Manifest written to dist/index.json`);
  console.log(`  Tools: ${entries.length}`);
}

buildManifest().catch((err) => {
  console.error('Build failed:', err);
  process.exit(1);
});
