"""Generate every site asset: gallery mockups, monitor posters, loop videos,
CSS masks, QR code and favicon. Run: python3 tools/make_assets.py"""
import math
import os
import random
import subprocess
import tempfile
import urllib.request

import imageio_ffmpeg
import numpy as np
import qrcode
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TTF = os.path.join(ROOT, "tools", ".fonts")

# Open source fonts used only for drawing the mockups. The site itself serves
# the subset woff2 files in assets/fonts.
FONT_SOURCES = {
    "BigShouldersDisplay_wght.ttf":
        "https://github.com/google/fonts/raw/main/ofl/bigshouldersdisplay/BigShouldersDisplay%5Bwght%5D.ttf",
    "MartianMono_wdth_wght.ttf":
        "https://github.com/google/fonts/raw/main/ofl/martianmono/MartianMono%5Bwdth%2Cwght%5D.ttf",
    "BodoniModa_opsz_wght.ttf":
        "https://github.com/google/fonts/raw/main/ofl/bodonimoda/BodoniModa%5Bopsz%2Cwght%5D.ttf",
}


def ensure_fonts():
    os.makedirs(TTF, exist_ok=True)
    for name, url in FONT_SOURCES.items():
        dest = os.path.join(TTF, name)
        if os.path.exists(dest) and os.path.getsize(dest) > 1000:
            continue
        print("fetching", name)
        urllib.request.urlretrieve(url, dest)


DISPLAY = os.path.join(TTF, "BigShouldersDisplay_wght.ttf")
MONO = os.path.join(TTF, "MartianMono_wdth_wght.ttf")
EDITORIAL = os.path.join(TTF, "BodoniModa_opsz_wght.ttf")

BG = (14, 14, 14)
FG = (232, 232, 232)
MID = (140, 140, 140)
DIM = (74, 74, 74)
LINE = (48, 48, 48)
W, H = 1200, 900
rng = random.Random(20261026)


def display(size, weight=800):
    f = ImageFont.truetype(DISPLAY, size)
    f.set_variation_by_axes([weight])
    return f


def mono(size, weight=400, width=100):
    f = ImageFont.truetype(MONO, size)
    f.set_variation_by_axes([width, weight])
    return f


def editorial(size, weight=400, opsz=18):
    f = ImageFont.truetype(EDITORIAL, size)
    f.set_variation_by_axes([opsz, weight])
    return f


def canvas(w=W, h=H, bg=BG):
    img = Image.new("RGB", (w, h), bg)
    return img, ImageDraw.Draw(img)


def grain(img, amount=9):
    a = np.asarray(img).astype(np.int16)
    n = np.random.normal(0, amount, a.shape[:2])[..., None]
    return Image.fromarray(np.clip(a + n, 0, 255).astype(np.uint8))


def star(d, cx, cy, r, fill=None, outline=None, width=3):
    """Four point star: points on the axes, concave waist."""
    pts = []
    k = r * 0.14
    for i in range(4):
        a = math.radians(90 * i - 90)
        pts.append((cx + math.cos(a) * r, cy + math.sin(a) * r))
        b = a + math.radians(45)
        pts.append((cx + math.cos(b) * k, cy + math.sin(b) * k))
    d.polygon(pts, fill=fill, outline=outline, width=width)


def grid(d, step=60, w=W, h=H, color=(30, 30, 30)):
    for x in range(0, w, step):
        d.line([(x, 0), (x, h)], fill=color)
    for y in range(0, h, step):
        d.line([(0, y), (w, y)], fill=color)


def chrome(img, d, label, index):
    d.rectangle([0, 0, W - 1, H - 1], outline=LINE, width=2)
    d.text((46, 40), f"{index:02d}", font=mono(26), fill=DIM)
    d.text((W - 46, 40), label.upper(), font=mono(22), fill=DIM, anchor="ra")
    for cx, cy in ((22, 22), (W - 22, 22), (22, H - 22), (W - 22, H - 22)):
        d.line([(cx - 9, cy), (cx + 9, cy)], fill=DIM)
        d.line([(cx, cy - 9), (cx, cy + 9)], fill=DIM)
    d.line([(0, H - 62), (W, H - 62)], fill=LINE)
    d.text((46, H - 42), "FRAME / CASE STUDY", font=mono(18), fill=DIM, anchor="lm")
    d.text((W - 46, H - 42), "2026", font=mono(18), fill=DIM, anchor="rm")


def glass(d, box, radius=18):
    x0, y0, x1, y1 = box
    d.rounded_rectangle(box, radius, fill=(30, 30, 30), outline=(70, 70, 70), width=2)
    d.line([(x0 + 12, y0 + 12), (x1 - 12, y0 + 12)], fill=(90, 90, 90), width=2)


# ------------------------------------------------------------------ artworks
def art_branding():
    img, d = canvas()
    grid(d, 75, color=(26, 26, 26))
    star(d, 600, 430, 300, outline=FG, width=6)
    star(d, 600, 430, 150, fill=FG)
    d.text((70, 690), "BRANDING", font=display(150, 900), fill=FG)
    d.text((74, 812), "MARK · GRID · SYSTEM", font=mono(20), fill=MID)
    d.text((1130, 812), "01 / 12", font=mono(20), fill=DIM, anchor="ra")
    return grain(img)


def art_uikit():
    img, d = canvas()
    d.text((70, 110), "UI KIT", font=display(110, 900), fill=FG)
    d.text((70, 226), "COMPONENT STATES", font=mono(20), fill=MID)
    for i, lab in enumerate(["DEFAULT", "HOVER", "ACTIVE", "DISABLED"]):
        y = 320 + i * 90
        fill = [None, FG, FG, (40, 40, 40)][i]
        d.rounded_rectangle([70, y, 330, y + 60], 30, fill=fill,
                            outline=None if fill else MID, width=2)
        d.text((200, y + 30), lab, font=mono(18),
               fill=BG if i in (1, 2) else MID, anchor="mm")
    for i in range(3):
        y = 320 + i * 90
        d.rounded_rectangle([390, y + 10, 430, y + 50], 20, outline=MID, width=2)
        if i < 2:
            d.ellipse([392, y + 12, 428, y + 48], fill=FG if i else None, outline=MID)
    d.rectangle([500, 330, 1130, 390], outline=MID, width=2)
    d.text((520, 360), "input field placeholder", font=mono(18), fill=DIM, anchor="lm")
    d.rectangle([500, 420, 700, 480], outline=MID, width=2)
    d.text((510, 450), "dropdown ▾", font=mono(18), fill=MID, anchor="lm")
    for i in range(8):
        x = 500 + i * 80
        d.rectangle([x, 520, x + 62, 582], outline=LINE, width=2)
        if i % 3:
            d.rectangle([x, 520, x + 62, 582], fill=(38, 38, 38))
    d.text((70, 700), "8PT GRID · 4PT RADIUS SCALE · 2PX STROKE", font=mono(20), fill=MID)
    chrome(img, d, "UI design", 2)
    return grain(img)


def art_landing():
    img, d = canvas()
    d.text((70, 110), "SHIP THE", font=display(120, 900), fill=FG)
    d.text((70, 236), "INTERFACE", font=display(120, 900), fill=DIM)
    d.text((74, 380), "PLANS THAT SCALE WITH YOUR TEAM.", font=mono(20), fill=MID)
    d.rounded_rectangle([70, 430, 300, 490], 30, fill=FG)
    d.text((185, 460), "START FREE", font=mono(20), fill=BG, anchor="mm")
    d.rounded_rectangle([320, 430, 520, 490], 30, outline=MID, width=2)
    d.text((420, 460), "PRICING", font=mono(20), fill=MID, anchor="mm")
    for i in range(3):
        x = 70 + i * 250
        glass(d, (x, 560, x + 220, 760))
        d.text((x + 30, 600), ["STARTER", "STUDIO", "SCALE"][i], font=mono(18), fill=MID)
        d.text((x + 30, 636), ["19", "49", "129"][i], font=display(64, 700), fill=FG)
        d.line([(x + 30, 720), (x + 190, 720)], fill=LINE, width=2)
    chrome(img, d, "Landing page", 3)
    return grain(img)


def art_saas():
    img, d = canvas()
    d.text((70, 120), "KORUS", font=display(120, 900), fill=FG)
    d.text((74, 246), "SAAS PLATFORM — PRICING & ONBOARDING", font=mono(20), fill=MID)
    glass(d, (70, 320, 620, 700))
    for i in range(6):
        y = 370 + i * 50
        d.text((105, y), f"FEATURE {i + 1}", font=mono(18), fill=MID, anchor="lm")
        d.line([(300, y), (580, y)], fill=LINE, width=2)
    glass(d, (680, 320, 1130, 700))
    d.text((720, 370), "GROWTH", font=mono(18), fill=MID)
    d.text((720, 410), "+184%", font=display(80, 700), fill=FG)
    for i in range(9):
        h = 40 + 120 * abs(math.sin(i * 0.7))
        d.rectangle([720 + i * 44, 660 - h, 750 + i * 44, 660], fill=FG if i % 2 else DIM)
    d.text((70, 790), "DESIGN & CODE — NO LOST INTENT", font=mono(20), fill=DIM)
    chrome(img, d, "Korus — SaaS", 4)
    return grain(img)


def art_dashboard():
    img, d = canvas()
    grid(d, 50, color=(24, 24, 24))
    d.text((70, 120), "SBE HUB", font=display(96, 900), fill=FG)
    d.text((72, 232), "GLASSMORPHISM CONTROL SURFACE", font=mono(20), fill=MID)
    glass(d, (70, 300, 560, 470))
    for i, h in enumerate([60, 110, 80, 150, 95, 130, 70]):
        x = 105 + i * 62
        d.rectangle([x, 440 - h, x + 34, 440], fill=MID if i % 2 else FG)
    glass(d, (600, 300, 1130, 470))
    pts = [(620 + i * 46, 420 - v) for i, v in
           enumerate([30, 70, 45, 100, 60, 120, 85, 130, 95, 140, 110])]
    d.line(pts, fill=FG, width=3, joint="curve")
    for p in pts:
        d.ellipse([p[0] - 4, p[1] - 4, p[0] + 4, p[1] + 4], fill=FG)
    for i in range(3):
        glass(d, (70 + i * 360, 510, 410 + i * 360, 760))
        d.text((100 + i * 360, 560), ["SESSIONS", "RETENTION", "LATENCY"][i],
               font=mono(18), fill=MID)
        d.text((100 + i * 360, 600), ["12.4K", "68%", "42MS"][i],
               font=display(72, 700), fill=FG)
    chrome(img, d, "Dashboard", 5)
    return grain(img)


def art_motion():
    img, d = canvas()
    d.text((70, 110), "MOTION", font=display(110, 900), fill=FG)
    d.text((70, 226), "FRAME SEQUENCE / 24FPS", font=mono(20), fill=MID)
    for i in range(5):
        x = 70 + i * 214
        d.rectangle([x, 320, x + 190, 470], fill=(24, 24, 24), outline=LINE, width=2)
        d.ellipse([x + 60 + i * 14, 370, x + 130 + i * 14, 440], outline=MID, width=3)
    d.line([(70, 560), (1130, 560)], fill=LINE, width=2)
    for i in range(24):
        x = 70 + i * 44
        h = 20 + 90 * abs(math.sin(i * 0.5))
        d.rectangle([x, 760 - h, x + 24, 760], fill=FG if i % 3 else DIM)
    d.text((70, 800), "TIMELINE 00:00 — 00:24", font=mono(18), fill=DIM)
    chrome(img, d, "Motion", 6)
    return grain(img)


def art_glass():
    img, d = canvas()
    for _ in range(70):
        x, y = rng.uniform(-200, W), rng.uniform(-200, H)
        r = rng.uniform(80, 420)
        col = rng.choice([(40, 40, 40), (26, 26, 26), (60, 60, 60)])
        d.ellipse([x - r, y - r, x + r, y + r], fill=col)
    img = img.filter(ImageFilter.GaussianBlur(60))
    d = ImageDraw.Draw(img)
    d.rectangle([0, 0, W - 1, H - 1], outline=LINE, width=2)
    for i in range(4):
        x, y = 90 + i * 280, 300 + (i % 2) * 60
        d.rounded_rectangle([x, y, x + 230, y + 190], 22,
                            fill=(28, 28, 28), outline=(96, 96, 96), width=3)
        d.text((x + 26, y + 30), "GLASS", font=mono(20), fill=MID)
        d.text((x + 26, y + 70), f"0{i + 1}", font=display(64, 700), fill=FG)
        d.line([(x + 26, y + 140), (x + 200, y + 140)], fill=(90, 90, 90), width=2)
    d.text((70, 120), "GLASSMORPHISM", font=display(96, 900), fill=FG)
    d.text((74, 232), "BLUR · DEPTH · LAYERING", font=mono(20), fill=MID)
    chrome(img, d, "Glassmorphism", 7)
    return grain(img)


def art_analytics():
    img, d = canvas()
    grid(d, 60, color=(24, 24, 24))
    d.text((70, 110), "DASHBOARD", font=display(110, 900), fill=FG)
    d.text((70, 226), "REALTIME ANALYTICS", font=mono(20), fill=MID)
    for k, off in enumerate((0, 40)):
        pts = [(70 + i * 55, 600 - off - (120 + 150 * abs(math.sin(i * 0.45 + k))))
               for i in range(20)]
        d.line(pts, fill=FG if not k else DIM, width=3, joint="curve")
    for i in range(20):
        h = 30 + 200 * abs(math.sin(i * 0.9))
        d.rectangle([70 + i * 55, 800 - h, 100 + i * 55, 800], fill=(44, 44, 44))
    d.text((70, 830), "UPTIME 99.98% · RPS 1.2K", font=mono(18), fill=MID)
    chrome(img, d, "Dashboard", 8)
    return grain(img)


def art_identity():
    img, d = canvas()
    d.text((70, 110), "IDENTITY", font=display(110, 900), fill=FG)
    d.text((70, 226), "LOGOTYPE CONSTRUCTION", font=mono(20), fill=MID)
    for r in range(2):
        for c in range(4):
            x, y = 70 + c * 268, 320 + r * 260
            d.rectangle([x, y, x + 240, y + 232], outline=LINE, width=2)
            star(d, x + 120, y + 116, 54 if (r + c) % 2 else 40,
                 fill=FG if (r + c) % 2 else None, outline=MID)
    chrome(img, d, "Identity", 9)
    return grain(img)


def art_typography():
    img, d = canvas()
    d.text((70, 90), "Aa", font=editorial(300, 700), fill=FG)
    d.text((470, 150), "BODONI", font=editorial(96, 500), fill=FG)
    d.text((474, 268), "DISPLAY SPECIMEN — OPSZ 18", font=mono(20), fill=MID)
    for i, (w, label) in enumerate([(300, "LIGHT"), (500, "REGULAR"), (700, "BOLD")]):
        y = 460 + i * 130
        d.text((70, y), "Aa Bb Cc 123", font=editorial(72, w), fill=FG)
        d.text((760, y + 30), label, font=mono(20), fill=MID)
        d.line([(70, y + 110), (1130, y + 110)], fill=LINE, width=2)
    chrome(img, d, "Typography", 10)
    return grain(img)


def art_tokens():
    img, d = canvas()
    d.text((70, 110), "DESIGN SYSTEM", font=display(96, 900), fill=FG)
    d.text((70, 222), "TOKENS · SCALE · RHYTHM", font=mono(20), fill=MID)
    for i, s in enumerate([10, 26, 44, 74, 110, 150, 190, 232]):
        x = 70 + i * 132
        d.rectangle([x, 300, x + 110, 470], fill=(s, s, s), outline=LINE, width=2)
        d.text((x, 490), f"{s:02X}", font=mono(18), fill=MID)
    for i, (lab, val) in enumerate([("SPACE", "4 · 8 · 16 · 32"), ("TYPE", "12 — 120"),
                                    ("WEIGHT", "300 — 900"), ("RADIUS", "0 · 4 · 24")]):
        y = 570 + i * 70
        d.text((70, y), lab, font=mono(20), fill=MID, anchor="lm")
        d.text((1130, y), val, font=mono(20), fill=FG, anchor="rm")
        d.line([(70, y + 34), (1130, y + 34)], fill=LINE, width=2)
    chrome(img, d, "Design system", 11)
    return grain(img)


def art_shader():
    img, d = canvas()
    cx, cy = 600, 450
    for i in range(46, 0, -1):
        r = i * 12
        col = int(20 + 200 * (abs(math.sin(i * 0.35)) ** 3))
        d.ellipse([cx - r, cy - r * 0.86, cx + r, cy + r * 0.86],
                  outline=(col, col, col), width=3)
    for i in range(0, 46, 2):
        r = i * 12
        a = i * 0.22
        d.line([(cx + math.cos(a) * r, cy + math.sin(a) * r * 0.86),
                (cx + math.cos(a) * (r + 12), cy + math.sin(a) * (r + 12) * 0.86)],
               fill=DIM, width=2)
    d.text((70, 110), "WEBGL", font=display(110, 900), fill=FG)
    d.text((70, 226), "SHADER STUDY — FRAGMENT LOOP", font=mono(20), fill=MID)
    chrome(img, d, "Screen capture", 12)
    return grain(img)


ARTS = [
    (art_branding, "work-01", "Branding"),
    (art_uikit, "work-02", "UI Design"),
    (art_landing, "work-03", "Landing Page"),
    (art_saas, "work-04", "Korus — SaaS"),
    (art_dashboard, "work-05", "SBE Hub"),
    (art_motion, "work-06", "Motion"),
    (art_glass, "work-07", "Glassmorphism"),
    (art_analytics, "work-08", "Dashboard"),
    (art_identity, "work-09", "Identity"),
    (art_typography, "work-10", "Typography"),
    (art_tokens, "work-11", "Design"),
    (art_shader, "work-12", "Design & Code"),
]

# monitor wall: camera id, label, artwork index
MONITORS = [
    ("CAM-01", "Session 01", 2), ("CAM-02", "Session 02", 3),
    ("CAM-03", "Session 03", 4), ("CAM-04", "Session 06", 6),
    ("CAM-05", "Session 04", 5), ("CAM-06", "Session 05", 6),
    ("CAM-07", "Hero Design", 10), ("CAM-08", "Session 07", 8),
    ("CAM-09", "Session 08", 9), ("CAM-10", "Session 09", 11),
    ("CAM-11", "Claude Motion", 12), ("CAM-12", "Motion Reel", 7),
    ("CAM-13", "Screen Capture", 12),
]

VIDEO_NAMES = {"CAM-07": "hero-reel", "CAM-11": "claude-motion-reel",
               "CAM-12": "motion-reel", "CAM-13": "screen-rec"}


def make_posters(arts):
    out = {}
    for cam, label, art_idx in MONITORS:
        src = arts[f"work-{art_idx:02d}"].copy()
        n = int(cam[-2:])
        scale = 1.0 + (n % 5) * 0.06
        nw, nh = int(W * scale), int(H * scale)
        v = src.resize((nw, nh), Image.LANCZOS)
        left = max(0, (nw - W) // 2 + (n % 3) * 8 - 8)
        top = max(0, (nh - H) // 2 - (n % 4) * 6)
        v = v.crop((left, top, left + W, top + H))
        v = grain(v, 14)
        d = ImageDraw.Draw(v)
        for _ in range(220):
            y = rng.randrange(H)
            d.line([(0, y), (W, y)], fill=(rng.randrange(18, 46),) * 3)
        name = VIDEO_NAMES.get(cam, f"rec-{cam[-2:]}")
        out[cam] = (name, v)
    return out


def make_videos(posters, tmp):
    ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
    vw, vh = 640, 480
    for cam, (name, poster) in posters.items():
        base = poster.resize((vw, vh), Image.LANCZOS)
        for i in range(20):
            ph = i / 20
            zoom = 1.0 + 0.05 * math.sin(ph * math.tau)
            nw, nh = int(vw * zoom), int(vh * zoom)
            f = base.resize((nw, nh), Image.BILINEAR).crop(
                ((nw - vw) // 2, (nh - vh) // 2,
                 (nw - vw) // 2 + vw, (nh - vh) // 2 + vh))
            f = grain(f, 16)
            d = ImageDraw.Draw(f)
            d.text((12, 10), "● REC", font=mono(15, 700), fill=(204, 34, 34))
            d.text((vw - 12, 10), cam, font=mono(14), fill=(200, 200, 200), anchor="ra")
            d.text((12, vh - 22), f"2026-10-26 {i // 5:02d}:{(i * 3) % 60:02d}:{i:02d}",
                   font=mono(13), fill=(150, 150, 150))
            d.text((vw - 12, vh - 22), name.upper(), font=mono(13),
                   fill=(150, 150, 150), anchor="ra")
            band = int(vh * ((ph * 1.7) % 1.0))
            d.rectangle([0, band, vw, band + 14], fill=(48, 48, 48))
            f.save(os.path.join(tmp, f"f{i:03d}.png"))
        out = os.path.join(ROOT, "assets", "works", f"{name}.mp4")
        subprocess.run([ffmpeg, "-y", "-loglevel", "error", "-framerate", "4",
                        "-i", os.path.join(tmp, "f%03d.png"), "-c:v", "libx264",
                        "-pix_fmt", "yuv420p", "-crf", "34", "-preset", "veryfast",
                        "-movflags", "+faststart", out], check=True)
        print("video", name, os.path.getsize(out) // 1024, "KB")


def make_ghost():
    S = 512
    m = Image.new("L", (S, S), 0)
    d = ImageDraw.Draw(m)
    d.pieslice([40, 30, S - 40, S - 130], 180, 360, fill=255)
    d.rectangle([40, S // 2 - 20, S - 40, S - 120], fill=255)
    steps = 5
    w = (S - 80) / steps
    for i in range(steps):
        x0 = 40 + i * w
        d.pieslice([x0, S - 170, x0 + w, S - 70], 0, 180, fill=255)
    d.ellipse([158, 188, 222, 272], fill=0)
    d.ellipse([290, 188, 354, 272], fill=0)
    m = m.filter(ImageFilter.GaussianBlur(1.5))
    img = Image.new("RGBA", (S, S), (255, 255, 255, 0))
    img.putalpha(m)
    img.resize((256, 256), Image.LANCZOS).save(
        os.path.join(ROOT, "assets", "images", "ghost-icon.png"))
    print("ghost icon done")


def make_subject():
    """Portrait silhouette consumed as a CSS mask in the contact section."""
    w, h = 431, 578
    img = Image.new("L", (w, h), 0)
    d = ImageDraw.Draw(img)
    cx = w // 2
    d.ellipse([cx - 92, 78, cx + 92, 300], fill=255)
    d.rectangle([cx - 34, 270, cx + 34, 350], fill=255)
    d.rounded_rectangle([cx - 190, 330, cx + 190, h], 60, fill=255)
    d.ellipse([cx - 118, 40, cx + 118, 150], fill=255)
    d.arc([cx - 132, 60, cx + 132, 320], 180, 360, fill=255, width=16)
    d.ellipse([cx - 150, 176, cx - 100, 256], fill=255)
    d.ellipse([cx + 100, 176, cx + 150, 256], fill=255)
    img.filter(ImageFilter.GaussianBlur(2)).save(
        os.path.join(ROOT, "assets", "images", "subject.png"))
    print("subject mask done")


def make_fringe():
    """24 frame sprite of a vertical line fringe, animated via mask-position."""
    fw, fh, frames = 400, 200, 24
    img = Image.new("L", (fw * frames, fh), 0)
    d = ImageDraw.Draw(img)
    for f in range(frames):
        x = f * fw
        for i in range(0, fw, 3):
            hh = int(fh * (0.25 + 0.75 * abs(math.sin(i * 0.21 + f * 0.9))))
            d.line([(x + i, fh - hh), (x + i, fh)], fill=255)
    img.save(os.path.join(ROOT, "assets", "images", "fringe.png"))
    print("fringe sprite done")


def make_qr():
    q = qrcode.QRCode(border=0, box_size=12)
    q.add_data("https://www.instagram.com/")
    q.make()
    m = q.get_matrix()
    n = len(m)
    img = Image.new("RGBA", (n * 12, n * 12), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    for y, row in enumerate(m):
        for x, cell in enumerate(row):
            if cell:
                d.rectangle([x * 12, y * 12, x * 12 + 11, y * 12 + 11],
                            fill=(255, 255, 255, 255))
    img.save(os.path.join(ROOT, "assets", "images", "qr-instagram.png"))
    print("qr done")


def make_favicon():
    svg = ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 49 49">'
           '<rect width="49" height="49" fill="#000"/>'
           '<path fill="#E2E2E2" d="M24.5 0 27.8 21.2 49 24.5 27.8 27.8 24.5 49 '
           '21.2 27.8 0 24.5 21.2 21.2Z"/></svg>')
    with open(os.path.join(ROOT, "assets", "favicon.svg"), "w") as f:
        f.write(svg)


def main():
    ensure_fonts()
    for sub in ("works", "images"):
        os.makedirs(os.path.join(ROOT, "assets", sub), exist_ok=True)
    arts = {}
    for fn, name, _label in ARTS:
        img = fn()
        img.save(os.path.join(ROOT, "assets", "works", f"{name}.webp"),
                 "WEBP", quality=78, method=6)
        arts[name] = img
        print("art", name, "done")
    posters = make_posters(arts)
    for _cam, (name, img) in posters.items():
        img.save(os.path.join(ROOT, "assets", "works", f"{name}-poster.jpg"),
                 "JPEG", quality=72, optimize=True)
    with tempfile.TemporaryDirectory() as tmp:
        make_videos(posters, tmp)
    make_ghost()
    make_subject()
    make_fringe()
    make_qr()
    make_favicon()
    print("all assets written")


if __name__ == "__main__":
    main()
