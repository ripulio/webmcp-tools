import {glob} from 'tinyglobby';
import {readFile, writeFile, mkdir} from 'node:fs/promises';
import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');

async function copyAssets(): Promise<void> {
  // Find all .meta.json files in src/
  const files = await glob(['src/**/*.meta.json'], {
    cwd: rootDir
  });

  for (const file of files) {
    // src/tools/slack/slack.meta.json → lib/tools/slack/slack.meta.json
    const destPath = file.replace(/^src\//, 'lib/');
    const destDir = dirname(resolve(rootDir, destPath));

    await mkdir(destDir, {recursive: true});

    // Remove $schema since it wont resolve to anything valid at runtime
    // for now.
    const content = await readFile(resolve(rootDir, file), 'utf-8');
    const json = JSON.parse(content);
    delete json.$schema;
    await writeFile(resolve(rootDir, destPath), JSON.stringify(json, null, 2) + '\n');
  }

  console.log(`✓ Copied ${files.length} asset files to lib/`);
}

copyAssets().catch((error: Error) => {
  console.error('Error copying assets:', error);
  process.exit(1);
});
