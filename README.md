# Autisync Deliveries: live demo

A public, no-login demo of Autisync Deliveries. A made-up business runs a delivery
morning in the browser: the office board, the driver's phone and a customer's phone,
side by side (tabs on a phone). English and Portuguese (`?lang=en` / `?lang=pt`;
it picks from the browser language the first time).

Nothing is sent anywhere: the whole day is simulated in the page (`src/sim.js`).
The map uses OpenStreetMap tiles and Leaflet from cdnjs.

## Files

- `src/index.html`, `src/styles.css`: the page
- `src/app.js`: draws the three screens and handles taps
- `src/sim.js`: the clock, the vans, ETAs, late alerts, replies to the customer
- `src/data.js`: the two made-up days (London / Lisbon): vans, stops, the email order
- `src/i18n.js`: every word, in English and Portuguese
- `build.mjs`: copies `src/` to `dist/` and writes `dist/config.js`

## Run it locally

    node build.mjs
    npx serve dist        # or: python3 -m http.server -d dist 5600

## Deploy (Vercel)

Import the repo in Vercel. No framework, no install; `vercel.json` sets the build
(`node build.mjs`) and output (`dist`). Optional environment variables:

- `CTA_URL_EN`: where "Book a 15-minute call" goes (default `https://www.autisync.com/book`)
- `CTA_URL_PT`: the Portuguese one (default `https://www.autisync.com/pt/marcar`)
- `SITE_URL`: the site address for link previews (defaults to the Vercel production domain)
