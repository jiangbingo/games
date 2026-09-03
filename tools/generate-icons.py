#!/usr/bin/env python3
"""生成游戏中心 PWA 图标（192/512，any + maskable）。

主题对齐主页渐变 #667eea → #764ba2，白色 2x2 圆角磁贴 + 一格 #ffd93d 点缀。
maskable 版全出血无圆角，图形收进中央安全区（<80%）。
"""
from PIL import Image, ImageDraw
import os

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "icons")
C1, C2 = (102, 126, 234), (118, 75, 162)  # #667eea → #764ba2
ACCENT = (255, 217, 61)  # #ffd93d


def gradient(size, radius):
    img = Image.new("RGBA", (size, size))
    px = img.load()
    for y in range(size):
        for x in range(size):
            t = (x + y) / (2 * size - 2)
            px[x, y] = (
                round(C1[0] + (C2[0] - C1[0]) * t),
                round(C1[1] + (C2[1] - C1[1]) * t),
                round(C1[2] + (C2[2] - C1[2]) * t),
                255,
            )
    if radius:
        mask = Image.new("L", (size, size), 0)
        ImageDraw.Draw(mask).rounded_rectangle(
            [0, 0, size - 1, size - 1], radius=radius, fill=255
        )
        img.putalpha(mask)
    return img


def tiles(canvas, box):
    d = ImageDraw.Draw(canvas)
    x0, y0, x1, y1 = box
    gap = (x1 - x0) * 0.09
    cell = ((x1 - x0) - gap) / 2
    radius = cell * 0.28
    positions = [
        (x0, y0),
        (x0 + cell + gap, y0),
        (x0, y0 + cell + gap),
        (x0 + cell + gap, y0 + cell + gap),
    ]
    for i, (cx, cy) in enumerate(positions):
        color = ACCENT if i == 2 else (255, 255, 255, 235)
        d.rounded_rectangle([cx, cy, cx + cell, cy + cell], radius=radius, fill=color)
    return canvas


def make(size, maskable):
    ss = 4  # 4x 超采样抗锯齿
    S = size * ss
    img = gradient(S, 0 if maskable else int(S * 0.2))
    side = S * (0.52 if maskable else 0.58)
    box = ((S - side) / 2, (S - side) / 2, (S + side) / 2, (S + side) / 2)
    tiles(img, box)
    return img.resize((size, size), Image.LANCZOS)


os.makedirs(OUT, exist_ok=True)
for size in (192, 512):
    make(size, False).save(f"{OUT}/icon-{size}.png")
    make(size, True).save(f"{OUT}/icon-maskable-{size}.png")
print("icons generated:", os.path.abspath(OUT))
