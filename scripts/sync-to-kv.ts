import {readFile, readdir} from 'node:fs/promises';
import {resolve, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
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
      const {$schema: _, ...rest} = JSON.parse(content);
      groupMeta = rest;
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
        const {$schema: _, ...rest} = JSON.parse(content);
        const toolMeta: ToolMetadata = rest;

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
  const baseUrl = process.env.CATALOG_BASE_URL;
  const token = process.env.CATALOG_SERVICE_TOKEN;
  const dryRun = process.env.DRY_RUN === 'true';

  if (dryRun) {
    console.log('\n🏃 DRY RUN MODE - Not uploading\n');
    printSummary(result);
    return;
  }

  if (!baseUrl || !token) {
    console.error('\n❌ Missing required environment variables:');
    console.error('   CATALOG_BASE_URL, CATALOG_SERVICE_TOKEN');
    console.error('\n   Or set DRY_RUN=true to skip upload\n');
    process.exit(1);
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  // Sync groups
  console.log('\n📤 Syncing groups...');
  for (const [id, group] of result.groups) {
    const existing = await fetch(`${baseUrl}/api/groups/${id}`, {headers});
    if (existing.status === 404) {
      const res = await fetch(`${baseUrl}/api/groups/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(group)
      });
      if (res.ok) {
        console.log(`  ✓ ${id} (created)`);
      } else {
        console.error(`  ❌ ${id}: ${res.status} ${await res.text()}`);
        process.exit(1);
      }
    } else if (existing.ok) {
      const {revision, ...current} = await existing.json();
      if (JSON.stringify(current) !== JSON.stringify(group)) {
        const res = await fetch(`${baseUrl}/api/groups/${id}`, {
          method: 'POST',
          headers,
          body: JSON.stringify({...group, revision})
        });
        if (res.ok) {
          console.log(`  ✓ ${id} (updated)`);
        } else {
          console.error(`  ❌ ${id}: ${res.status} ${await res.text()}`);
          process.exit(1);
        }
      } else {
        console.log(`  - ${id} (unchanged)`);
      }
    } else {
      console.error(`  ❌ ${id}: failed to fetch (${existing.status})`);
      process.exit(1);
    }
  }

  // Sync tools
  console.log('\n📤 Syncing tools...');
  for (const [, tool] of result.tools) {
    const {groupId: _, ...toolData} = tool;
    const existing = await fetch(`${baseUrl}/api/tools/${toolData.id}`, {headers});
    if (existing.status === 404) {
      const res = await fetch(`${baseUrl}/api/tools/${toolData.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(toolData)
      });
      if (res.ok) {
        console.log(`  ✓ ${toolData.id} (created)`);
      } else {
        console.error(`  ❌ ${toolData.id}: ${res.status} ${await res.text()}`);
        process.exit(1);
      }
    } else if (existing.ok) {
      const {revision, ...current} = await existing.json();
      if (JSON.stringify(current) !== JSON.stringify(toolData)) {
        const res = await fetch(`${baseUrl}/api/tools/${toolData.id}`, {
          method: 'POST',
          headers,
          body: JSON.stringify({...toolData, revision})
        });
        if (res.ok) {
          console.log(`  ✓ ${toolData.id} (updated)`);
        } else {
          console.error(`  ❌ ${toolData.id}: ${res.status} ${await res.text()}`);
          process.exit(1);
        }
      } else {
        console.log(`  - ${toolData.id} (unchanged)`);
      }
    } else {
      console.error(`  ❌ ${toolData.id}: failed to fetch (${existing.status})`);
      process.exit(1);
    }
  }

  // Sync sources
  console.log('\n📤 Syncing tool sources...');
  const sourceHeaders = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/javascript'
  };
  for (const [toolId, source] of result.sources) {
    const existing = await fetch(`${baseUrl}/api/tools/${toolId}/source`, {
      headers: {Authorization: `Bearer ${token}`}
    });
    if (existing.status === 404) {
      const res = await fetch(`${baseUrl}/api/tools/${toolId}/source`, {
        method: 'PUT',
        headers: sourceHeaders,
        body: source
      });
      if (res.ok) {
        console.log(`  ✓ ${toolId} (created)`);
      } else {
        console.error(`  ❌ ${toolId}: ${res.status} ${await res.text()}`);
        process.exit(1);
      }
    } else if (existing.ok) {
      const current = await existing.text();
      if (current !== source) {
        const res = await fetch(`${baseUrl}/api/tools/${toolId}/source`, {
          method: 'POST',
          headers: sourceHeaders,
          body: source
        });
        if (res.ok) {
          console.log(`  ✓ ${toolId} (updated)`);
        } else {
          console.error(`  ❌ ${toolId}: ${res.status} ${await res.text()}`);
          process.exit(1);
        }
      } else {
        console.log(`  - ${toolId} (unchanged)`);
      }
    } else {
      console.error(`  ❌ ${toolId}: failed to fetch (${existing.status})`);
      process.exit(1);
    }
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
