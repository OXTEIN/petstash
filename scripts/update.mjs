// Stashio — refreshes the Adopt Me pet list and rebuilds index.html.
import fs from 'node:fs';
import { chromium } from 'playwright';

const URL = 'https://www.playadopt.me/discover/pets';

const browser = await chromium.launch();
let json;
try {
  const page = await browser.newPage({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36'
  });
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  json = await page.$eval('#__NEXT_DATA__', el => el.textContent);
} finally {
  await browser.close();
}

const data = JSON.parse(json);
let list = data?.props?.pageProps?.data?.petsList;
if (!Array.isArray(list)) { console.error('petsList not found'); process.exit(1); }

list = list.filter(p => p.should_be_hidden_from_public !== 'Yes');
const seen = new Set();
const pets = [];
for (const p of list) {
  if (!p.name || seen.has(p.name)) continue;
  seen.add(p.name);
  pets.push({ n: p.name, r: p.rarity, t: p.thumbnail });
}
pets.sort((a, b) => a.n.localeCompare(b.n));

if (pets.length < 100) { console.error('Only ' + pets.length + ' pets — aborting.'); process.exit(1); }

const tpl = fs.readFileSync('template.html', 'utf8');
if (!tpl.includes('__PETS_JSON__')) { console.error('template.html missing __PETS_JSON__'); process.exit(1); }

fs.writeFileSync('pets.json', JSON.stringify(pets));
fs.writeFileSync('index.html', tpl.replace('__PETS_JSON__', JSON.stringify(pets)));
console.log('Updated —', pets.length, 'pets');
