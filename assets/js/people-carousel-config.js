// People page group photo carousel — loads from the shared photos spreadsheet.
// Share the sheet: Anyone with the link → Viewer.
//
// On the spreadsheet (column A), add a section like:
//   Group Photos
//   https://drive.google.com/file/d/.../view
//   https://drive.google.com/file/d/.../view
//
// https://docs.google.com/spreadsheets/d/1aqTRr1-2Qk1dvsK3BtES28VqOYmg8wcq7DqOhojrD1o/edit
//
// Fallback: local images listed in images[] below.
window.PEOPLE_CAROUSEL_CONFIG = {
  SHEET_ID: "1aqTRr1-2Qk1dvsK3BtES28VqOYmg8wcq7DqOhojrD1o",
  GID: "0",
  section: "Group Photos",
  intervalMs: 6000,
  shuffle: true,

  imageOverrides: {
    // Example: "DRIVE_FILE_ID": { objectPosition: "top center" },
  },

  images: [
    {
      src: "images/people/carousel/group-mountain-summit.jpg",
      objectPosition: "top center",
    },
    "images/people/carousel/group-hiking.jpg",
    "images/people/carousel/group-terrace.jpg",
    "images/people/carousel/group-lawn.jpg",
    "images/people/carousel/group-heart.jpg",
  ],
};
