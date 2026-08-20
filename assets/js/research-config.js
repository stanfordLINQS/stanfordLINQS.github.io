// Google Sheet: Share → Anyone with the link → Viewer (required for live load).
// https://docs.google.com/spreadsheets/d/1AEyTFuRnmF3psAuTVdzq6FsR-9saT2gxTAI-R4ki2Cg/edit
//
// Tabs:
//   Research Groups Categorization (gid 0): column A = area headers, B = subprojects.
//   One tab per area (same names as AREA_ORDER):
//     column A = project title, B = description, C = photo, D = photo alt text.
window.RESEARCH_CONFIG = {
  SHEET_ID: "1AEyTFuRnmF3psAuTVdzq6FsR-9saT2gxTAI-R4ki2Cg",
  GID: "0",

  // Landing-page headers — must match the research page and categorization column A.
  AREA_ORDER: [
    "Nonlinear Optics",
    "Transduction",
    "Acoustics",
    "Superconducting Circuits",
  ],

  AREA_PAGES: {
    "Nonlinear Optics": "nonlinear-optics.html",
    Transduction: "transduction.html",
    Acoustics: "acoustics.html",
    "Superconducting Circuits": "superconducting-circuits.html",
  },

  PANEL_IMAGES: {
    "Nonlinear Optics": "images/research/nonlinear-optics.png",
    Transduction: "images/research/transduction.png",
    Acoustics: "images/research/acoustics.png",
    "Superconducting Circuits": "images/research/superconducting-circuits.png",
  },

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
