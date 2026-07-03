// Home banner carousel — loads images from the homepage photos spreadsheet.
// Share the sheet: Anyone with the link → Viewer.
//
// Spreadsheet: one Drive link per row (column A), or use section headers:
//   Homepage Carousel
//   https://drive.google.com/file/d/.../view
//   Group Photos
//   https://drive.google.com/file/d/.../view
// https://docs.google.com/spreadsheets/d/1aqTRr1-2Qk1dvsK3BtES28VqOYmg8wcq7DqOhojrD1o/edit
//
// Fallback: local images listed in images[] below.
window.CAROUSEL_CONFIG = {
  SHEET_ID: "1aqTRr1-2Qk1dvsK3BtES28VqOYmg8wcq7DqOhojrD1o",
  GID: "0",
  intervalMs: 6000,
  shuffle: true,

  // Per-image framing when loaded from Drive (key = file ID from the share link).
  imageOverrides: {
    "15xAWQ15RWmwwBxQm2Tr6gPrkzwzbJ0gF": { objectPosition: "center 62%" }, // quac wirebond (portrait original)
    "1Rgxm5dg7wF8bJ0ZpQVwPc54ThtCTcuaE": { objectPosition: "42% 66%" }, // 1D transducer (teal/purple)
  },

  images: [
    "images/carousel/stanford-chip.png",
    "images/carousel/laser-chip-lab.png",
    "images/carousel/quac-chip.png",
    "images/carousel/lnod.png",
    "images/carousel/3d-cavity-fiber.png",
    "images/carousel/ln2g03-ntnar.png",
    "images/carousel/1d-transducer.png",
  ],
};
