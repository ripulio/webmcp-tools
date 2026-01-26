import {glob} from 'tinyglobby';
import {Ajv, type ValidateFunction} from 'ajv';
import {readFile, access} from 'node:fs/promises';
import {resolve, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');

interface Filter {
  type: string;
  paths?: string[];
}

interface MetaData {
  filters?: Filter[];
  tools?: string[];
}

/**
 * Check if a file exists.
 */
async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate that all tools listed in the meta file exist as .ts files in the same directory.
 */
async function validateToolsExist(
  data: MetaData,
  metaFileDir: string
): Promise<string[]> {
  const errors: string[] = [];

  if (!data.tools) return errors;

  for (const toolId of data.tools) {
    const toolPath = resolve(metaFileDir, `${toolId}.ts`);
    if (!(await fileExists(toolPath))) {
      errors.push(`Tool "${toolId}" not found (expected ${toolPath})`);
    }
  }

  return errors;
}

/**
 * Validate that all patterns in filters are valid regular expressions.
 * Uses the same RegExp constructor that the extension uses at runtime.
 */
function validateRegexPatterns(data: MetaData): string[] {
  const errors: string[] = [];

  if (!data.filters) return errors;

  for (const filter of data.filters) {
    if (filter.type === 'path' && filter.paths) {
      for (const pattern of filter.paths) {
        try {
          new RegExp(pattern);
        } catch (e) {
          errors.push(`"${pattern}": ${(e as Error).message}`);
        }
      }
    }
  }

  return errors;
}

async function validateMetaFiles(): Promise<void> {
  const ajv = new Ajv({
    loadSchema: async (uri: string) => {
      let schemaPath: string;

      if (uri.startsWith('http://') || uri.startsWith('https://')) {
        const filename = uri.split('/').pop()!;
        schemaPath = resolve(rootDir, 'schemas', filename);
      } else {
        schemaPath = resolve(rootDir, 'schemas', uri);
      }

      const content = await readFile(schemaPath, 'utf-8');
      return JSON.parse(content);
    }
  });

  const schemaCache = new Map<string, ValidateFunction>();

  const files = await glob(['src/tools/**/*.meta.json'], {
    cwd: rootDir,
    absolute: true
  });

  let hasErrors = false;

  for (const file of files) {
    const content = await readFile(file, 'utf-8');
    const data = JSON.parse(content);

    if (!data.$schema) {
      hasErrors = true;
      console.error(`\n❌ ${file}`);
      console.error(`   Error: Missing $schema property`);
      continue;
    }

    const metaFileDir = dirname(file);
    const schemaPath = resolve(metaFileDir, data.$schema);

    if (!schemaCache.has(schemaPath)) {
      const schemaContent = await readFile(schemaPath, 'utf-8');
      const schema = JSON.parse(schemaContent);
      const validate = await ajv.compileAsync(schema);
      schemaCache.set(schemaPath, validate);
    }

    const validate = schemaCache.get(schemaPath)!;

    // Remove $schema before validation as it's metadata, not data
    const {$schema, ...dataToValidate} = data;
    const valid = validate(dataToValidate);

    if (!valid) {
      hasErrors = true;
      console.error(`\n❌ ${file}`);
      console.error(`   Schema: ${data.$schema}`);
      console.error(`   Errors:`);
      for (const error of validate.errors ?? []) {
        console.error(`   - ${error.instancePath || '/'} ${error.message}`);
      }
    } else {
      // Validate regex patterns in filters
      const regexErrors = validateRegexPatterns(data);
      // Validate that listed tools exist on disk
      const toolErrors = await validateToolsExist(data, metaFileDir);

      if (regexErrors.length > 0 || toolErrors.length > 0) {
        hasErrors = true;
        console.error(`\n❌ ${file}`);
        if (regexErrors.length > 0) {
          console.error(`   Invalid regex patterns:`);
          for (const error of regexErrors) {
            console.error(`   - ${error}`);
          }
        }
        if (toolErrors.length > 0) {
          console.error(`   Missing tools:`);
          for (const error of toolErrors) {
            console.error(`   - ${error}`);
          }
        }
      } else {
        console.log(`✓ ${file}`);
      }
    }
  }

  if (hasErrors) {
    console.error('\n❌ Metadata validation failed');
    process.exit(1);
  } else {
    console.log(`\n✓ All ${files.length} metadata files are valid`);
  }
}

validateMetaFiles().catch((error: Error) => {
  console.error('Error running validation:', error);
  process.exit(1);
});
