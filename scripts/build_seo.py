# Builds plain HTML pages Google can read for every free 3D model (colour versions share one page),
# a page per category, sitemap.xml and robots.txt. Runs after sync_models.py, so new models get pages
# automatically. The interactive models page (/models/) stays as it is; these pages link into it.
import html, json, os, re, shutil, datetime

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "public")
SITE = "https://edensgate.art"
CC0 = "https://creativecommons.org/publicdomain/zero/1.0/"
OUT = os.path.join(ROOT, "models", "free")
CATOUT = os.path.join(ROOT, "models", "category")
TODAY = datetime.date.today().isoformat()
e = html.escape


def slug(s):
    return re.sub(r"[^a-z0-9]+", "-", s.lower().replace("&", " and ").replace("'", "")).strip("-")


def mb(n):
    return f"{n / 1048576:.1f} MB" if n else ""


def dl(m, ext):
    return f"https://archive.org/download/{m['i']}/{m['f'].replace(' ', '%20')}{ext}"


def base(n):
    return n.split(", ")[0]


def label(m):
    return m["n"].split(", ", 1)[1] if ", " in m["n"] else "original"


HEAD = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<meta name="description" content="{desc}">
<link rel="canonical" href="{url}">
<meta property="og:type" content="website">
<meta property="og:title" content="{ogtitle}">
<meta property="og:description" content="{desc}">
<meta property="og:url" content="{url}">
<meta property="og:image" content="{img}">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/favicon.svg">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=JetBrains+Mono:wght@400&display=swap">
<link rel="stylesheet" href="/models/models.css?v=6">
<link rel="stylesheet" href="/models/seo.css?v=1">
<script type="application/ld+json">{ld}</script>
</head>
<body>
<header class="top"><a class="back" href="/models/">&larr; All free 3D models</a><a class="back" href="/">Eden's Gate</a></header>
"""

FOOT = """<section class="sp-terms"><h2>Free to use for anything</h2>
<p>Public domain under <a href="{cc0}" rel="license">CC0 1.0</a>. Use it in games, films, renders, apps, school or client work, commercial or not. No credit needed, no sign-up, no account.</p>
<p>Made by A. Penn &amp; Co. for <a href="/models/">The Open Asset Forge</a>, part of <a href="/">Eden's Gate</a>, a vault of free creations. Files are hosted on the <a href="https://archive.org">Internet Archive</a>.</p></section>
</main>
</body>
</html>
"""


def page(path, title, ogtitle, desc, url, img, ld, body):
    os.makedirs(path, exist_ok=True)
    with open(os.path.join(path, "index.html"), "w", encoding="utf-8") as f:
        f.write(HEAD.format(title=e(title), ogtitle=e(ogtitle), desc=e(desc), url=url, img=img,
                            ld=json.dumps(ld, ensure_ascii=False).replace("</", "<\\/")))
        f.write(body)
        f.write(FOOT.format(cc0=CC0))


def tile(href, img, name, sub):
    return (f'<li><a class="sp-tile" href="{href}"><img src="{img}" alt="" loading="lazy" width="240" height="240">'
            f'<b>{e(name)}</b><small>{e(sub)}</small></a></li>')


def cat_order():
    try:
        c = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "categories.json"), encoding="utf-8"))
        return {n: i for i, n in enumerate(c["categories"])}
    except Exception:
        return {}


def main():
    data = json.load(open(os.path.join(ROOT, "models.json"), encoding="utf-8"))
    order = cat_order()
    ordered = lambda cs: sorted(cs, key=lambda c: (order.get(c, 99), c))
    models = data["models"]
    groups = {}
    for m in models:
        groups.setdefault((m["c"], base(m["n"])), []).append(m)
    for g in groups.values():
        g.sort(key=lambda m: (", " in m["n"], m["id"]))

    # unique, stable slugs: name, or name + code when two objects share a name
    names = {}
    for (c, b) in groups:
        names.setdefault(slug(b), []).append((c, b))
    slugs = {}
    for s, keys in names.items():
        for k in keys:
            slugs[k] = s if len(keys) == 1 else f"{s}-{groups[k][0]['id'].lower()}"

    for d in (OUT, CATOUT):
        shutil.rmtree(d, ignore_errors=True)

    by_cat = {}
    for k in sorted(groups, key=lambda k: groups[k][0]["id"]):
        by_cat.setdefault(k[0], []).append(k)

    urls = []
    for (c, b), g in groups.items():
        lead = g[0]
        s = slugs[(c, b)]
        url = f"{SITE}/models/free/{s}/"
        thumb = f"{SITE}/models/t/{lead['id']}.webp"
        colors = [label(m) for m in g] if len(g) > 1 else []
        title = f"{b}: free 3D model (GLB + Blender, CC0) | Eden's Gate"
        desc = (f"Free {b.lower()} 3D model. Download a GLB for Unity, Unreal, Godot, three.js and the web, or the original "
                f"Blender file." + (f" {len(g)} colors." if colors else "") + " Public domain (CC0): use it for anything, no credit needed.")
        ld = [{
            "@context": "https://schema.org", "@type": "3DModel", "name": b, "url": url, "image": thumb,
            "description": desc, "license": CC0, "isAccessibleForFree": True, "inLanguage": "en",
            "creator": {"@type": "Organization", "name": "A. Penn & Co."},
            "isPartOf": {"@type": "CreativeWorkSeries", "name": "The Open Asset Forge", "url": f"{SITE}/models/"},
            "keywords": f"free 3D model, {b.lower()}, CC0, public domain, GLB, glTF, Blender, game asset, {c.lower()}",
            "encoding": [{"@type": "MediaObject", "contentUrl": dl(lead, ".glb"), "encodingFormat": "model/gltf-binary",
                          "contentSize": mb(lead.get("g"))},
                         {"@type": "MediaObject", "contentUrl": dl(lead, ".blend"), "encodingFormat": "application/x-blender",
                          "contentSize": mb(lead.get("b"))}],
        }, {
            "@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
                {"@type": "ListItem", "position": 1, "name": "Free 3D models", "item": f"{SITE}/models/"},
                {"@type": "ListItem", "position": 2, "name": c, "item": f"{SITE}/models/category/{slug(c)}/"},
                {"@type": "ListItem", "position": 3, "name": b, "item": url}]}]
        body = [f'<main class="sp">',
                f'<p class="sp-crumbs"><a href="/models/">Free 3D models</a> / <a href="/models/category/{slug(c)}/">{e(c)}</a></p>',
                f'<div class="sp-hero"><a class="sp-img" href="/models/?m={lead["id"]}"><img src="/models/t/{lead["id"]}.webp" alt="{e(b)} 3D model preview" width="360" height="360"></a>',
                f'<div class="sp-info"><h1>Free {e(b.lower())} 3D model</h1>',
                f'<p class="sp-id">{lead["id"]} · {e(c)} · GLB + Blender · CC0</p>',
                f'<p>A free {e(b.lower())} from The Open Asset Forge, ready for games, films, renders and apps. '
                f'The GLB opens in Unity, Unreal, Godot, three.js, Blender and most 3D tools; the .blend is the original Blender file with its materials.</p>',
                f'<p class="sp-btns"><a class="sp-btn" href="{dl(lead, ".glb")}" download>Download GLB <small>{mb(lead.get("g"))}</small></a>'
                f'<a class="sp-btn alt" href="{dl(lead, ".blend")}" download>Blender file <small>{mb(lead.get("b"))}</small></a>'
                f'<a class="sp-btn alt" href="/models/?m={lead["id"]}">View in 3D</a></p></div></div>']
        if colors:
            body.append(f'<section><h2>{len(g)} colors</h2><ul class="sp-grid small">')
            body += [tile(f"/models/?m={m['id']}", f"/models/t/{m['id']}.webp", label(m).capitalize(), m["id"]) for m in g]
            body.append("</ul></section>")
        rel = [k for k in by_cat[c] if k != (c, b)]
        i = by_cat[c].index((c, b))
        rel = (by_cat[c][i + 1:] + by_cat[c][:i])[:12]
        body.append(f'<section><h2>More free {e(c.lower())} models</h2><ul class="sp-grid">')
        body += [tile(f"/models/free/{slugs[k]}/", f"/models/t/{groups[k][0]['id']}.webp", k[1],
                      f"{len(groups[k])} colors" if len(groups[k]) > 1 else groups[k][0]["id"]) for k in rel]
        body.append(f'</ul><p><a href="/models/category/{slug(c)}/">All {e(c)} models &rarr;</a></p></section>')
        page(os.path.join(OUT, s), title, f"Free {b} 3D model", desc, url, thumb, ld, "\n".join(body))
        urls.append(url)

    cat_urls = []
    for c, keys in [(c, by_cat[c]) for c in ordered(by_cat)]:
        url = f"{SITE}/models/category/{slug(c)}/"
        n = sum(len(groups[k]) for k in keys)
        title = f"Free {c} 3D models: {len(keys)} CC0 GLB + Blender assets | Eden's Gate"
        desc = (f"{len(keys)} free {c.lower()} 3D models ({n} files with colors), as GLB and Blender files. "
                f"Public domain (CC0): use them in games, films, renders and apps, no credit needed.")
        ld = {"@context": "https://schema.org", "@type": "CollectionPage", "name": f"Free {c} 3D models", "url": url,
              "description": desc, "license": CC0, "isAccessibleForFree": True,
              "mainEntity": {"@type": "ItemList", "numberOfItems": len(keys), "itemListElement": [
                  {"@type": "ListItem", "position": i + 1, "url": f"{SITE}/models/free/{slugs[k]}/", "name": k[1]}
                  for i, k in enumerate(keys)]}}
        others = " · ".join(f'<a href="/models/category/{slug(o)}/">{e(o)}</a>' for o in ordered(by_cat) if o != c)
        body = [f'<main class="sp">', f'<p class="sp-crumbs"><a href="/models/">Free 3D models</a> / {e(c)}</p>',
                f'<h1>Free {e(c.lower())} 3D models</h1>',
                f'<p class="sp-lede">{len(keys)} free models, every one a GLB for game engines and the web plus its original Blender file. '
                f'Public domain (CC0). <a href="/models/">Search all models &rarr;</a></p>',
                f'<p class="sp-id">Other categories: {others}</p><ul class="sp-grid">']
        body += [tile(f"/models/free/{slugs[k]}/", f"/models/t/{groups[k][0]['id']}.webp", k[1],
                      f"{len(groups[k])} colors" if len(groups[k]) > 1 else groups[k][0]["id"]) for k in keys]
        body.append("</ul>")
        page(os.path.join(CATOUT, slug(c)), title, f"Free {c} 3D models", desc, url,
             f"{SITE}/models/t/{groups[keys[0]][0]['id']}.webp", ld, "\n".join(body))
        cat_urls.append(url)

    # the main pages people should land on, plus every tool page that exists
    static = [f"{SITE}/", f"{SITE}/models/", f"{SITE}/teachers/", f"{SITE}/coloring/", f"{SITE}/tools/"]
    tools = os.path.join(ROOT, "tools")
    for d in sorted(os.listdir(tools)):
        if os.path.isfile(os.path.join(tools, d, "index.html")):
            static.append(f"{SITE}/tools/{d}/")
    with open(os.path.join(ROOT, "sitemap.xml"), "w", encoding="utf-8") as f:
        f.write('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n')
        for u in static + cat_urls + sorted(urls):
            f.write(f"<url><loc>{u}</loc></url>\n")
        f.write("</urlset>\n")
    with open(os.path.join(ROOT, "robots.txt"), "w") as f:
        f.write(f"User-agent: *\nAllow: /\n\nSitemap: {SITE}/sitemap.xml\n")

    # static category links on the interactive page, so crawlers can follow them even without JavaScript
    idx = os.path.join(ROOT, "models", "index.html")
    s = open(idx, encoding="utf-8").read()
    nav = ('<nav class="sp-browse" aria-label="Browse free 3D models by category"><span>Browse by category:</span> '
           + " · ".join(f'<a href="/models/category/{slug(c)}/">{e(c)} ({len(by_cat[c])})</a>' for c in ordered(by_cat)) + "</nav>")
    s = re.sub(r'<nav class="sp-browse".*?</nav>', nav, s, flags=re.S) if 'class="sp-browse"' in s else s.replace("</main>", nav + "\n</main>", 1)
    s = re.sub(r'<meta property="og:description" content="[^"]*">',
               f'<meta property="og:description" content="{len(models):,} free 3D models. GLB + Blender. Public domain (CC0): use them for anything.">', s)
    open(idx, "w", encoding="utf-8").write(s)
    print(f"{len(urls)} model pages, {len(cat_urls)} category pages, sitemap with {len(static) + len(cat_urls) + len(urls)} URLs")


if __name__ == "__main__":
    main()
