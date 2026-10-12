"""Build route-map.svg (dotted land + flight arcs), favicons and og-image.

Usage: python -I build_assets.py <scratchpad_dir> <site_dir>
Land data: Natural Earth 110m land (public domain), saved as ne_land.json in scratchpad.
"""
import json
import math
import sys

from PIL import Image, ImageDraw

SP, SITE = sys.argv[1], sys.argv[2]
ASSETS = f"{SITE}/assets"

# ---- projection: crop to Europe, Middle East, South and South-East Asia ----
LON0, LON1, LAT0, LAT1 = -12.0, 125.0, -2.0, 70.0
W, H = 1000.0, 526.0


def proj(lon, lat):
    return ((lon - LON0) / (LON1 - LON0) * W, (LAT1 - lat) / (LAT1 - LAT0) * H)


HUB = (91.4643, 24.2676)  # Shaistagonj, Habiganj (geographic position, not a claim)
DESTS = [
    ("portugal", 38.7223, -9.1393),
    ("lithuania", 54.6872, 25.2797),
    ("finland", 60.1699, 24.9384),
    ("moldova", 47.0105, 28.8638),
    ("greece", 37.9838, 23.7275),
    ("italy", 41.9028, 12.4964),
    ("malaysia", 3.1390, 101.6869),
]

# ---- rasterise land at SS x resolution ----
land = json.load(open(f"{SP}/ne_land.json", encoding="utf-8"))
SS = 8
mask = Image.new("L", (int(W * SS), int(H * SS)), 0)
draw = ImageDraw.Draw(mask)


def unwrap(ring):
    """Make longitudes continuous so polygons crossing the antimeridian do not streak."""
    out = [ring[0][0]]
    prev = ring[0][0]
    for lon, _lat in ring[1:]:
        delta = lon - prev
        lon_u = prev + ((delta + 180) % 360) - 180
        out.append(lon_u)
        prev = lon_u
    return out


for feat in land["features"]:
    geom = feat["geometry"]
    polys = [geom["coordinates"]] if geom["type"] == "Polygon" else geom["coordinates"]
    for poly in polys:
        for i, ring in enumerate(poly):
            lons = unwrap(ring)
            pts = []
            for lon_u, (_lon, lat) in zip(lons, ring):
                x, y = proj(lon_u, lat)
                pts.append((x * SS, y * SS))
            draw.polygon(pts, fill=255 if i == 0 else 0)

# ---- dot grid over land ----
STEP = 9.0
dots = []
y = STEP / 2
while y < H:
    x = STEP / 2
    while x < W:
        if mask.getpixel((int(x * SS), int(y * SS))) > 127:
            dots.append(f"M{x:.1f} {y:.1f}h.01")
        x += STEP
    y += STEP


# ---- arcs: quadratic curves lifted above the straight line ----
def arc(lon_a, lat_a, lon_b, lat_b):
    ax, ay = proj(lon_a, lat_a)
    bx, by = proj(lon_b, lat_b)
    mx, my = (ax + bx) / 2, (ay + by) / 2
    dx, dy = bx - ax, by - ay
    length = math.hypot(dx, dy)
    nx, ny = -dy / length, dx / length
    if ny > 0:  # make the normal point upward (smaller y)
        nx, ny = -nx, -ny
    lift = 0.28 * length
    cx, cy = mx + nx * lift, my + ny * lift
    return f"M{ax:.1f} {ay:.1f}Q{cx:.1f} {cy:.1f} {bx:.1f} {by:.1f}", (bx, by)


arcs, ends = [], []
for _name, lat, lon in DESTS:
    d, end = arc(HUB[0], HUB[1], lon, lat)
    arcs.append(d)
    ends.append(end)
hx, hy = proj(*HUB)

svg = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W:.0f} {H:.0f}">
<path d="{''.join(dots)}" fill="none" stroke="#F5F3EC" stroke-opacity=".26" stroke-width="3.6" stroke-linecap="round"/>
<path d="{' '.join(arcs)}" fill="none" stroke="#CB8711" stroke-width="1.7" stroke-linecap="round"/>
<g fill="#FAD158">
{chr(10).join(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="3.8"/>' for x, y in ends)}
</g>
<circle cx="{hx:.1f}" cy="{hy:.1f}" r="16" fill="none" stroke="#FAD158" stroke-opacity=".55" stroke-width="1.4"/>
<circle cx="{hx:.1f}" cy="{hy:.1f}" r="6.5" fill="#FAD158"/>
</svg>
"""
open(f"{ASSETS}/route-map.svg", "w", encoding="utf-8").write(svg)
print("route-map.svg dots:", len(dots), "bytes:", len(svg))

# ---- icons and social image from the owner's logo ----
mark = Image.open(f"{ASSETS}/logo-mark.webp").convert("RGBA")
full = Image.open(f"{ASSETS}/logo-full.webp").convert("RGBA")


def on_white(img, size, pad=0.14):
    canvas = Image.new("RGBA", (size, size), (255, 255, 255, 255))
    inner = int(size * (1 - 2 * pad))
    scale = min(inner / img.width, inner / img.height)
    w, h = round(img.width * scale), round(img.height * scale)
    canvas.alpha_composite(img.resize((w, h), Image.LANCZOS), ((size - w) // 2, (size - h) // 2))
    return canvas.convert("RGB")


on_white(mark, 512).save(f"{ASSETS}/favicon.png")
on_white(mark, 192).save(f"{ASSETS}/favicon-192.png")
on_white(mark, 32).save(f"{ASSETS}/favicon-32.png")
on_white(mark, 180).save(f"{ASSETS}/apple-touch-icon.png")
on_white(mark, 256).save(f"{ASSETS}/favicon.ico", sizes=[(16, 16), (32, 32), (48, 48), (256, 256)])

og = Image.new("RGB", (1200, 630), (255, 255, 255))
fw = 560
fh = round(full.height * fw / full.width)
logo_img = full.resize((fw, fh), Image.LANCZOS)
og.paste(logo_img, ((1200 - fw) // 2, (630 - fh) // 2), logo_img)
og.save(f"{ASSETS}/og-image.png")
print("icons and og-image written")
