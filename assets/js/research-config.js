// Google Sheet: Share → Anyone with the link → Viewer (required for live load).
// https://docs.google.com/spreadsheets/d/1AEyTFuRnmF3psAuTVdzq6FsR-9saT2gxTAI-R4ki2Cg/edit
//
// Tabs:
//   Research Groups Categorization (gid 0): column A = area names (landing page),
//     column B = subprojects. Names and order come from the sheet, not this file.
//   One tab per area (tab name = column A):
//     column A = project title, B = description, C = photo, D = photo alt text.
window.RESEARCH_CONFIG = {
  SHEET_ID: "1AEyTFuRnmF3psAuTVdzq6FsR-9saT2gxTAI-R4ki2Cg",
  GID: "0",

  // Optional asset overrides, keyed by area slug (e.g. "nonlinear-optics").
  // Defaults: {slug}.html and images/research/{slug}.png.

  // Local figures for project pages (used when the sheet has no Photo column).
  FIGURES: {
    "mid-ir-photonics": {
      src: "images/research/mid-ir-photonics-fig1a.png",
      alt: "Bulk vs integrated widely-tunable mid-IR OPO (Fig. 1a, Hwang et al.)",
    },
    "nanomechanical-mass-sensing": {
      src: "images/research/nanomechanical-mass-sensing.png",
      alt: "Multiplexed NEMS mass sensor array (Fig. 1a)",
    },
  },
};
