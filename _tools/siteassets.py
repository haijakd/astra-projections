"""Fetch the Wix siteassets JSON referenced by each raw page and list every media id inside."""
import re, sys, json, pathlib, urllib.request, urllib.parse, html as H
RAW = pathlib.Path(sys.argv[1])
UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130 Safari/537.36"}
allids, seen = {}, set()
for page in ("home", "services", "contact"):
    h = (RAW / f"{page}.html").read_text(encoding="utf-8")
    for u in re.findall(r'https://siteassets\.parastorage\.com/[^"\'\s\\]+', h):
        u = urllib.parse.quote(H.unescape(u), safe=":/?&=%,.;~+-_")
        if u in seen:
            continue
        seen.add(u)
        try:
            with urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=60) as r:
                body = r.read().decode("utf-8", "replace")
        except Exception as e:
            print("ERR", u[:120], e); continue
        name = f"siteassets_{len(seen)}.json"
        (RAW / name).write_text(body, encoding="utf-8")
        ids = sorted(set(re.findall(r'[0-9a-f]{6}_[0-9a-f]{32}(?:~mv\d)?\.(?:jpe?g|png|gif|webp)', body)))
        vids = sorted(set(re.findall(r'[0-9a-f]{6}_[0-9a-f]{32}(?=["/])', body)))
        print(page, name, len(body), "imgs", len(ids), "video-ish", len(vids), u[:110])
        for i in ids:
            allids.setdefault(i, set()).add(page)
        for v in vids:
            allids.setdefault("VIDEO:" + v, set()).add(page)
(RAW / "siteassets_ids.json").write_text(json.dumps({k: sorted(v) for k, v in allids.items()}, indent=1), encoding="utf-8")
print("total distinct", len(allids))
