// Google Sheet: Share → Anyone with the link → Viewer (required for live load).
// Layout: column A = section titles (used as headings, in sheet order),
//         column B = names (rows grouped under each section).
//
// Photos (auto-update from Drive, no git push needed):
//   1. Add a column header "Photo" (also accepts Image, Picture, Photo URL).
//   2. Paste a Drive link or file ID per person, e.g.
//        https://drive.google.com/file/d/FILE_ID/view
//   3. Share each photo (or the folder) as Anyone with the link → Viewer.
//   4. To refresh a photo, replace the file in Drive at the same link.
//   Run: python scripts/print-photo-links.py
// Fallback if a Photo cell is set but Drive fails: local files in images/people/
// named slug-style (amir-safavi-naeini.jpg). Blank Photo cells stay blank.
window.PEOPLE_CONFIG = {
  SHEET_ID: "1_n6ESAo7j0tObCSQFPY_j0RkML58iE9ZlLDdSDOCNWk",
  GID: "0",
  ALUMNI_SHEET: "Alumni",

  // Overrides the spreadsheet Photo column when set (local filename or Drive link).
  PHOTOS: {
    "Linus Woodard": "linus-woodard.jpg",
  },

  // Bump only when using local images/people/ files (ignored for Drive URLs).
  PHOTO_VERSION: "24",

  // Stanford Digital Repository links for Ph.D. alumni theses.
  THESIS_URLS: {
    "Oguz Tolga Celik": "https://purl.stanford.edu/by529gb1292",
    "Jason Herrmann": "https://purl.stanford.edu/ww291sc8380",
    "Kevin Multani": "https://purl.stanford.edu/hj093bg3377",
    "Felix Mayor": "https://purl.stanford.edu/xh170pj9200",
    "Rachel Gruenke-Freudenstein": "https://purl.stanford.edu/fc402ss7669",
    "Taha Rajabzadeh": "https://purl.stanford.edu/mn995cd0499",
    "Hubert Stokowski": "https://purl.stanford.edu/ck196hh9286",
    "Agnetta Cleland": "https://purl.stanford.edu/kx366nm3915",
    "Nathan Lee": "https://purl.stanford.edu/kh905cd4067",
    "Okan Atalar": "https://purl.stanford.edu/kh488xz0210",
    "Wentao Jiang": "https://purl.stanford.edu/mx877vv9870",
    "Alex Wollack": "https://purl.stanford.edu/mn697qq5667",
    "Zhaoyou Wang": "https://purl.stanford.edu/cs964xk2965",
    "Timothy McKenna": "https://purl.stanford.edu/kp746rx2589",
    "Christopher Sarabalis": "https://purl.stanford.edu/bs011gx3793",
    "Rishi Patel": "https://purl.stanford.edu/pq620kg9635",
    "Jeremy Witmer": "https://purl.stanford.edu/cg725pt1482",
    "Patricio Arrangoiz-Arriola": "https://purl.stanford.edu/hp858nr1426",
  },
};
