"""Move ripped Wix media into originals/ with readable names, and write web-sized copies into site/img/."""
import sys, shutil, json, pathlib
from PIL import Image

SRC, ORIG, WEB = (pathlib.Path(p) for p in sys.argv[1:4])
ORIG.mkdir(parents=True, exist_ok=True); WEB.mkdir(parents=True, exist_ok=True)
H = "6b1f57_"
NAMES = {
    # brand
    "0088921ec9c74850a44315ef2f1a60fb.png": "logo-wordmark.png",
    "258aadb957374e0e9b08748a1c2c3920.png": "logo-triangle.png",
    "fa29f66703154a36ab31910531c4a66e.png": "icon-facebook.png",
    "7528824071724d12a3e6c31eee0b40d4.png": "icon-linkedin.png",
    # backgrounds
    "839ef9b0ce4d43c4a2ddb7fb3c017161.jpg": "bg-rocket-nebula.jpg",
    "3a063369f76b4268b734ffb611361806.jpg": "bg-aurora-streaks.jpg",
    "979bd305c42d4ae88e23f05ef7da96d9.jpg": "bg-blue-streaks.jpg",
    # rentals block
    "21f79bfc2d6a4e9aa7fbf31c5074032e.png": "sony-vpl-fhz700l.png",
    "8c7bf84253c245d89e1b62097e176165~mv1.jpg": "projector-road-cases.jpg",
    # hero slideshow
    "535149356df447f4a10003ef730b8f7a.jpg": "slide-01.jpg",
    "4d370cb4c7314ce2bdcebef1f88e37a5~mv2.png": "slide-02.png",
    "1b7a8dded6de445eb52bd17f7c61d71f.jpg": "slide-03-android-jones-mova.jpg",
    "f571fbad272349d68afa7e4a5fd98f43~mv2.png": "slide-04.png",
    "3b80b755a5d049f78d404d6225f12736.jpg": "slide-05.jpg",
    "760c1fb1974a4b70995df3a522a832db.jpg": "slide-06.jpg",
    "6f33663fa6b640438f9c0b1d794b12aa.jpg": "slide-07-edc-vegas-2014.jpg",
    "3320a4e05a8c4c03a1c5f4505d8ac3d8.jpg": "slide-08-envision-sol-14.jpg",
    "52327efc1c9a4d7d9a45c39fc4df02e0.jpg": "slide-09.jpg",
    "49f9d0e2aa764ad49b19dc9a431daf4f.jpg": "slide-10.jpg",
    "7ea2ae8cd69a40109fc6fb7026cea9d3.jpg": "slide-11.jpg",
    "f6ab76c5420042b598bfba616bdee28a.jpg": "slide-12.jpg",
    # project collage
    "fd3bcd3e493b456d845713ac6e38a0a8.jpg": "work-envision-sol-15.jpg",
    "0a606a0312814abc8efaf57ff2b1cede.jpg": "work-vegas-hewlett-packard.jpg",
    "f7fe5af387a14d7896ddc0fa0a3e1ead.png": "work-boom-festival-12.png",
    "eba22ddb976a464b8c8fcf3081cfc349.png": "work-drop-box.png",
    "184190830ca84e21bf3d76e0b8cb4d23.png": "work-sasha-avalon.png",
    "0f97f265ada34c8c8971e17814bbe7e4.png": "work-pandora-radio.png",
    "e32bdd53a13e42799d303133ee3e2a40.jpg": "work-belkin.jpg",
    "7359a1af3a21435988602b5822b0cec0.png": "work-stage-sim.png",
    # client logos
    "4eed86161ff6432fa590fb388b8cefe6.png": "client-symbiosis.png",
    "f433ebf25c5a4ff9a72560fe549a292e.jpg": "client-lib.jpg",
    "516faa73c2c94e8ab71b84cac2e1bcbb.jpg": "client-android-jones.jpg",
    "a08fa87f269344ebbd687fe644dd8ed1.png": "client-lucidity.png",
    "65c25b97e6354d3f846d0140fdb019e8.png": "client-aa-symbol.png",
    "9e9fe473cf3d4c1eabe4dea22f84b0c3.png": "client-coachella.png",
    "4be8dc98682b47e99c3b78bfe26272a7.png": "client-do-art-foundation.png",
    "28bbe21eaeb84f3caed5336c98076142.jpg": "client-boom-festival.jpg",
    "a6443b9c88d34078b568b0ff25718af1.jpg": "client-insomniac.jpg",
    "90ff7e64f78147fda91e7228ddd7914f.png": "client-edc.png",
    "507c1a545f314b61879b7bf1af9386a0.jpg": "client-pandora.jpg",
    "749f7495ad654ce0903d2378324e00c7.png": "client-envision.png",
    "f94b09b5ecd14ca9bd60d0f9c516fa32.jpg": "client-hollywood-lights.jpg",
    "5f0d0e261cfc419d9c3bca7595485ed1.jpg": "client-bamboo-dna.jpg",
    "34800e05f34d47bca4eec92de6764068.png": "client-art-basel.png",
    "789cdd31e45a4e2cafa1681b60c56528.jpg": "client-aa-restaurante-club.jpg",
    "a5936b686e114323a8db69ce272a360e.png": "client-belkin.png",
    "c1e5d5a094224f2fb1905fa1120b0257.jpg": "client-fractal-planet.jpg",
}
MAXW = {"bg-": 1920, "slide-": 1600, "work-": 1400, "client-": 400, "logo-": 900, "icon-": 64}
mapping, unknown = {}, []
for f in sorted(SRC.iterdir()):
    key = f.name[len(H):] if f.name.startswith(H) else f.name
    if f.suffix.lower() == ".pdf":
        shutil.copy2(f, ORIG / f.name); shutil.copy2(f, WEB.parent / "downloads" / f.name) if (WEB.parent / "downloads").mkdir(exist_ok=True) is None else None
        mapping[f.name] = f.name; continue
    name = NAMES.get(key)
    if not name:
        unknown.append(f.name); continue
    shutil.copy2(f, ORIG / name)
    im = Image.open(f)
    mw = next((v for k, v in MAXW.items() if name.startswith(k)), 1600)
    alpha = im.mode in ("RGBA", "LA", "P") and "A" in im.convert("RGBA").getbands() and im.convert("RGBA").getextrema()[3][0] < 255
    if im.width > mw:
        im = im.resize((mw, round(im.height * mw / im.width)), Image.LANCZOS)
    stem = pathlib.Path(name).stem
    if alpha:
        out = WEB / f"{stem}.png"; im.convert("RGBA").save(out, optimize=True)
    else:
        out = WEB / f"{stem}.jpg"; im.convert("RGB").save(out, quality=84, optimize=True, progressive=True)
    mapping[f.name] = out.name
    print(f"{name:40s} -> img/{out.name:40s} {out.stat().st_size // 1024} KB")
(ORIG / "_wix_id_map.json").write_text(json.dumps({"original_wix_file": NAMES, "web_file": mapping}, indent=1), encoding="utf-8")
print("unknown:", unknown)
