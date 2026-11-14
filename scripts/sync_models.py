"""Builds public/models.json + thumbnails for the free 3D models (The Open Asset Forge) from archive.org.
Run by .github/workflows/sync-models.yml every few hours. Each model on archive.org is three files with the
same name: <ID> - <Name>.glb / .blend / .jpg, in items named openassetforge-<category>."""
import io, json, os, re, sys, time, urllib.parse, urllib.request
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "public", "models.json")
THUMBS = os.path.join(ROOT, "public", "models", "t")
ASSET = re.compile(r"^([A-Z]{2,4})-(\d{2,5}) - (.+)$")
UA = {"User-Agent": "edensgate-sync/1.0"}
MAX_REMOVE = 25          # safety: never drop more than this many models in one run (archive.org hiccups)


def get(url, tries=4):
    for i in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60) as r:
                return r.read()
        except Exception as e:
            if i == tries - 1:
                raise
            time.sleep(5 * (i + 1))


# Collections we know exist. archive.org's search can take hours to list a brand-new item, so these are
# always checked directly too. (New categories still get found by the search once it catches up.)
# Last manual run: 2026-11-14 (20 models)
KNOWN = ["openassetforge-artists-workshop", "openassetforge-city-and-public-space", "openassetforge-creators-studio",
         "openassetforge-kitchen", "openassetforge-modern-apartment"]


def items(old):
    found = set(KNOWN) | {m["i"] for m in old["models"]}
    try:
        q = urllib.parse.urlencode({"q": "identifier:openassetforge-*", "fl[]": "identifier", "rows": 500, "output": "json"})
        found |= {d["identifier"] for d in json.loads(get("https://archive.org/advancedsearch.php?" + q))["response"]["docs"]}
    except Exception as e:
        print("archive.org search didn't answer, checking the known collections only:", e)
    return sorted(found)


def main():
    old = json.load(open(OUT)) if os.path.exists(OUT) else {"models": []}
    models, cats = [], {}
    for ident in items(old):
        meta = json.loads(get(f"https://archive.org/metadata/{ident}"))
        if not meta.get("files"):
            continue          # not there (yet)
        title = (meta.get("metadata") or {}).get("title", "")
        cat = re.sub(r"^The Open Asset Forge · | \(free 3D models\)$", "", title) or ident
        files = {f["name"]: int(f.get("size") or 0) for f in meta.get("files", [])}
        for name in files:
            stem, ext = os.path.splitext(name)
            m = ASSET.match(stem)
            if ext != ".glb" or not m or stem + ".blend" not in files or stem + ".jpg" not in files:
                continue
            models.append({"id": f"{m.group(1)}-{m.group(2)}", "n": m.group(3), "c": cat, "i": ident, "f": stem,
                           "g": files[name], "b": files[stem + ".blend"]})
            cats[cat] = cats.get(cat, 0) + 1
    models.sort(key=lambda x: x["id"])
    gone = len({m["id"] for m in old["models"]} - {m["id"] for m in models})
    if gone > MAX_REMOVE:
        print(f"{gone} models would disappear at once - archive.org is probably having a moment. Keeping the old list.")
        return
    os.makedirs(THUMBS, exist_ok=True)
    made = 0
    for m in models:
        t = os.path.join(THUMBS, m["id"] + ".webp")
        if os.path.exists(t):
            continue
        try:
            raw = get(f"https://archive.org/download/{m['i']}/{urllib.parse.quote(m['f'] + '.jpg')}")
            im = Image.open(io.BytesIO(raw)).convert("RGB")
            im.thumbnail((360, 360), Image.LANCZOS)
            im.save(t, "WEBP", quality=80, method=6)
            made += 1
        except Exception as e:
            print("no thumbnail for", m["f"], e)
    keep = {m["id"] + ".webp" for m in models}
    for f in os.listdir(THUMBS):
        if f.endswith(".webp") and f not in keep:
            os.remove(os.path.join(THUMBS, f))
    data = {"v": 1, "categories": [{"name": k, "count": v} for k, v in sorted(cats.items())], "models": models}
    if data != old:
        json.dump(data, open(OUT, "w"), separators=(",", ":"))
    print(f"{len(models)} models in {len(cats)} categories, {made} new thumbnails, {gone} removed")


if __name__ == "__main__":
    main()
