"""Download original Wix media (stripping /v1/ resize transforms) and the PDF into a site assets folder."""
import re, sys, json, pathlib, urllib.request

RAW = pathlib.Path(sys.argv[1])
DEST = pathlib.Path(sys.argv[2])
DEST.mkdir(parents=True, exist_ok=True)
UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130 Safari/537.36"}
report = json.loads((RAW / "report.json").read_text(encoding="utf-8"))

originals = {}
for page, info in report.items():
    for u in info["imgs"]:
        m = re.match(r"https://static\.wixstatic\.com/media/([^/]+?\.(?:png|jpe?g|gif|webp|svg))", u, re.I)
        if m:
            originals.setdefault(m.group(1), set()).add(page)
pdfs = {u for info in report.values() for u in info["files"]}

manifest = {}
def get(url, out):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=60) as r:
        out.write_bytes(r.read())
    return out.stat().st_size

for name, pages in sorted(originals.items()):
    try:
        size = get("https://static.wixstatic.com/media/" + name, DEST / name)
        manifest[name] = {"pages": sorted(pages), "bytes": size}
    except Exception as e:
        manifest[name] = {"pages": sorted(pages), "error": str(e)}
for u in pdfs:
    try:
        size = get(u, DEST / "astra-sony-vpl-fhz700l-spec-sheet.pdf")
        manifest["spec_pdf"] = {"src": u, "bytes": size}
    except Exception as e:
        manifest["spec_pdf"] = {"src": u, "error": str(e)}

# social links
html = "".join((RAW / f"{p}.html").read_text(encoding="utf-8") for p in report)
social = sorted(set(re.findall(r'https?://(?:www\.)?(?:facebook|linkedin|instagram|vimeo|twitter)\.com/[^"\'\s\\<]+', html)))
manifest["_social"] = social
(RAW / "assets_manifest.json").write_text(json.dumps(manifest, indent=1), encoding="utf-8")
for k, v in manifest.items():
    print(k, v)
