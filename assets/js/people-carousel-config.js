// People page group photo carousel — separate spreadsheet from the homepage carousel.
// Share the sheet: Anyone with the link → Viewer.
//
// Spreadsheet: one Drive link per row (column A).
// https://docs.google.com/spreadsheets/d/1_c0ztDq9TeE8ycdm6XLtAN5mYtU6I9Yr4T__sDZgIHk/edit
//
// Fallback: local images listed in images[] below.
window.PEOPLE_CAROUSEL_CONFIG = {
  SHEET_ID: "1_c0ztDq9TeE8ycdm6XLtAN5mYtU6I9Yr4T__sDZgIHk",
  GID: "0",
  intervalMs: 6000,
  shuffle: true,

  imageOverrides: {
    "1ZGLvCOygBND3CRubnaRO0emFTY3bgLId": {
      src: "images/people/carousel/group-mountain-summit-4x3.jpg",
    },
  },

  images: [
    "images/people/carousel/group-mountain-summit-4x3.jpg",
    "images/people/carousel/group-hiking.jpg",
    "images/people/carousel/group-terrace.jpg",
    "images/people/carousel/group-lawn.jpg",
    "images/people/carousel/group-heart.jpg",
  ],
};
