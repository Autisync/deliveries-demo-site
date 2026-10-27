// Copies src/ to dist/ and writes dist/config.js from the environment, so the
// site needs no framework and no install step on Vercel (like the other demo sites).
//
//   CTA_URL_EN   where "Book a call" goes in English (default: autisync.com/book)
//   CTA_URL_PT   in Portuguese (default: autisync.com/pt/marcar)
//   SITE_URL     the site's address, for the link-preview image
//                (default on Vercel: the project's production domain)
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';

rmSync('dist', { recursive: true, force: true });
mkdirSync('dist', { recursive: true });
cpSync('src', 'dist', { recursive: true });

const config = {
  ctaEn: process.env.CTA_URL_EN || 'https://www.autisync.com/book',
  ctaPt: process.env.CTA_URL_PT || 'https://www.autisync.com/pt/marcar',
};
const site = (process.env.SITE_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : '')).replace(/\/$/, '');
if (site) {
  const html = readFileSync('dist/index.html', 'utf8')
    .replace('content="/og.png"', `content="${site}/og.png"`)
    .replace('<meta name="theme-color"', `<meta property="og:url" content="${site}/">\n  <meta name="twitter:card" content="summary_large_image">\n  <meta name="theme-color"`);
  writeFileSync('dist/index.html', html);
}
writeFileSync('dist/config.js', `window.SITE_CONFIG = ${JSON.stringify(config)};\n`);
console.log('Built the Deliveries demo');
