"""Labelled contact sheet of every image in a folder (index, short id, size)."""
import sys, pathlib
from PIL import Image, ImageDraw

src = pathlib.Path(sys.argv[1]); out = pathlib.Path(sys.argv[2])
files = sorted(p for p in src.iterdir() if p.suffix.lower() in (".png", ".jpg", ".jpeg", ".gif", ".webp"))
T = 220; cols = 6; rows = (len(files) + cols - 1) // cols
sheet = Image.new("RGB", (cols * T, rows * (T + 30)), (60, 60, 60))
d = ImageDraw.Draw(sheet)
for i, f in enumerate(files):
    im = Image.open(f); w, h = im.size
    im = im.convert("RGBA"); bg = Image.new("RGBA", im.size, (128, 0, 128, 255)); bg.alpha_composite(im)
    bg.thumbnail((T, T)); x, y = (i % cols) * T, (i // cols) * (T + 30)
    sheet.paste(bg.convert("RGB"), (x, y))
    d.text((x + 3, y + T + 2), f"{i} {f.stem[7:13]} {w}x{h}", fill=(255, 255, 0))
    print(i, f.name, w, h)
sheet.save(out)
