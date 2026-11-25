"""Generate the animated 'citation network' background.

Outputs (in ../assets):
  bg.gif     - seamless looping GIF used as the PowerPoint slide background
  bg.json    - the same node/glow data, so the HTML canvas draws the identical scene
"""
import json, math, os, random
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

BG = (7, 11, 25)
PALETTE = {               # trust-label colours (see spec.js)
    "ink":    (160, 178, 228),
    "mint":   (46, 230, 166),
    "sky":    (110, 182, 255),
    "violet": (177, 140, 255),
    "amber":  (255, 181, 71),
    "rose":   (255, 93, 122),
}

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

glows = [  # x, y (fraction of W/H), radius px, colour, peak alpha
    {"x": 0.10, "y": 0.08, "r": 560, "c": "mint",   "a": 0.13},
    {"x": 0.95, "y": 0.98, "r": 640, "c": "violet", "a": 0.15},
    {"x": 0.78, "y": 0.12, "r": 420, "c": "sky",    "a": 0.07},
]

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
    img += (np.array(PALETTE["sky"], np.float32) - img) * (grid * 0.035)[..., None]
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
                a = int(255 * 0.20 * (1 - dist / LINK_DIST))
                c = PALETTE["mint"] if (nodes[i]["c"] == "mint" and nodes[j]["c"] == "mint") else PALETTE["ink"]
                d.line([(pts[i][0] * SS, pts[i][1] * SS), (pts[j][0] * SS, pts[j][1] * SS)],
                       fill=c + (a,), width=SS)
    for p in pulses:
        u = (t + p["off"]) % 1.0
        x, y = pts[p["n"]]
        rad = (6 + 64 * u) * SS
        a = int(255 * 0.45 * (1 - u))
        d.ellipse([x * SS - rad, y * SS - rad, x * SS + rad, y * SS + rad],
                  outline=PALETTE[nodes[p["n"]]["c"]] + (a,), width=SS)
    for n, (x, y) in zip(nodes, pts):
        r = n["r"] * SS
        col = PALETTE[n["c"]]
        d.ellipse([x * SS - r * 2.6, y * SS - r * 2.6, x * SS + r * 2.6, y * SS + r * 2.6], fill=col + (28,))
        d.ellipse([x * SS - r, y * SS - r, x * SS + r, y * SS + r], fill=col + (200,))
    return big.resize((GIF_W, GIF_H), Image.LANCZOS)

def main():
    base = base_layer()
    frames = [draw_frame(base, f / FRAMES) for f in range(FRAMES)]
    pal = frames[0].quantize(colors=255, method=Image.Quantize.MEDIANCUT)
    q = [f.quantize(palette=pal, dither=Image.Dither.NONE) for f in frames]
    q[0].save(os.path.join(ASSETS, "bg.gif"), save_all=True, append_images=q[1:],
              duration=FRAME_MS, loop=0, optimize=False, disposal=1)
    frames[0].save(os.path.join(ASSETS, "bg_poster.png"))
    with open(os.path.join(ASSETS, "bg.json"), "w") as fh:
        json.dump({"W": W, "H": H, "periodMs": FRAMES * FRAME_MS, "linkDist": LINK_DIST,
                   "bg": BG, "palette": PALETTE, "nodes": nodes, "pulses": pulses, "glows": glows}, fh)
    print("gif bytes", os.path.getsize(os.path.join(ASSETS, "bg.gif")))

if __name__ == "__main__":
    main()
