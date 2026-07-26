#!/usr/bin/env python3
"""Fusion Drop UI mockup generator using Pillow."""
import math, random, os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

# Canvas size
W, H = 1280, 720
BG = "#0a0a0f"

# Neon palette
COLORS = {
    "cyan": "#00f0ff",
    "magenta": "#ff00aa",
    "gold": "#ffd700",
    "blue": "#0066ff",
}

# Helpers

def hex_to_rgb(hx):
    hx = hx.lstrip("#")
    return tuple(int(hx[i:i+2], 16) for i in (0, 2, 4))

def rgb_to_hex(t):
    return "#%02x%02x%02x" % t

def blend_colors(c1, c2, a=0.5):
    r1, g1, b1 = hex_to_rgb(c1)
    r2, g2, b2 = hex_to_rgb(c2)
    return rgb_to_hex((int(r1*(1-a)+r2*a), int(g1*(1-a)+g2*a), int(b1*(1-a)+b2*a)))

def draw_glow(draw, x, y, r, color, blur=12, steps=6):
    """Draw a radial glow on the provided ImageDraw context."""
    rr, gg, bb = hex_to_rgb(color)
    for i in range(steps, 0, -1):
        alpha = int(40 * (i / steps))
        radius = r + blur * (steps - i + 1)
        fill = (rr, gg, bb, alpha)
        draw.ellipse([x - radius, y - radius, x + radius, y + radius], fill=fill)

def polygon_points(cx, cy, radius, sides, rotation=0):
    pts = []
    for i in range(sides):
        angle = rotation + (2 * math.pi * i / sides) - math.pi / 2
        pts.append((cx + radius * math.cos(angle), cy + radius * math.sin(angle)))
    return pts

def draw_neon_polygon(draw, cx, cy, radius, sides, color, line_w=3, rotation=0, fill_alpha=40):
    pts = polygon_points(cx, cy, radius, sides, rotation)
    rr, gg, bb = hex_to_rgb(color)
    fill = (rr, gg, bb, fill_alpha)
    draw.polygon(pts, outline=None, fill=fill)
    # inner glow lines
    for offset in range(line_w + 4, 0, -1):
        alpha = int(80 * (offset / (line_w + 4)))
        col = (rr, gg, bb, alpha)
        draw.line(pts + [pts[0]], fill=col, width=max(1, offset))
    # bright edge
    draw.line(pts + [pts[0]], fill=color, width=max(1, line_w))

def draw_particle_trails(draw, shapes):
    for (x, y, r, c) in shapes:
        rr, gg, bb = hex_to_rgb(c)
        for i in range(1, 5):
            alpha = int(30 / i)
            rad = r + i * 3
            draw.ellipse([x-rad, y-rad, x+rad, y+rad], fill=(rr, gg, bb, alpha))

def draw_light_burst(draw, cx, cy, color, size=30):
    rr, gg, bb = hex_to_rgb(color)
    for i in range(8):
        angle = (2 * math.pi * i) / 8
        x1 = cx + size * 0.3 * math.cos(angle)
        y1 = cy + size * 0.3 * math.sin(angle)
        x2 = cx + size * math.cos(angle)
        y2 = cy + size * math.sin(angle)
        draw.line([(x1, y1), (x2, y2)], fill=(rr, gg, bb, 120), width=2)
    # center bright
    for rad in range(size // 2, 0, -2):
        alpha = int(200 * (rad / (size // 2)))
        draw.ellipse([cx-rad, cy-rad, cx+rad, cy+rad], fill=(rr, gg, bb, alpha))

def draw_title(img, draw):
    # Title: FUSION DROP
    try:
        font_large = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 56)
        font_small = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 18)
    except Exception:
        font_large = ImageFont.load_default()
        font_small = ImageFont.load_default()

    title = "FUSION DROP"
    # Measure approximate width
    bbox = draw.textbbox((0, 0), title, font=font_large)
    tw = bbox[2] - bbox[0]
    tx = (W - tw) // 2
    ty = 12

    # Glow layers
    rr, gg, bb = hex_to_rgb(COLORS["cyan"])
    for offset in range(18, 0, -2):
        alpha = int(40 * (offset / 18))
        col = (rr, gg, bb, alpha)
        draw.text((tx, ty), title, font=font_large, fill=col)
        draw.text((tx - offset, ty), title, font=font_large, fill=col)
        draw.text((tx + offset, ty), title, font=font_large, fill=col)

    # Refraction prism-like colors across letters (simple tint shifts per letter)
    shift_colors = [COLORS["cyan"], COLORS["magenta"], COLORS["gold"], COLORS["blue"], COLORS["cyan"], COLORS["magenta"], COLORS["gold"], COLORS["blue"], COLORS["cyan"], COLORS["magenta"], COLORS["gold"]]
    x_cursor = tx
    for idx, ch in enumerate(title):
        cw = draw.textbbox((0, 0), ch, font=font_large)[2] - draw.textbbox((0, 0), ch, font=font_large)[0]
        col = shift_colors[idx % len(shift_colors)]
        draw.text((x_cursor, ty), ch, font=font_large, fill=col)
        x_cursor += cw

    # Subtitle
    sub = "Crystalline Fusion Puzzle"
    sw = draw.textbbox((0, 0), sub, font=font_small)[2] - draw.textbbox((0, 0), sub, font=font_small)[0]
    draw.text(((W - sw) // 2, ty + 58), sub, font=font_small, fill="#99aaff")

def draw_left_panel(draw):
    x0, y0 = 24, 120
    w, h = 220, 420
    # panel border glow
    rr, gg, bb = hex_to_rgb(COLORS["blue"])
    for i in range(10, 0, -1):
        alpha = int(50 * (i / 10))
        draw.rounded_rectangle([x0 - i, y0 - i, x0 + w + i, y0 + h + i], radius=16, outline=(rr, gg, bb, alpha), width=2)
    draw.rounded_rectangle([x0, y0, x0 + w, y0 + h], radius=12, outline=COLORS["blue"], width=2)

    # Score
    try:
        font_score = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 36)
        font_label = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 16)
    except Exception:
        font_score = ImageFont.load_default()
        font_label = ImageFont.load_default()

    draw.text((x0 + 20, y0 + 20), "SCORE", font=font_label, fill="#aab2ff")
    score = "42,680"
    draw.text((x0 + 20, y0 + 46), score, font=font_score, fill=COLORS["cyan"])

    # High score
    draw.text((x0 + 20, y0 + 100), "BEST", font=font_label, fill="#aab2ff")
    draw.text((x0 + 20, y0 + 126), "128,450", font=font_score, fill=COLORS["gold"])

    # Next shape
    draw.text((x0 + 20, y0 + 200), "NEXT", font=font_label, fill="#aab2ff")
    # Hexagonal frame
    hx, hy = x0 + w // 2, y0 + 290
    side = 50
    pts = polygon_points(hx, hy, side, 6, rotation=0)
    rr, gg, bb = hex_to_rgb(COLORS["magenta"])
    for i in range(8, 0, -1):
        alpha = int(60 * (i / 8))
        inflated = [(hx + (p[0] - hx) * (1 + i * 0.02), hy + (p[1] - hy) * (1 + i * 0.02)) for p in pts]
        draw.polygon(inflated, outline=(rr, gg, bb, alpha))
    draw.polygon(pts, outline=COLORS["magenta"], fill=(rr, gg, bb, 30))

    # Small triangle inside
    tri = polygon_points(hx, hy, 22, 3, rotation=math.pi)
    draw.polygon(tri, outline=COLORS["cyan"], fill=hex_to_rgb(COLORS["cyan"]) + (60,))

def draw_center_canvas(draw):
    cx, cy = W // 2, H // 2 + 20
    cw, ch = 560, 520
    x0, y0 = cx - cw // 2, cy - ch // 2
    rr, gg, bb = hex_to_rgb("#111118")
    draw.rectangle([x0, y0, x0 + cw, y0 + ch], fill=(rr, gg, bb, 255))
    # canvas border
    bc = hex_to_rgb(COLORS["cyan"])
    for i in range(12, 0, -1):
        alpha = int(45 * (i / 12))
        draw.rectangle([x0 - i, y0 - i, x0 + cw + i, y0 + ch + i], outline=(bc[0], bc[1], bc[2], alpha), width=2)
    draw.rectangle([x0, y0, x0 + cw, y0 + ch], outline=COLORS["cyan"], width=2)

    # Falling shapes
    shapes = [
        (cx - 60, y0 + 80, 28, 3, COLORS["cyan"]),
        (cx + 40, y0 + 160, 34, 6, COLORS["magenta"]),
        (cx - 10, y0 + 280, 42, 12, COLORS["gold"]),
        (cx + 80, y0 + 360, 38, 8, COLORS["blue"]),
        (cx - 90, y0 + 440, 48, 5, COLORS["cyan"]),
    ]

    for (sx, sy, sr, sides, col) in shapes:
        draw_particle_trails(draw, [(sx, sy, sr, col)])
        draw_neon_polygon(draw, sx, sy, sr, sides, col, rotation=random.uniform(0, math.pi))

    # Fuse event at center-ish
    fx, fy = cx - 20, y0 + 220
    draw_light_burst(draw, fx, fy, COLORS["magenta"], size=50)
    draw_neon_polygon(draw, fx, fy, 40, 20, blend_colors(COLORS["magenta"], COLORS["gold"]), rotation=0.3)

    # Extra small particles around fuse
    for _ in range(12):
        px = fx + random.randint(-50, 50)
        py = fy + random.randint(-50, 50)
        pc = random.choice(list(COLORS.values()))
        rr2, gg2, bb2 = hex_to_rgb(pc)
        draw.ellipse([px-3, py-3, px+3, py+3], fill=(rr2, gg2, bb2, 200))

def draw_right_panel(draw):
    x0, y0 = W - 244, 120
    w, h = 220, 420
    rr, gg, bb = hex_to_rgb(COLORS["magenta"])
    for i in range(10, 0, -1):
        alpha = int(50 * (i / 10))
        draw.rounded_rectangle([x0 - i, y0 - i, x0 + w + i, y0 + h + i], radius=16, outline=(rr, gg, bb, alpha), width=2)
    draw.rounded_rectangle([x0, y0, x0 + w, y0 + h], radius=12, outline=COLORS["magenta"], width=2)

    try:
        font_label = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 16)
        font_title = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 18)
    except Exception:
        font_label = ImageFont.load_default()
        font_title = ImageFont.load_default()

    draw.text((x0 + 20, y0 + 16), "FUSION CHAIN", font=font_title, fill=COLORS["gold"])

    chain = [
        ("Triangle", COLORS["cyan"], 3),
        ("Hexagon", COLORS["magenta"], 6),
        ("Dodecahedron", COLORS["gold"], 12),
        ("Polyhedron", COLORS["blue"], 8),
        ("Crystal Cluster", COLORS["cyan"], 5),
        ("Prism", COLORS["magenta"], 4),
        ("Mega-Crystal", COLORS["gold"], 20),
    ]

    item_h = 50
    start_y = y0 + 56
    for idx, (name, color, sides) in enumerate(chain):
        iy = start_y + idx * item_h
        ix = x0 + 36
        # connecting line
        if idx < len(chain) - 1:
            draw.line([(ix, iy + 18), (ix, iy + item_h - 2)], fill=(255, 255, 255, 60), width=1)
        # small shape
        rr2, gg2, bb2 = hex_to_rgb(color)
        sp = polygon_points(ix, iy + 8, 10, sides, rotation=0.2 * idx)
        draw.polygon(sp, outline=color, fill=(rr2, gg2, bb2, 80))
        # text
        draw.text((ix + 22, iy - 2), name, font=font_label, fill=color)

def draw_bottom_bar(draw):
    x0, y0 = 24, H - 80
    bw = W - 48
    bh = 52
    # border
    rr, gg, bb = hex_to_rgb(COLORS["gold"])
    for i in range(8, 0, -1):
        alpha = int(40 * (i / 8))
        draw.rounded_rectangle([x0 - i, y0 - i, x0 + bw + i, y0 + bh + i], radius=10, outline=(rr, gg, bb, alpha), width=2)
    draw.rounded_rectangle([x0, y0, x0 + bw, y0 + bh], radius=8, outline=COLORS["gold"], width=2)

    try:
        font_label = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 16)
        font_bar = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 18)
    except Exception:
        font_label = ImageFont.load_default()
        font_bar = ImageFont.load_default()

    draw.text((x0 + 20, y0 + 6), "LEVEL 1 — FUSION", font=font_bar, fill=COLORS["cyan"])

    # progress fill
    bar_x, bar_y = x0 + 20, y0 + 32
    bar_w, bar_h = bw - 40, 10
    draw.rounded_rectangle([bar_x, bar_y, bar_x + bar_w, bar_y + bar_h], radius=5, outline="#333344", width=1)
    progress = 0.42
    filled = int(bar_w * progress)
    rr2, gg2, bb2 = hex_to_rgb(COLORS["cyan"])
    for i in range(filled, 0, -1):
        alpha = int(180 * (i / filled))
        draw.line([(bar_x + i, bar_y + 1), (bar_x + i, bar_y + bar_h - 1)], fill=(rr2, gg2, bb2, min(alpha, 220)), width=1)
    # bright leading edge
    draw.line([(bar_x + filled, bar_y), (bar_x + filled, bar_y + bar_h)], fill=(255, 255, 255, 200), width=2)

    perc = f"{int(progress*100)}%"
    draw.text((bar_x + bar_w - 50, y0 + 6), perc, font=font_label, fill="#aabbff")

def main():
    img = Image.new("RGBA", (W, H), BG)
    draw = ImageDraw.Draw(img)

    # subtle background grid
    for x in range(0, W, 40):
        draw.line([(x, 0), (x, H)], fill=(20, 20, 30, 40), width=1)
    for y in range(0, H, 40):
        draw.line([(0, y), (W, y)], fill=(20, 20, 30, 40), width=1)

    draw_title(img, draw)
    draw_left_panel(draw)
    draw_center_canvas(draw)
    draw_right_panel(draw)
    draw_bottom_bar(draw)

    # Vignette overlay
    vignette = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    vdraw = ImageDraw.Draw(vignette)
    for i in range(120, 0, -1):
        alpha = int(100 * (i / 120))
        vdraw.rectangle([i, i, W - i, H - i], outline=(0, 0, 0, alpha))
    img = Image.alpha_composite(img, vignette)

    # slight bloom via blur overlay for neon feel
    bloom = img.filter(ImageFilter.GaussianBlur(radius=2))
    bloom = Image.blend(img, bloom, 0.15)

    # Ensure RGB for PNG
    final = bloom.convert("RGB")
    out = "/home/toon/projects/suika-game/mockup-fusion-final.png"
    final.save(out, "PNG")
    print("Saved", out)

if __name__ == "__main__":
    main()
