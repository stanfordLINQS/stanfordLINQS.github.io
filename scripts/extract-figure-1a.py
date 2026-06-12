"""Extract Figure 1a from arXiv 2604.06673 PDF."""
import fitz
from pathlib import Path

PDF = Path(__file__).resolve().parents[1] / "images/research/_arxiv-2604.06673.pdf"
OUT = Path(__file__).resolve().parents[1] / "images/research/mid-ir-photonics-fig1a.png"

pdf = fitz.open(PDF)
for i, page in enumerate(pdf):
    text = page.get_text()
    if "Figure 1" in text or "FIG. 1" in text:
        print(f"Figure 1 text on page {i + 1}")
        break
else:
    i = 2  # fallback: typically page 3 in two-column arXiv layout
    print(f"Fallback to page {i + 1}")

page = pdf[i]
# Render at high resolution for clean crop
mat = fitz.Matrix(3, 3)
pix = page.get_pixmap(matrix=mat, alpha=False)
w, h = pix.width, pix.height

# Panel (a): full-width comparison of bulk vs integrated OPO (top row of Figure 1).
left = int(w * 0.08)
top = int(h * 0.10)
right = int(w * 0.92)
bottom = int(h * 0.38)

from PIL import Image
import io

img = Image.open(io.BytesIO(pix.tobytes("png")))
cropped = img.crop((left, top, right, bottom))
OUT.parent.mkdir(parents=True, exist_ok=True)
cropped.save(OUT, optimize=True)
print(f"Saved {OUT} ({cropped.size[0]}x{cropped.size[1]})")
