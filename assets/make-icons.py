# Draws the app icon and writes the three PNG files next to this script.
# The icon: a gold star with a note stem in a night sky, above piano keys.
#
# Run it again after changing the drawing:
#     python3 assets/make-icons.py
# It uses only Python's built-in tools, so there is nothing to install.

import math, os, struct, zlib

SKY = (35, 29, 92)
GOLD = (255, 201, 60)
WHITE = (255, 255, 255)
INK = (23, 18, 63)
SPECK = (150, 145, 205)

def star(cx, cy, outer, inner):
    points = []
    for i in range(10):
        angle = -math.pi / 2 + i * math.pi / 5
        r = outer if i % 2 == 0 else inner
        points.append((cx + r * math.cos(angle), cy + r * math.sin(angle)))
    return points

def in_polygon(x, y, points):
    inside = False
    for i in range(len(points)):
        x1, y1 = points[i]
        x2, y2 = points[(i + 1) % len(points)]
        if (y1 > y) != (y2 > y) and x < (x2 - x1) * (y - y1) / (y2 - y1) + x1:
            inside = not inside
    return inside

# Everything is measured on a square from 0 to 1. Later shapes cover earlier ones.
# The star and stem stay inside the middle of the square, because some
# devices trim the edges of an icon into a circle or rounded square.
KEYS_TOP = 0.70
STAR = star(0.44, 0.41, 0.21, 0.097)
SHAPES = [
    ("circle", (0.20, 0.20, 0.012), SPECK),
    ("circle", (0.80, 0.30, 0.014), SPECK),
    ("circle", (0.86, 0.13, 0.010), SPECK),
    ("circle", (0.22, 0.56, 0.010), SPECK),
    ("rect", (0.592, 0.13, 0.630, 0.40), GOLD),      # the note stem
    ("polygon", [(0.630, 0.13), (0.745, 0.215), (0.745, 0.275), (0.630, 0.195)], GOLD),  # its flag
    ("polygon", STAR, GOLD),
    ("rect", (0.0, KEYS_TOP, 1.0, 1.0), WHITE),      # white keys
] + [("rect", (x - 0.006, KEYS_TOP, x + 0.006, 1.0), INK) for x in (0.2, 0.4, 0.6, 0.8)] \
  + [("rect", (x - 0.055, KEYS_TOP, x + 0.055, 0.88), INK) for x in (0.2, 0.4, 0.8)]

def color_at(x, y):
    color = SKY
    for kind, shape, fill in SHAPES:
        if kind == "rect":
            hit = shape[0] <= x < shape[2] and shape[1] <= y < shape[3]
        elif kind == "circle":
            hit = (x - shape[0]) ** 2 + (y - shape[1]) ** 2 <= shape[2] ** 2
        else:
            hit = in_polygon(x, y, shape)
        if hit:
            color = fill
    return color

def write_png(size, path, samples=3):
    rows = []
    for py in range(size):
        row = bytearray([0])
        for px in range(size):
            total = [0, 0, 0]
            for sy in range(samples):
                for sx in range(samples):
                    c = color_at((px + (sx + 0.5) / samples) / size, (py + (sy + 0.5) / samples) / size)
                    for i in range(3):
                        total[i] += c[i]
            row += bytes(round(t / samples ** 2) for t in total)
        rows.append(bytes(row))
    def chunk(kind, data):
        return struct.pack(">I", len(data)) + kind + data + struct.pack(">I", zlib.crc32(kind + data) & 0xFFFFFFFF)
    with open(path, "wb") as out:
        out.write(b"\x89PNG\r\n\x1a\n"
                  + chunk(b"IHDR", struct.pack(">IIBBBBB", size, size, 8, 2, 0, 0, 0))
                  + chunk(b"IDAT", zlib.compress(b"".join(rows), 9))
                  + chunk(b"IEND", b""))

here = os.path.dirname(os.path.abspath(__file__))
for size, name in [(180, "apple-touch-icon.png"), (192, "icon-192.png"), (512, "icon-512.png")]:
    write_png(size, os.path.join(here, name))
    print("wrote", name)
