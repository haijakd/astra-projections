# Astra Projections - static site

Static rebuild of astraprojections.com (originally a Wix site), with no Wix code, banners or trackers.

- `site/` - the deployable website (index, services, contact; css, js, img, downloads). This is the folder to host.
- `originals/` - every image ripped from the Wix site at full resolution, plus the SONY spec sheet PDF. `_wix_id_map.json` maps the original Wix file names to the new names.
- `_tools/` - the scripts used to rip, organise and check the site (`check_site.js` serves `site/` locally and tests every page).

## Forms
The Wix forms do not work off Wix. Open `site/js/site.js` and set either `FORM_ENDPOINT` (a free form service such as Formspree) or `CONTACT_EMAIL` (opens the visitor's mail app).

## Hosting
Cloudflare Pages or GitHub Pages, with `site` as the output / publish directory and no build command.
