// Copies the data the app shares with the website into mobile/assets/*.json, so both stay in step.
// Run after changing any of these website files:  node mobile/tool/export_web_data.mjs
//   client/src/context/LanguageContext.jsx   → i18n.json        (23 languages)
//   client/src/data/indiaDistricts.js        → india_districts.json
//   client/src/pages/public/Legal.jsx        → legal.json       (Privacy Policy, Terms of Use)
//   client/src/pages/parent/DietPlan.jsx     → diet_plans.json
//   client/src/components/ChatBot.jsx +
//   client/src/data/chatbotKnowledge.js      → chatbot.json     (greetings, suggestions, offline answers)
//   client/src/pages/public/shopShared.jsx   → shop.json
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const write = (name, data) => fs.writeFileSync(path.join(root, 'mobile/assets', name), JSON.stringify(data));
// literal between `marker` and the first `end` after it, evaluated as JS
const literal = (src, marker, end) => {
  const a = src.indexOf(marker);
  if (a < 0) throw new Error(`not found: ${marker}`);
  return new Function(`return ${src.slice(a + marker.length, src.indexOf(end, a) + end.length - 1)}`)(); // drop the trailing ';'
};

// i18n
{
  const src = read('client/src/context/LanguageContext.jsx');
  const fnStart = src.indexOf('export function normalizeText');
  const normalizeSrc = src.slice(fnStart, src.indexOf('export const LANGUAGES')).replace('export ', '');
  const langSrc = src.slice(src.indexOf('export const LANGUAGES'), src.indexOf('}));', src.indexOf('export const LANGUAGES')) + 4).replace('export ', '');
  const tableSrc = src.slice(src.indexOf('const T = {'), src.indexOf('function translate('));
  const mojibake = src.match(/const MOJIBAKE_RE = .*;/)[0];
  const { LANGUAGES, T, normalizeText } = new Function(`${mojibake}\n${normalizeSrc}\n${langSrc}\n${tableSrc}\nreturn { LANGUAGES, T, normalizeText };`)();
  const strings = Object.fromEntries(Object.entries(T).map(([l, d]) => [l, Object.fromEntries(Object.entries(d).map(([k, v]) => [k, normalizeText(v)]))]));
  write('i18n.json', { languages: LANGUAGES.map(({ code, label, locale }) => ({ code, label, locale: locale[0] })), strings });
}

// districts
{
  const d = await import(pathToFileURL(path.join(root, 'client/src/data/indiaDistricts.js')).href);
  write('india_districts.json', { states: d.INDIA_STATES, districts: d.INDIA_DISTRICTS });
}

// legal pages
{
  const src = read('client/src/pages/public/Legal.jsx');
  const head = `${src.match(/const UPDATED = .*;/)[0]}\n${src.match(/const CONTACT = .*;/)[0]}`;
  const arr = (n) => src.slice(src.indexOf(`const ${n} = [`), src.indexOf('];', src.indexOf(`const ${n} = [`)) + 2);
  write('legal.json', new Function(`${head}\n${arr('privacy')}\n${arr('terms')}\nreturn { updated: UPDATED, privacy, terms };`)());
}

// diet plans
{
  const src = read('client/src/pages/parent/DietPlan.jsx');
  write('diet_plans.json', {
    ageGroups: literal(src, 'const AGE_GROUPS = ', '\n];'),
    plans: literal(src, 'export const DIET_PLANS = ', '\n};'),
    superfoods: literal(src, 'const SUPERFOODS = ', '\n];'),
  });
}

// chatbot
{
  const src = read('client/src/components/ChatBot.jsx');
  const kb = (await import(pathToFileURL(path.join(root, 'client/src/data/chatbotKnowledge.js')).href)).default;
  write('chatbot.json', {
    knowledge: kb.map(({ intent, patterns, response }) => ({ intent, patterns, response })),
    greetings: literal(src, 'const LANG_GREETINGS = ', '\n};'),
    suggestions: literal(src, 'const LANG_SUGGESTIONS = ', '\n};'),
    speech: literal(src, 'const LANGUAGE_TO_SPEECH_CODE = ', '};'),
  });
}

// shop catalogue
{
  const src = read('client/src/pages/public/shopShared.jsx');
  write('shop.json', { categories: literal(src, 'export const CATEGORIES = ', '\n];'), products: literal(src, 'export const PRODUCTS = ', '\n];') });
}

console.log('mobile/assets updated from the website sources');
