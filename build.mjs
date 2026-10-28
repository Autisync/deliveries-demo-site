// Copies src/ to dist/ and writes dist/config.js (the merchant website) and
// dist/demo/config.js (the deliveries simulation at /demo/), so the site
// needs no framework and no install step on Vercel.
//
//   CRM_API_URL   defaults to https://api.autisync.com/api
//   CRM_APP_URL   defaults to https://app.autisync.com (the tracking page)
//   SITE_SLUG     the CRM website whose order form is used, default ribeira-demo
//   TRACK_TOKEN   the demo delivery on its way: printed by
//                 `npm run demo:business -- merchant` (the default below is
//                 the one that command always uses)
import { cpSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';

const DEFAULT_TRACK_TOKEN = '43c560a419877e2f95dfdb19877861c2ac325b208e4b4f0d';

rmSync('dist', { recursive: true, force: true });
mkdirSync('dist', { recursive: true });
cpSync('src', 'dist', { recursive: true });

const config = {
  api: (process.env.CRM_API_URL || 'https://api.autisync.com/api').replace(/\/+$/, ''),
  app: (process.env.CRM_APP_URL || 'https://app.autisync.com').replace(/\/+$/, ''),
  siteSlug: process.env.SITE_SLUG || 'ribeira-demo',
  trackToken: process.env.TRACK_TOKEN ?? DEFAULT_TRACK_TOKEN,
};
writeFileSync('dist/config.js', `window.SITE_CONFIG = ${JSON.stringify(config)};\n`);
writeFileSync('dist/demo/config.js', `window.SITE_CONFIG = ${JSON.stringify({
  ctaEn: process.env.CTA_URL_EN || 'https://www.autisync.com/crm/deliveries#book',
  ctaPt: process.env.CTA_URL_PT || 'https://www.autisync.com/crm/entregas#book',
})};\n`);
console.log(`Built Ribeira Materiais against ${config.api} (site ${config.siteSlug})`);
