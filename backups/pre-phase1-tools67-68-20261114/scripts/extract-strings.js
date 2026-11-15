import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const srcDir = path.join(__dirname, '..', 'src');
const outputFilePath = path.join(__dirname, '..', 'public', 'locales', 'en', 'translation.json');

/**
 * Flatten a nested object to a dot-notation key map
 */
function flattenObject(obj, prefix = '') {
  let res = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const propKey = prefix ? `${prefix}.${key}` : key;
      if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
        Object.assign(res, flattenObject(obj[key], propKey));
      } else {
        res[propKey] = obj[key];
      }
    }
  }
  return res;
}

/**
 * Set value in nested object given a dot-notation key array
 */
function setDeep(obj, keys, value) {
  let current = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!current[key] || typeof current[key] !== 'object' || Array.isArray(current[key])) {
      current[key] = {};
    }
    current = current[key];
  }
  const lastKey = keys[keys.length - 1];
  if (!current[lastKey]) {
    current[lastKey] = value;
  }
}

/**
 * Convert string to snake_case slug key
 */
function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '_')
    .substring(0, 40);
}

/**
 * Recursively find all source files in src directory
 */
function getSourceFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;

  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      getSourceFiles(filePath, fileList);
    } else if (/\.(tsx?|jsx?)$/.test(file)) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

/**
 * Extract hardcoded UI strings and t() calls from JSX/TSX files
 */
function extractStrings() {
  console.log('🔍 Scanning src/ directory for hardcoded UI strings and t() calls...');

  const sourceFiles = getSourceFiles(srcDir);
  console.log(`📁 Found ${sourceFiles.length} source files.`);

  let existingTranslations = {};
  if (fs.existsSync(outputFilePath)) {
    try {
      const content = fs.readFileSync(outputFilePath, 'utf8');
      existingTranslations = JSON.parse(content);
      console.log('📄 Loaded existing en/translation.json');
    } catch (err) {
      console.warn('⚠️ Could not parse existing translation.json, starting fresh.', err.message);
    }
  }

  const flattenedExisting = flattenObject(existingTranslations);
  const existingValuesSet = new Set(Object.values(flattenedExisting).map(v => String(v).trim()));
  const existingKeysSet = new Set(Object.keys(flattenedExisting));

  const translations = { ...existingTranslations };
  let extractedTCallsCount = 0;
  let extractedHardcodedCount = 0;

  // 1. Match t("key.name", "Default Text") or t('key.name', 'Default Text')
  const tCallRegex = /t\(\s*["']([^"']+)["']\s*,\s*["']((?:[^"'\\]|\\.)*)["']\s*\)/g;

  // 2. Match hardcoded JSX text content: >Some String<
  const jsxTextRegex = />\s*([A-Za-z0-9][A-Za-z0-9\s,.'!?:;()\/\-]{2,80})\s*</g;

  // 3. Match common JSX attributes with string literals: title="...", placeholder="...", alt="..."
  const jsxAttrRegex = /\b(title|placeholder|alt|aria-label|label)=["']([A-Za-z0-9][A-Za-z0-9\s,.'!?:;()\/\-]{2,80})["']/g;

  for (const filePath of sourceFiles) {
    const code = fs.readFileSync(filePath, 'utf8');

    // Extract explicit t() calls
    let match;
    while ((match = tCallRegex.exec(code)) !== null) {
      const key = match[1];
      const defaultValue = match[2].replace(/\\(["'])/g, '$1');

      if (!existingKeysSet.has(key)) {
        setDeep(translations, key.split('.'), defaultValue);
        existingKeysSet.add(key);
        existingValuesSet.add(defaultValue.trim());
        extractedTCallsCount++;
      }
    }

    // Extract hardcoded JSX text children
    while ((match = jsxTextRegex.exec(code)) !== null) {
      const textVal = match[1].trim();

      // Filter out code keywords, single words that look like tags, or already existing i18n values
      if (
        textVal.length >= 3 &&
        !/^(import|export|const|return|function|class|div|span|button|true|false|null|undefined)$/i.test(textVal) &&
        !existingValuesSet.has(textVal)
      ) {
        const slug = slugify(textVal);
        if (slug) {
          const key = `extracted.${slug}`;
          if (!existingKeysSet.has(key)) {
            setDeep(translations, key.split('.'), textVal);
            existingKeysSet.add(key);
            existingValuesSet.add(textVal);
            extractedHardcodedCount++;
          }
        }
      }
    }

    // Extract JSX string attributes
    while ((match = jsxAttrRegex.exec(code)) !== null) {
      const attrVal = match[2].trim();

      if (attrVal.length >= 3 && !existingValuesSet.has(attrVal)) {
        const slug = slugify(attrVal);
        if (slug) {
          const key = `extracted.attr_${slug}`;
          if (!existingKeysSet.has(key)) {
            setDeep(translations, key.split('.'), attrVal);
            existingKeysSet.add(key);
            existingValuesSet.add(attrVal);
            extractedHardcodedCount++;
          }
        }
      }
    }
  }

  // Ensure target directory exists
  const outputDir = path.dirname(outputFilePath);
  fs.mkdirSync(outputDir, { recursive: true });

  // Save merged JSON
  fs.writeFileSync(outputFilePath, JSON.stringify(translations, null, 2), 'utf8');

  console.log(`✅ Extraction complete:`);
  console.log(`   • ${extractedTCallsCount} t() key references processed`);
  console.log(`   • ${extractedHardcodedCount} new hardcoded JSX strings identified`);
  console.log(`💾 Base translation file saved to: ${path.relative(process.cwd(), outputFilePath)}`);
}

extractStrings();
