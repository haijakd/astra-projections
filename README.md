# Astra Projections - static site

Static rebuild of astraprojections.com (originally a Wix site), with no Wix code, banners or trackers.

- `site/` - the deployable website (index, services, contact; css, js, img, downloads). This is the folder to host.
- `originals/` - every image ripped from the Wix site at full resolution, plus the SONY spec sheet PDF. `_wix_id_map.json` maps the original Wix file names to the new names.
- `_tools/` - the scripts used to rip, organise and check the site (`check_site.js` serves `site/` locally and tests every page).

## Forms
The contact form (`/contact`) and the quote form (`/services`) post to `/api/contact` (`functions/api/contact.js`).
It validates, saves every message to the D1 database `astra-contact`, then emails it through the private
`astra-mailer` Worker (`mailer/`), which can only send to the owner's verified Email Routing address.
Read saved messages with `powershell -File _tools\messages.ps1`.

## Hosting
Cloudflare Pages project `astra-projections` (the form needs Pages Functions, so GitHub Pages can no longer host it).
Deploy the mailer first (`cd mailer && npx wrangler deploy`), then the site (`npx wrangler pages deploy`).
