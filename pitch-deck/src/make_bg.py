"""Generate the animated 'citation network' background.

    python src/make_bg.py          light theme (white slides, the default deck)
    python src/make_bg.py dark     dark theme

Outputs (in ../assets), per theme ("bg_light" or "bg"):
  <name>.gif         - seamless looping GIF used as the PowerPoint slide background
  <name>.json        - the same node/glow data, so the HTML canvas draws the identical scene
  <name>_poster.png  - the first frame (print background for the HTML deck)
"""
import json, math, os, random, sys
from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
ASSETS = os.path.join(HERE, "..", "assets")
os.makedirs(ASSETS, exist_ok=True)

W, H = 1280, 720          # logical canvas = 13.333in x 7.5in at 96 dpi
GIF_W, GIF_H = 960, 540
SS = 2                    # supersampling for anti-aliased lines
FRAMES = 80               # 80 frames x 100 ms = 8 s loop
FRAME_MS = 100
LINK_DIST = 165

THEME = sys.argv[1] if len(sys.argv) > 1 else "light"
THEMES = {
    # white slides: the network is a quiet texture in the trust-label colours, never louder than the text
    "light": {
        "name": "bg_light",
        "bg": (255, 255, 255),
        "palette": {
            "ink":    (100, 116, 139),
            "mint":   (10, 127, 98),
            "sky":    (29, 111, 216),
            "violet": (124, 58, 237),
            "amber":  (180, 83, 9),
            "rose":   (225, 29, 72),
        },
        "glows": [
            {"x": 0.10, "y": 0.08, "r": 560, "c": "mint",   "a": 0.07},
            {"x": 0.95, "y": 0.98, "r": 640, "c": "violet", "a": 0.05},
            {"x": 0.78, "y": 0.12, "r": 420, "c": "sky",    "a": 0.04},
        ],
        "alpha": {"grid": 0.03, "link": 0.13, "pulse": 0.28, "halo": 0.06, "dot": 0.5},
    },
    "dark": {
        "name": "bg",
        "bg": (7, 11, 25),
        "palette": {
            "ink":    (160, 178, 228),
            "mint":   (46, 230, 166),
            "sky":    (110, 182, 255),
            "violet": (177, 140, 255),
            "amber":  (255, 181, 71),
            "rose":   (255, 93, 122),
        },
        "glows": [
            {"x": 0.10, "y": 0.08, "r": 560, "c": "mint",   "a": 0.13},
            {"x": 0.95, "y": 0.98, "r": 640, "c": "violet", "a": 0.15},
            {"x": 0.78, "y": 0.12, "r": 420, "c": "sky",    "a": 0.07},
        ],
        "alpha": {"grid": 0.035, "link": 0.20, "pulse": 0.45, "halo": 0.11, "dot": 0.78},
    },
}
T = THEMES[THEME]
BG = T["bg"]
PALETTE = T["palette"]        # trust-label colours (see spec.js)
ALPHA = T["alpha"]

rng = random.Random(26112026)

def pick_color():
    r = rng.random()
    if r < 0.58: return "ink"
    if r < 0.78: return "mint"
    if r < 0.88: return "sky"
    if r < 0.94: return "violet"
    if r < 0.97: return "amber"
    return "rose"

nodes = []
# jittered grid so the network covers the slide evenly
cols, rows = 10, 6
for cy in range(rows):
    for cx in range(cols):
        x0 = (cx + 0.5) * W / cols + rng.uniform(-50, 50)
        y0 = (cy + 0.5) * H / rows + rng.uniform(-40, 40)
        nodes.append({
            "x": round(x0, 1), "y": round(y0, 1),
            "ax": round(rng.uniform(10, 30), 1), "ay": round(rng.uniform(8, 24), 1),
            "p1": round(rng.uniform(0, math.tau), 3), "p2": round(rng.uniform(0, math.tau), 3),
            "k": rng.choice([1, 1, 2]),             # integer -> seamless loop
            "r": round(rng.uniform(1.4, 3.2), 2),
            "c": pick_color(),
        })

# a few nodes emit a "verification pulse" ring once per loop
pulse_nodes = [i for i, n in enumerate(nodes) if n["c"] in ("mint", "violet", "amber")][:6]
pulses = [{"n": idx, "off": round(j / len(pulse_nodes), 3)} for j, idx in enumerate(pulse_nodes)]

glows = T["glows"]  # x, y (fraction of W/H), radius px, colour, peak alpha

# Quiet zones: where free-standing text sits on any slide (one background serves all six), the
# network's dots, rings and links fade out so nothing lands on a letter. Glows and grid stay.
# Inches on the 13.333 x 7.5 canvas (x0, y0, x1, y1); keep in step with the layout in spec.js.
DPI = W / 13.333
QUIET_IN = [
    (0.00, 0.30, 10.45, 1.42),   # header: section chip + title (longest title ends ~10.2in), leaving the top-right corner to the network
    (0.00, 1.38, 12.45, 2.42),   # header: subtitle (up to two lines), slide 5 column labels
    (0.40, 2.20, 7.15, 5.70),    # slide 1 left column: tagline, description, the three checks
    (0.40, 5.75, 3.70, 6.65),    # slide 1 team names
    (2.50, 3.15, 8.70, 3.60),    # slide 3 arrow labels between the tiers
    (7.00, 5.45, 12.95, 6.90),   # slide 4 trust-label legend
    (0.40, 6.90, 4.40, 7.40),    # footer, left
    (11.60, 6.90, 13.00, 7.40),  # footer, page number
]
QUIET = [tuple(round(v * DPI, 1) for v in r) for r in QUIET_IN]
QUIET_RAMP = 26.0  # px of soft edge outside each zone

def quiet(x, y):
    """1 = network fully visible, 0 = hidden (inside a quiet zone); smooth ramp at the edges."""
    s = 0.0
    for x0, y0, x1, y1 in QUIET:
        dx = max(x0 - x, 0.0, x - x1); dy = max(y0 - y, 0.0, y - y1)
        v = max(0.0, 1.0 - math.hypot(dx, dy) / QUIET_RAMP)
        s = max(s, v * v * (3 - 2 * v))
    return 1.0 - s

def quiet_seg(ax, ay, bx, by):
    return min(quiet(ax + (bx - ax) * f, ay + (by - ay) * f) for f in (0, 0.2, 0.4, 0.6, 0.8, 1))

def quiet_ring(x, y, rad):
    return min([quiet(x, y)] + [quiet(x + rad * math.cos(a), y + rad * math.sin(a))
                                for a in (i * math.tau / 12 for i in range(12))])

def node_pos(n, t):
    a = math.tau * n["k"] * t
    return (n["x"] + n["ax"] * math.sin(a + n["p1"]),
            n["y"] + n["ay"] * math.cos(a + n["p2"]))

def base_layer():
    """Static base: colour, glows, faint grid (drawn once, at logical size)."""
    import numpy as np
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    img = np.zeros((H, W, 3), np.float32) + np.array(BG, np.float32)
    for g in glows:
        d = np.sqrt((xx - g["x"] * W) ** 2 + (yy - g["y"] * H) ** 2) / g["r"]
        a = g["a"] * np.clip(1 - d, 0, 1) ** 2
        img += (np.array(PALETTE[g["c"]], np.float32) - img) * a[..., None]
    # faint ledger grid every 48 px
    grid = np.zeros((H, W), np.float32)
    grid[::48, :] = 1; grid[:, ::48] = 1
    img += (np.array(PALETTE["sky"], np.float32) - img) * (grid * ALPHA["grid"])[..., None]
    return Image.fromarray(np.clip(img, 0, 255).astype("uint8"))

def draw_frame(base, t):
    big = base.resize((W * SS, H * SS), Image.BILINEAR)
    d = ImageDraw.Draw(big, "RGBA")
    pts = [node_pos(n, t) for n in nodes]
    for i in range(len(nodes)):
        for j in range(i + 1, len(nodes)):
            dx = pts[i][0] - pts[j][0]; dy = pts[i][1] - pts[j][1]
            dist = math.hypot(dx, dy)
            if dist < LINK_DIST:
                a = int(255 * ALPHA["link"] * (1 - dist / LINK_DIST) * quiet_seg(*pts[i], *pts[j]))
                if a <= 0: continue
                c = PALETTE["mint"] if (nodes[i]["c"] == "mint" and nodes[j]["c"] == "mint") else PALETTE["ink"]
                d.line([(pts[i][0] * SS, pts[i][1] * SS), (pts[j][0] * SS, pts[j][1] * SS)],
                       fill=c + (a,), width=SS)
    for p in pulses:
        u = (t + p["off"]) % 1.0
        x, y = pts[p["n"]]
        rad = (6 + 64 * u) * SS
        a = int(255 * ALPHA["pulse"] * (1 - u) * quiet_ring(x, y, rad / SS))
        if a <= 0: continue
        d.ellipse([x * SS - rad, y * SS - rad, x * SS + rad, y * SS + rad],
                  outline=PALETTE[nodes[p["n"]]["c"]] + (a,), width=SS)
    for n, (x, y) in zip(nodes, pts):
        q = quiet_ring(x, y, n["r"] * 2.6)
        if q <= 0: continue
        r = n["r"] * SS
        col = PALETTE[n["c"]]
        d.ellipse([x * SS - r * 2.6, y * SS - r * 2.6, x * SS + r * 2.6, y * SS + r * 2.6], fill=col + (int(255 * ALPHA["halo"] * q),))
        d.ellipse([x * SS - r, y * SS - r, x * SS + r, y * SS + r], fill=col + (int(255 * ALPHA["dot"] * q),))
    return big.resize((GIF_W, GIF_H), Image.LANCZOS)

def main():
    name = T["name"]
    base = base_layer()
    frames = [draw_frame(base, f / FRAMES) for f in range(FRAMES)]
    pal = frames[0].quantize(colors=255, method=Image.Quantize.MEDIANCUT)
    q = [f.quantize(palette=pal, dither=Image.Dither.NONE) for f in frames]
    q[0].save(os.path.join(ASSETS, f"{name}.gif"), save_all=True, append_images=q[1:],
              duration=FRAME_MS, loop=0, optimize=False, disposal=1)
    frames[0].save(os.path.join(ASSETS, f"{name}_poster.png"))
    with open(os.path.join(ASSETS, f"{name}.json"), "w") as fh:
        json.dump({"W": W, "H": H, "periodMs": FRAMES * FRAME_MS, "linkDist": LINK_DIST, "bg": BG,
                   "palette": PALETTE, "alpha": ALPHA, "nodes": nodes, "pulses": pulses, "glows": glows,
                   "quiet": QUIET, "quietRamp": QUIET_RAMP}, fh)
    print(THEME, "gif bytes", os.path.getsize(os.path.join(ASSETS, f"{name}.gif")))

if __name__ == "__main__":
    main()
