"""From captured Wix siteassets JSON, collect every gallery (compId -> ordered Image items with title/desc/link)."""
import json, glob, sys, pathlib
RAW = pathlib.Path(sys.argv[1])
out = {}
def walk(o):
    if isinstance(o, dict):
        for k, v in o.items():
            if isinstance(v, list) and v and all(isinstance(x, dict) and x.get("type") == "Image" for x in v):
                out[k] = [{"uri": x.get("uri"), "title": x.get("title") or "", "desc": x.get("description") or "",
                           "w": x.get("width"), "h": x.get("height"),
                           "link": (x.get("link") or {}).get("href") or (x.get("link") or {}).get("url")} for x in v]
            else:
                walk(v)
    elif isinstance(o, list):
        for v in o:
            walk(v)
for f in sorted(glob.glob(str(RAW / "sa_*.json"))):
    try:
        walk(json.load(open(f, encoding="utf-8")))
    except Exception as e:
        print("skip", f, e)
json.dump(out, open(RAW / "galleries.json", "w", encoding="utf-8"), indent=1)
for k, v in out.items():
    print(k, len(v))
    for i in v:
        print("   ", i["uri"], "|", i["title"], "|", i["desc"][:70], "|", i["link"])
