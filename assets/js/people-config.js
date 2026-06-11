// Google Sheet: Share → Anyone with the link → Viewer (required for live load).
// Layout: column A = section titles, column B = names (rows grouped under each section).
window.PEOPLE_CONFIG = {
  SHEET_ID: "1_n6ESAo7j0tObCSQFPY_j0RkML58iE9ZlLDdSDOCNWk",
  GID: "0",

  // Photos are picked up automatically from images/people/ when the file is
  // named after the person's "Name" column, lowercased with hyphens
  // (e.g. "Amir Safavi-Naeini" -> images/people/amir-safavi-naeini.png).
  // Use PHOTOS only to override that convention, e.g. { "Some Name": "file.jpg" }.
  PHOTOS: {},

  SECTION_ORDER: [
    "Principal Investigator",
    "Postdoctoral Researchers",
    "Graduate Student Researchers",
    "Undergraduate Student Researchers",
  ],
};
