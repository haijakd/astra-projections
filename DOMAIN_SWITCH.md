# Moving astraprojections.com from Wix to Cloudflare Pages

The site is live on the Pages project `astra-projections`: https://astra-projections.pages.dev
Nothing below has been done yet. Each step changes DNS and waits on the Commander.

## Why nameservers move (not just a record)
Cloudflare Pages can serve the bare domain `astraprojections.com` only if the domain's DNS zone lives on Cloudflare.
`www` alone could be a CNAME at GoDaddy, but the apex could not. So the clean route is to point
GoDaddy's nameservers at Cloudflare. The domain stays registered (and paid for) at GoDaddy.

## Steps
1. Cloudflare dashboard > Add a domain > `astraprojections.com` > Free plan.
   Cloudflare imports the current GoDaddy records. Check that any **MX / email records** came across,
   or mail on @astraprojections.com stops.
2. Delete the imported Wix records (the A/CNAME for `@` and `www` that point at Wix).
3. Workers & Pages > `astra-projections` > Custom domains > add `astraprojections.com`, then `www.astraprojections.com`.
   Cloudflare creates the matching records itself.
4. GoDaddy > My Products > astraprojections.com > DNS > Nameservers > "I'll use my own nameservers" >
   enter the two `*.ns.cloudflare.com` names Cloudflare shows in step 1.
5. Wait for the zone to show **Active** (often under an hour, up to 24 h). SSL is issued automatically.
6. Optional: a Redirect Rule `astraprojections.com/*` -> `https://www.astraprojections.com/$1` (301).
   The live Wix site uses `www`, and the sitemap lists `www`, so `www` stays canonical.
7. Check: `powershell -File _tools\check_live.ps1 https://www.astraprojections.com` reports `FAILURES: 0`.
   Only then cancel the Wix plan.

## Contact and quote forms
They show a "not connected yet" note until an endpoint is set in `site/js/site.js` (FORM_ENDPOINT),
for example a free Formspree form. Then redeploy:
`npx wrangler pages deploy site --project-name astra-projections --branch main`

## Old Wix URLs that keep working
/services, /contact (pages) · /home, /index.html -> / · /astra-projections/services, /astra-projections/contact -> the new pages
