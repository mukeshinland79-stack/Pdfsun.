import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const localesDir = path.join(__dirname, '..', 'public', 'locales');
const enFilePath = path.join(localesDir, 'en', 'translation.json');

const targetLanguages = [
  'en', 'hi', 'es', 'fr', 'ar', 'pt', 'ru', 'bn', 'ur', 'id',
  'de', 'ja', 'ko', 'tr', 'vi', 'it', 'te', 'ta', 'mr', 'gu',
  'kn', 'ml', 'pa', 'zh', 'zh-CN', 'zh-TW', 'th', 'pl', 'nl', 'fa', 'uk'
];

if (!fs.existsSync(enFilePath)) {
  console.error('Error: en/translation.json not found at ' + enFilePath);
  process.exit(1);
}

const enContent = fs.readFileSync(enFilePath, 'utf8');

console.log(`Creating locale directories and translation.json files for ${targetLanguages.length} target languages...`);

for (const lang of targetLanguages) {
  const langDir = path.join(localesDir, lang);
  const filePath = path.join(langDir, 'translation.json');

  if (!fs.existsSync(langDir)) {
    fs.mkdirSync(langDir, { recursive: true });
  }

  // Write base/placeholder translation.json if it doesn't exist or ensure populated
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, enContent, 'utf8');
    console.log(`  ✓ Created ${lang}/translation.json`);
  } else {
    console.log(`  • ${lang}/translation.json already exists, keeping current contents`);
  }
}

console.log('✅ All 30 target language translation files generated successfully in public/locales/');
