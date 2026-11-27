"""List every media-like reference in a raw Wix page (hosts, video ids, gif/mp4 names)."""
import re, sys, pathlib, collections
h = pathlib.Path(sys.argv[1]).read_text(encoding="utf-8")
hosts = collections.Counter(re.findall(r'https?://([a-z0-9.-]+)/', h))
print("HOSTS:", hosts.most_common(40))
pats = {
    "video": r'video\.wixstatic\.com/video/[^"\'\s\\]+',
    "mp4/gif/webm": r'[\w~-]+\.(?:mp4|gif|webm|mov)\b',
    "vid_ids": r'"(?:videoId|videoUrl|uri)":"([^"]+)"',
    "gallery": r'"(?:items|galleryItems)"\s*:',
}
for k, p in pats.items():
    found = sorted(set(re.findall(p, h)))
    print(k, len(found))
    for f in found[:60]:
        print("  ", f)
