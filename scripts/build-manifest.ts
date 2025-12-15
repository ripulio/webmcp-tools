import * as esbuild from 'esbuild';
import {writeFile, mkdir, readdir, readFile} from 'node:fs/promises';
import {join, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import type {ToolMetadata, ToolGroup} from '../src/shared.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

function isToolMetadata(value: unknown): value is ToolMetadata {
  return (
    value != null &&
    typeof value === 'object' &&
    'name' in value &&
    typeof (value as ToolMetadata).name === 'string' &&
    'userDescription' in value &&
    typeof (value as ToolMetadata).userDescription === 'string' &&
    'domains' in value &&
    Array.isArray((value as ToolMetadata).domains)
  );
}

function isToolGroup(value: unknown): value is ToolGroup {
  return (
    value != null &&
    typeof value === 'object' &&
    'name' in value &&
    typeof (value as ToolGroup).name === 'string' &&
    'description' in value &&
    typeof (value as ToolGroup).description === 'string' &&
    'tools' in value &&
    Array.isArray((value as ToolGroup).tools)
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
  // Scan src/tools/ for tool files
  const toolsDir = join(rootDir, 'src/tools');
  const toolFiles = await readdir(toolsDir);
  const tsFiles = toolFiles.filter(
    (f) => f.endsWith('.ts') && !f.endsWith('.d.ts') && !f.endsWith('.test.ts')
  );
  const toolNames = new Set(tsFiles.map((f) => f.replace('.ts', '')));

  // Scan src/tools/metadata/ for metadata files
  const metadataDir = join(rootDir, 'src/tools/metadata');
  let metadataFiles: string[] = [];
  try {
    metadataFiles = (await readdir(metadataDir)).filter((f) =>
      f.endsWith('.json')
    );
  } catch {
    throw new Error(`Metadata directory not found: ${metadataDir}`);
  }
  const metadataNames = new Set(metadataFiles.map((f) => f.replace('.json', '')));

  // Validation: check for mismatches
  const errors: string[] = [];

  for (const metaName of metadataNames) {
    if (!toolNames.has(metaName)) {
      errors.push(
        `Metadata file exists without matching tool source: ${metaName}.json`
      );
    }
  }

  for (const toolName of toolNames) {
    if (!metadataNames.has(toolName)) {
      errors.push(
        `Tool source file exists without matching metadata: ${toolName}.ts`
      );
    }
  }

  if (errors.length > 0) {
    throw new Error(`Validation failed:\n  ${errors.join('\n  ')}`);
  }

  // Load and validate metadata files
  const validatedTools: Array<{name: string; metadata: ToolMetadata}> = [];

  for (const metaFile of metadataFiles) {
    const metaPath = join(metadataDir, metaFile);
    const metaContent = await readFile(metaPath, 'utf-8');
    const metadata = JSON.parse(metaContent);

    if (!isToolMetadata(metadata)) {
      throw new Error(`Invalid metadata format in ${metaFile}`);
    }

    const expectedName = metaFile.replace('.json', '');
    if (metadata.name !== expectedName) {
      throw new Error(
        `Metadata name mismatch in ${metaFile}: expected "${expectedName}", got "${metadata.name}"`
      );
    }

    validatedTools.push({name: metadata.name, metadata});
  }

  // Create output directories
  await mkdir(join(rootDir, 'dist/tools'), {recursive: true});
  await mkdir(join(rootDir, 'dist/groups'), {recursive: true});

  // Bundle tools and write metadata
  for (const {name, metadata} of validatedTools) {
    const toolSourcePath = join(rootDir, 'src/tools', `${name}.ts`);
    const toolSource = await bundleToolFile(toolSourcePath);

    // Write bundled tool
    await writeFile(join(rootDir, 'dist/tools', `${name}.js`), toolSource);

    // Write metadata
    await writeFile(
      join(rootDir, 'dist/tools', `${name}.json`),
      JSON.stringify(metadata, null, 2)
    );
  }

  // Process groups
  const groupsDir = join(rootDir, 'src/groups');
  let groupFiles: string[] = [];
  try {
    groupFiles = (await readdir(groupsDir)).filter((f) => f.endsWith('.json'));
  } catch {
    // Groups directory is optional
    groupFiles = [];
  }

  const toolNameSet = new Set(validatedTools.map((t) => t.name));
  const allGroups: ToolGroup[] = [];

  for (const groupFile of groupFiles) {
    const groupPath = join(groupsDir, groupFile);
    const groupContent = await readFile(groupPath, 'utf-8');
    const group = JSON.parse(groupContent);

    if (!isToolGroup(group)) {
      throw new Error(`Invalid group format in ${groupFile}`);
    }

    // Validate tool references
    const invalidTools = group.tools.filter((t: string) => !toolNameSet.has(t));
    if (invalidTools.length > 0) {
      throw new Error(
        `Group "${group.name}" references non-existent tools: ${invalidTools.join(', ')}`
      );
    }

    allGroups.push(group);

    // Copy group to dist/groups/
    await writeFile(
      join(rootDir, 'dist/groups', groupFile),
      JSON.stringify(group, null, 2)
    );
  }

  // Write combined groups index
  await writeFile(
    join(rootDir, 'dist/groups.json'),
    JSON.stringify(allGroups, null, 2)
  );

  console.log(`Build complete:`);
  console.log(`  Tools: ${validatedTools.length}`);
  console.log(`  Groups: ${groupFiles.length}`);
}

buildManifest().catch((err) => {
  console.error('Build failed:', err);
  process.exit(1);
});
