"""Fetch raw Wix HTML for each page and list asset URLs found in it."""
import re, sys, json, pathlib, urllib.request


class _R:
    def __init__(self, status, text):
        self.status_code, self.text = status, text


class requests:  # minimal stdlib stand-in
    @staticmethod
    def get(url, headers=None, timeout=30):
        req = urllib.request.Request(url, headers=headers or {})
        try:
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                return _R(resp.status, resp.read().decode("utf-8", "replace"))
        except urllib.error.HTTPError as e:
            return _R(e.code, e.read().decode("utf-8", "replace"))

BASE = "https://haijak.wixsite.com/astra-projections"
OUT = pathlib.Path(sys.argv[1])
OUT.mkdir(parents=True, exist_ok=True)
UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130 Safari/537.36"}

pages = {"home": BASE, "services": BASE + "/services", "contact": BASE + "/contact"}
report = {}
seen_pages = set()
queue = list(pages.items())
while queue:
    name, url = queue.pop(0)
    if url in seen_pages:
        continue
    seen_pages.add(url)
    r = requests.get(url, headers=UA, timeout=30)
    html = r.text
    (OUT / f"{name}.html").write_text(html, encoding="utf-8")
    imgs = sorted(set(re.findall(r'https://static\.wixstatic\.com/media/[^"\'\s\\)]+', html)))
    files = sorted(set(re.findall(r'https://[a-z0-9.-]*(?:filesusr|wixstatic)\.com/(?:ugd|uploads)/[^"\'\s\\)]+', html)))
    vimeo = sorted(set(re.findall(r'(?:player\.)?vimeo\.com/(?:video/)?\d+', html)))
    youtube = sorted(set(re.findall(r'youtube\.com/(?:embed/|watch\?v=)[\w-]+', html)))
    links = sorted(set(re.findall(r'https://haijak\.wixsite\.com/astra-projections/[a-z0-9-]+', html)))
    for l in links:
        slug = l.rsplit("/", 1)[1]
        if l not in seen_pages and not slug.startswith("_"):
            queue.append((slug, l))
    report[name] = {"url": url, "status": r.status_code, "bytes": len(html),
                    "imgs": imgs, "files": files, "vimeo": vimeo, "youtube": youtube, "links": links}
(OUT / "report.json").write_text(json.dumps(report, indent=1), encoding="utf-8")
for k, v in report.items():
    print(k, v["status"], v["bytes"], "imgs", len(v["imgs"]), "files", v["files"], "vimeo", v["vimeo"], "yt", v["youtube"], "links", v["links"])
