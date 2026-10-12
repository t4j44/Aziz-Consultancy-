"""Sample Natural Earth 110m land onto a sphere grid for the 3D globe.

Usage: python -I build_globe.py <scratchpad_dir> <out_json>
Writes a JSON array of [lat, lon] pairs (1 decimal) for every grid cell over land.
"""
import json
import sys

from PIL import Image, ImageDraw

SP, OUT = sys.argv[1], sys.argv[2]
land = json.load(open(f"{SP}/ne_land.json", encoding="utf-8"))

W, H = 2160, 1080  # 1/6 degree world mask
STEP = 2.4         # degrees between sample rows
LAT_MIN, LAT_MAX = -60.0, 82.0


def to_px(lon, lat):
    return ((lon + 180.0) / 360.0 * W, (90.0 - lat) / 180.0 * H)


mask = Image.new("L", (W, H), 0)
draw = ImageDraw.Draw(mask)


def unwrap(ring):
    out = [ring[0][0]]
    prev = ring[0][0]
    for lon, _ in ring[1:]:
        lon_u = prev + (((lon - prev) + 180) % 360) - 180
        out.append(lon_u)
        prev = lon_u
    return out


for feat in land["features"]:
    geom = feat["geometry"]
    polys = [geom["coordinates"]] if geom["type"] == "Polygon" else geom["coordinates"]
    for poly in polys:
        for i, ring in enumerate(poly):
            lons = unwrap(ring)
            for shift in (-360.0, 0.0, 360.0):
                pts = [to_px(lon + shift, lat) for lon, (_, lat) in zip(lons, ring)]
                draw.polygon(pts, fill=255 if i == 0 else 0)

px = mask.load()
dots = []
lat = LAT_MIN
while lat <= LAT_MAX:
    n = max(8, round(360.0 * max(0.05, __import__("math").cos(__import__("math").radians(lat))) / STEP))
    for k in range(n):
        lon = -180.0 + (k + 0.5) * 360.0 / n
        x, y = to_px(lon, lat)
        if px[min(W - 1, int(x)), min(H - 1, int(y))] > 127:
            dots.append([round(lat, 1), round(lon, 1)])
    lat += STEP

with open(OUT, "w", encoding="utf-8") as f:
    json.dump(dots, f, separators=(",", ":"))
print("dots:", len(dots), "bytes:", len(json.dumps(dots, separators=(",", ":"))))
