"""Download every Wix media id found in captured siteassets JSON that is not yet in the assets folder."""
import re, sys, glob, pathlib, urllib.request
RAW, DEST = pathlib.Path(sys.argv[1]), pathlib.Path(sys.argv[2])
UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130 Safari/537.36"}
ids = set()
for f in glob.glob(str(RAW / "sa_*.json")):
    ids |= set(re.findall(r'[0-9a-f]{6}_[0-9a-f]{32}(?:~mv\d)?\.(?:jpe?g|png|gif|webp)', open(f, encoding="utf-8", errors="replace").read()))
new = sorted(i for i in ids if not (DEST / i).exists())
for i in new:
    try:
        with urllib.request.urlopen(urllib.request.Request("https://static.wixstatic.com/media/" + i, headers=UA), timeout=60) as r:
            (DEST / i).write_bytes(r.read())
        print("ok", i, (DEST / i).stat().st_size)
    except Exception as e:
        print("ERR", i, e)
print("total ids", len(ids), "new", len(new), "files now", len(list(DEST.iterdir())))
