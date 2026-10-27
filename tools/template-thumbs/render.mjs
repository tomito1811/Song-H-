// Render ảnh thumbnail (600x800) & preview (1200x1600) cho từng mẫu trong bộ sưu tập cao cấp.
// Cách dùng:  npx vite --port 5199 &   rồi   node tools/template-thumbs/render.mjs [slug...]
// Cần 'playwright' và 'sharp' (cài tạm: npm i --no-save playwright sharp && npx playwright install chromium).
import fs from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const sharp = require('sharp');

const BASE = process.env.THUMB_URL || 'http://localhost:5199/tools/template-thumbs/index.html';
const OUT = 'public/assets/templates';
fs.mkdirSync(OUT, { recursive: true });
const want = process.argv.slice(2);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1400, height: 1000 }, deviceScaleFactor: 2 });
await page.goto(BASE, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(800);
const slugs = await page.$$eval('[data-slug]', (els) => els.map((e) => e.getAttribute('data-slug')));
for (const slug of slugs) {
  if (want.length && !want.includes(slug)) continue;
  const el = await page.$(`[data-slug="${slug}"]`);
  const png = await el.screenshot({ type: 'png' });
  await sharp(png).resize(1200, 1600).webp({ quality: 86 }).toFile(`${OUT}/${slug}-preview.webp`);
  await sharp(png).resize(600, 800).webp({ quality: 82 }).toFile(`${OUT}/${slug}-thumb.webp`);
  console.log('✓', slug);
}
await browser.close();
