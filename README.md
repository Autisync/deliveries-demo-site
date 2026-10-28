# Ribeira Materiais: demo builders' merchant website

The website of **Ribeira Materiais**, an invented builders' merchant in Lisbon
(Marvila) that runs its orders, vans and customer tracking on Autisync. It is
the "real business" side of the Autisync Deliveries demo:

- **The order form** sends the order to the CRM account
  *Ribeira Materiais de Construção (Demo)* as a new lead.
- **"See a delivery on its way"** opens a real tracking page in the CRM, for
  the demo delivery that is on the way today.
- **/demo/** is the interactive simulation of a delivery day (office board,
  driver's phone, customer's phone), the same one shown on
  autisync.com/crm/deliveries.

Portuguese by default, English with the PT / EN switch (or `?lang=en`).

## The CRM side

```
docker compose exec crm-backend npm run demo:business -- merchant            # once
docker compose exec crm-backend npm run demo:business -- merchant --refresh  # today's deliveries again
```

Run `--refresh` each morning (or every hour during the day) so the board and
the tracking page show today.

## Vercel

Import this repository, framework preset **Other**. The build settings are in
`vercel.json`. Optional environment variables: `CRM_API_URL`, `CRM_APP_URL`,
`SITE_SLUG`, `TRACK_TOKEN` (see `build.mjs`).

Photos: Pexels (free to use), loaded from images.pexels.com.
