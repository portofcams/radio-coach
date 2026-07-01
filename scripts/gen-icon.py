#!/usr/bin/env python3
"""Generate the Clearspar Radio Trainer app icon (mic + radio-wave mark)."""
import math
from PIL import Image, ImageDraw

SIZE = 1024
CX, CY = SIZE // 2, SIZE // 2 - 20

def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))

def make_base():
    img = Image.new("RGB", (SIZE, SIZE))
    top = (56, 189, 248)     # sky-400
    bottom = (37, 99, 235)   # blue-600
    px = img.load()
    for y in range(SIZE):
        t = y / (SIZE - 1)
        # slight diagonal bias to match the original brand gradient direction
        c = lerp(top, bottom, t)
        for x in range(SIZE):
            px[x, y] = c
    return img

def draw_mic(draw):
    white = (255, 255, 255, 255)
    mic_w, mic_h = 200, 320
    mx0, my0 = CX - mic_w // 2, CY - mic_h // 2 - 60
    mx1, my1 = CX + mic_w // 2, my0 + mic_h
    draw.rounded_rectangle([mx0, my0, mx1, my1], radius=mic_w // 2, fill=white)

    # mic stand loop (arc) below capsule
    loop_r = 170
    loop_top = my0 + mic_h - 40
    draw.arc(
        [CX - loop_r, loop_top - loop_r, CX + loop_r, loop_top + loop_r],
        start=25, end=155, fill=white, width=28,
    )
    # stem
    stem_top = loop_top + loop_r - 10
    stem_bottom = stem_top + 90
    draw.rounded_rectangle([CX - 14, stem_top, CX + 14, stem_bottom], radius=14, fill=white)
    # base
    base_w = 170
    draw.rounded_rectangle(
        [CX - base_w // 2, stem_bottom - 5, CX + base_w // 2, stem_bottom + 30],
        radius=15, fill=white,
    )

def draw_radio_waves(img):
    overlay = Image.new("RGBA", img.size, (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay)
    center = (CX, CY - 210)
    radii = [90, 150, 210]
    width = 22
    for i, r in enumerate(radii):
        alpha = int(255 * (1 - i * 0.22))
        od.arc(
            [center[0] - r, center[1] - r, center[0] + r, center[1] + r],
            start=200, end=340, fill=(255, 255, 255, alpha), width=width,
        )
    img.paste(Image.alpha_composite(img.convert("RGBA"), overlay).convert("RGB"), (0, 0))

def main():
    img = make_base()
    draw_radio_waves(img)
    draw = ImageDraw.Draw(img, "RGBA")
    draw_mic(draw)
    out = "assets/icon-master-1024.png"
    import os
    os.makedirs("assets", exist_ok=True)
    img.save(out)
    print(f"wrote {out}")

if __name__ == "__main__":
    main()
