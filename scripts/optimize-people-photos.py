"""Resize and compress people profile photos for web display."""

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
PEOPLE_DIR = ROOT / "images" / "people"

# Cards show up to 280px wide; 560px covers 2x displays.
MAX_WIDTH = 560
JPEG_QUALITY = 85
PHOTO_EXTS = {".jpg", ".jpeg", ".png", ".webp"}


def optimize_image(path: Path) -> tuple[int, int, str]:
    before = path.stat().st_size
    with Image.open(path) as img:
        rgb = img.convert("RGB")
        width, height = rgb.size
        if width > MAX_WIDTH:
            new_height = max(1, round(height * MAX_WIDTH / width))
            rgb = rgb.resize((MAX_WIDTH, new_height), Image.Resampling.LANCZOS)

        dest = path.with_suffix(".jpg")
        rgb.save(dest, "JPEG", quality=JPEG_QUALITY, optimize=True)

    if dest != path and path.exists():
        path.unlink()

    after = dest.stat().st_size
    return before, after, dest.name


def main() -> int:
    paths = sorted(
        p for p in PEOPLE_DIR.iterdir() if p.is_file() and p.suffix.lower() in PHOTO_EXTS
    )
    if not paths:
        print("No photos found in", PEOPLE_DIR)
        return 1

    total_before = 0
    total_after = 0
    for path in paths:
        before, after, name = optimize_image(path)
        total_before += before
        total_after += after
        print(f"{name}: {before:,} -> {after:,} bytes ({after / before:.1%})")

    print(
        f"Total: {total_before:,} -> {total_after:,} bytes "
        f"({total_after / total_before:.1%})"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
