#!/usr/bin/env python3
"""Crop a labeled panel from a multi-panel figure composite."""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image


def trim_margins(im: Image.Image, bg_tolerance: int = 18) -> Image.Image:
    rgb = im.convert("RGB")
    pixels = rgb.load()
    w, h = rgb.size
    corners = [pixels[0, 0], pixels[w - 1, 0], pixels[0, h - 1], pixels[w - 1, h - 1]]
    bg = tuple(sum(c[i] for c in corners) // len(corners) for i in range(3))

    def is_bg(px: tuple[int, int, int]) -> bool:
        return all(abs(px[i] - bg[i]) <= bg_tolerance for i in range(3))

    bbox = None
    for y in range(h):
        for x in range(w):
            if not is_bg(pixels[x, y]):
                if bbox is None:
                    bbox = [x, y, x, y]
                else:
                    bbox[0] = min(bbox[0], x)
                    bbox[1] = min(bbox[1], y)
                    bbox[2] = max(bbox[2], x)
                    bbox[3] = max(bbox[3], y)
    if not bbox:
        return im
    pad = 2
    return rgb.crop(
        (
            max(0, bbox[0] - pad),
            max(0, bbox[1] - pad),
            min(w, bbox[2] + pad + 1),
            min(h, bbox[3] + pad + 1),
        )
    )


def flatten_background(im: Image.Image, threshold: int = 30) -> Image.Image:
    rgb = im.convert("RGB")
    pixels = rgb.load()
    w, h = rgb.size
    for y in range(h):
        for x in range(w):
            r, g, b = pixels[x, y]
            if r <= threshold and g <= threshold and b <= threshold:
                pixels[x, y] = (255, 255, 255)
    return rgb


def crop_panel_e(fig_path: Path) -> Image.Image:
    im = Image.open(fig_path).convert("RGB")
    w, h = im.size
    # Fig. 1 layout: (e) bottom-right schematic — below the (c) photo column.
    crop = im.crop((int(w * 0.67), int(h * 0.63), w - 1, h - 1))
    crop = trim_margins(crop)
    return flatten_background(crop)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--width", type=int, default=668, help="Output width in px (McMahon figures)")
    args = parser.parse_args()

    panel = crop_panel_e(args.source)
    if args.width and panel.width != args.width:
        scale = args.width / panel.width
        panel = panel.resize(
            (args.width, max(1, round(panel.height * scale))),
            Image.Resampling.LANCZOS,
        )
    args.output.parent.mkdir(parents=True, exist_ok=True)
    panel.save(args.output, optimize=True)
    print(f"Wrote {args.output} ({panel.width}x{panel.height})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
