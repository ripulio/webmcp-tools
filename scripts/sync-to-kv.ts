import {readFile, readdir} from 'node:fs/promises';
import {resolve, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import Cloudflare from 'cloudflare';
import type {ToolMetadata, ToolRegistryMeta} from '../src/shared.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');
const libDir = resolve(rootDir, 'lib/tools');

interface SyncResult {
  groups: Map<string, ToolRegistryMeta>;
  tools: Map<string, ToolMetadata & {groupId: string}>;
  sources: Map<string, string>; // toolId -> JS source code
}

async function scanToolsDirectory(): Promise<SyncResult> {
  const groups = new Map<string, ToolRegistryMeta>();
  const tools = new Map<string, ToolMetadata & {groupId: string}>();
  const sources = new Map<string, string>();

  const entries = await readdir(libDir, {withFileTypes: true});
  const groupDirs = entries
    .filter(entry => entry.isDirectory() && !entry.name.startsWith('.'))
    .map(entry => entry.name);

  for (const groupName of groupDirs) {
    const groupDir = resolve(libDir, groupName);
    const groupMetaPath = resolve(groupDir, `${groupName}.meta.json`);

    let groupMeta: ToolRegistryMeta;

    try {
      const content = await readFile(groupMetaPath, 'utf-8');
      groupMeta = JSON.parse(content);
    } catch (error) {
      console.warn(`⚠️  Skipping ${groupName}: missing or invalid ${groupName}.meta.json`);
      continue;
    }

    groups.set(groupMeta.id, groupMeta);
    console.log(`✓ Found group: ${groupMeta.id} (${groupMeta.name})`);

    const toolIds = groupMeta.tools ?? [];

    for (const toolId of toolIds) {
      const toolMetaPath = resolve(groupDir, `${toolId}.meta.json`);
      const toolJsPath = resolve(groupDir, `${toolId}.js`);

      try {
        const content = await readFile(toolMetaPath, 'utf-8');
        const toolMeta: ToolMetadata = JSON.parse(content);

        tools.set(`${groupMeta.id}:${toolMeta.id}`, {
          ...toolMeta,
          groupId: groupMeta.id
        });
        console.log(`  ✓ Found tool: ${toolMeta.id}`);

        // Read the JS source file
        const jsSource = await readFile(toolJsPath, 'utf-8');
        sources.set(toolMeta.id, jsSource);
        console.log(`    ✓ Found source: ${toolId}.js`);
      } catch (error) {
        console.warn(`  ⚠️  Skipping tool ${toolId} in group ${groupName}: missing or invalid ${toolId}.meta.json or ${toolId}.js`);
        continue;
      }
    }
  }

  return {groups, tools, sources};
}

async function uploadToKV(result: SyncResult): Promise<void> {
  const accountId = process.env.CF_ACCOUNT_ID;
  const namespaceId = process.env.CF_KV_NAMESPACE_ID;
  const apiToken = process.env.CF_API_TOKEN;
  const dryRun = process.env.CF_DRY_RUN === 'true';

  if (dryRun) {
    console.log('\n🏃 DRY RUN MODE - Not uploading to KV\n');
    printSummary(result);
    return;
  }

  if (!accountId || !namespaceId || !apiToken) {
    console.error('\n❌ Missing required environment variables:');
    console.error('   CF_ACCOUNT_ID, CF_KV_NAMESPACE_ID, CF_API_TOKEN');
    console.error('\n   Or set CF_DRY_RUN=true to skip upload\n');
    process.exit(1);
  }

  const client = new Cloudflare({apiToken});

  // Upload groups
  console.log('\n📤 Uploading groups to KV...');
  for (const [id, group] of result.groups) {
    const key = `group_${id}`;

    try {
      await client.kv.namespaces.values.update(
        namespaceId,
        key,
        {
          account_id: accountId,
          value: JSON.stringify(group)
        }
      );

      console.log(`  ✓ Uploaded group: ${key}`);
    } catch (error) {
      console.error(`  ❌ Failed to upload ${key}:`, error);
      throw error;
    }
  }

  // Upload tools
  console.log('\n📤 Uploading tools to KV...');
  for (const [, tool] of result.tools) {
    const key = `tool_${tool.id}`;

    try {
      await client.kv.namespaces.values.update(
        namespaceId,
        key,
        {
          account_id: accountId,
          value: JSON.stringify(tool)
        }
      );

      console.log(`  ✓ Uploaded tool: ${key}`);
    } catch (error) {
      console.error(`  ❌ Failed to upload ${key}:`, error);
      throw error;
    }
  }

  // Upload sources
  console.log('\n📤 Uploading tool sources to KV...');
  for (const [toolId, source] of result.sources) {
    const key = `source_${toolId}`;

    try {
      await client.kv.namespaces.values.update(
        namespaceId,
        key,
        {
          account_id: accountId,
          value: source // Raw string, not JSON
        }
      );

      console.log(`  ✓ Uploaded source: ${key}`);
    } catch (error) {
      console.error(`  ❌ Failed to upload ${key}:`, error);
      throw error;
    }
  }

  // Upload an index for easier querying (optional but recommended)
  const index = {
    groups: Array.from(result.groups.keys()),
    tools: Array.from(result.tools.values()).map(t => ({
      id: t.id,
      groupId: t.groupId
    })),
    lastUpdated: new Date().toISOString()
  };

  try {
    await client.kv.namespaces.values.update(
      namespaceId,
      '_registry_index',
      {
        account_id: accountId,
        value: JSON.stringify(index)
      }
    );

    console.log('\n  ✓ Uploaded registry index: _registry_index');
  } catch (error) {
    console.error('  ❌ Failed to upload index:', error);
    throw error;
  }

  printSummary(result);
}

function printSummary(result: SyncResult): void {
  console.log('\n📊 Summary:');
  console.log(`   Groups:  ${result.groups.size}`);
  console.log(`   Tools:   ${result.tools.size}`);
  console.log(`   Sources: ${result.sources.size}`);
  console.log('\n✅ Sync completed successfully\n');
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
