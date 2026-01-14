import {execSync} from 'node:child_process';
import {readFile, readdir, writeFile, unlink} from 'node:fs/promises';
import {resolve, dirname, basename} from 'node:path';
import {fileURLToPath} from 'node:url';
import type {ToolMetadata, ToolRegistryMeta} from '../src/shared.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');
const libDir = resolve(rootDir, 'lib/tools');

const EXCLUDED_GROUPS = ['example-group'];

interface ToolWithMeta extends ToolMetadata {
  groupId: string;
  sourceFile: string;
}

interface KVEntry {
  key: string;
  value: string;
}

async function scanToolsDirectory(): Promise<{
  groups: Map<string, ToolRegistryMeta>;
  tools: Map<string, ToolWithMeta>;
}> {
  const groups = new Map<string, ToolRegistryMeta>();
  const tools = new Map<string, ToolWithMeta>();

  const entries = await readdir(libDir, {withFileTypes: true});
  const groupDirs = entries
    .filter(entry => entry.isDirectory() && !entry.name.startsWith('.'))
    .filter(entry => !EXCLUDED_GROUPS.includes(entry.name))
    .map(entry => entry.name);

  for (const groupName of groupDirs) {
    const groupDir = resolve(libDir, groupName);
    const groupMetaPath = resolve(groupDir, `${groupName}.meta.json`);

    let groupMeta: ToolRegistryMeta;
    try {
      const content = await readFile(groupMetaPath, 'utf-8');
      groupMeta = JSON.parse(content);
    } catch {
      console.warn(`⚠️  Skipping ${groupName}: missing or invalid ${groupName}.meta.json`);
      continue;
    }

    groups.set(groupMeta.id, groupMeta);
    console.log(`✓ Found group: ${groupMeta.id} (${groupMeta.name})`);

    const jsFiles = await glob(['*.js'], {
      cwd: groupDir,
      absolute: false
    });

    for (const jsFile of jsFiles) {
      const toolName = basename(jsFile, '.js');
      const toolMetaPath = resolve(groupDir, `${toolName}.meta.json`);
      const sourceFile = resolve(libDir, groupName, `${toolName}.js`);

      let toolMeta: ToolMetadata;
      try {
        const content = await readFile(toolMetaPath, 'utf-8');
        toolMeta = JSON.parse(content);
      } catch {
        continue;
      }

      // Validate source file exists
      try {
        await readFile(sourceFile);
      } catch {
        console.warn(`  ⚠️  Skipping ${toolMeta.id}: missing built file ${sourceFile}`);
        continue;
      }

      tools.set(toolMeta.id, {
        ...toolMeta,
        groupId: groupMeta.id,
        sourceFile
      });
      console.log(`  ✓ Found tool: ${toolMeta.id}`);
    }
  }

  return {groups, tools};
}

async function buildKVEntries(
  groups: Map<string, ToolRegistryMeta>,
  tools: Map<string, ToolWithMeta>
): Promise<KVEntry[]> {
  const entries: KVEntry[] = [];

  // Add groups
  for (const [id, group] of groups) {
    entries.push({key: `group_${id}`, value: JSON.stringify(group)});
  }

  // Add tools (without sourceFile)
  for (const tool of tools.values()) {
    const {sourceFile, ...meta} = tool;
    entries.push({key: `tool_${tool.id}`, value: JSON.stringify(meta)});
  }

  // Add sources
  for (const tool of tools.values()) {
    const source = await readFile(tool.sourceFile, 'utf-8');
    entries.push({key: `source_${tool.id}`, value: source});
  }

  // Add registry index
  const index = {
    groups: Array.from(groups.keys()),
    tools: Array.from(tools.values()).map(t => ({id: t.id, groupId: t.groupId})),
    lastUpdated: new Date().toISOString()
  };
  entries.push({key: '_registry_index', value: JSON.stringify(index)});

  return entries;
}

async function main(): Promise<void> {
  console.log('🔍 Scanning lib/tools directory...\n');
  const result = await scanToolsDirectory();
  await uploadToKV(result);
}

main().catch((error: Error) => {
  console.error('\n❌ Error:', error.message);
  process.exit(1);
});
