// Google Sheet: Share → Anyone with the link → Viewer (required for live load).
// Layout: column A = section titles, column B = names (rows grouped under each section).
//
// Photos (auto-update from Drive, no git push needed):
//   1. Add a column header "Photo" (also accepts Image, Picture, Photo URL).
//   2. Paste a Drive link or file ID per person, e.g.
//        https://drive.google.com/file/d/FILE_ID/view
//   3. Share each photo (or the folder) as Anyone with the link → Viewer.
//   4. To refresh a photo, replace the file in Drive at the same link.
//   Run: python scripts/print-photo-links.py
// Fallback: local files in images/people/ named slug-style (amir-safavi-naeini.jpg).
window.PEOPLE_CONFIG = {
  SHEET_ID: "1_n6ESAo7j0tObCSQFPY_j0RkML58iE9ZlLDdSDOCNWk",
  GID: "0",

  // Overrides the spreadsheet Photo column when set (local filename or Drive link).
  PHOTOS: {
    "Linus Woodard": "linus-woodard.jpg",
  },

  // Bump only when using local images/people/ files (ignored for Drive URLs).
  PHOTO_VERSION: "23",

  SECTION_ORDER: [
    "Principal Investigator",
    "Graduate Student Researchers",
    "Postdoctoral Researchers",
    "Undergraduate Student Researchers",
    "Administration",
  ],
};
