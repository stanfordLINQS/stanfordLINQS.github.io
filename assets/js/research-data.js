(function () {
  const config = window.RESEARCH_CONFIG || {};
  const {
    SHEET_ID,
    GID = "0",
    AREA_ORDER = [],
    AREA_PAGES = {},
    PANEL_IMAGES = {},
    FIGURES = {},
  } = config;

  const AREA_ALIASES = {
    "nonlinear optics": "Nonlinear Optics",
    transduction: "Transduction",
    acoustics: "Acoustics",
    "superconducting circuits": "Superconducting Circuits",
  };

  const PROJECT_ALIASES = {
    "piezo optomechanics transduction": "Piezo Optomechanics Transduction",
    "piezo optomechanical transduction": "Piezo Optomechanics Transduction",
    "eo transduction": "EO Transduction",
    "electro optic transduction": "EO Transduction",
    "integrated photonics": "Integrated Phononics",
    "integrated phononics": "Integrated Phononics",
    "bio sensing": "Bio Sensing",
    biosensing: "Bio Sensing",
  };

  function normalizeKey(text) {
    return String(text || "")
      .trim()
      .toLowerCase()
      .replace(/[–—]/g, "-")
      .replace(/[^a-z0-9]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function slugify(text) {
    return String(text || "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function formatCell(cell) {
    if (!cell || cell.v == null) return "";
    if (cell.f) return String(cell.f).replace(/^=/, "").trim();
    return String(cell.v).trim();
  }

  function extractDriveId(url) {
    const m = String(url).match(/\/d\/([a-zA-Z0-9_-]+)|[?&]id=([a-zA-Z0-9_-]+)/);
    return m ? m[1] || m[2] : "";
  }

  function drivePhotoUrl(fileId) {
    return `https://lh3.googleusercontent.com/d/${fileId}=w1200`;
  }

  function resolvePhoto(value) {
    const raw = String(value || "").trim();
    if (!raw) return "";

    const driveId = extractDriveId(raw);
    if (driveId) return drivePhotoUrl(driveId);
    if (/^https?:\/\//i.test(raw)) return raw;
    if (/^[a-zA-Z0-9_-]{20,}$/.test(raw)) return drivePhotoUrl(raw);
    return raw.replace(/^\.?\//, "");
  }

  function canonicalArea(raw) {
    const key = normalizeKey(raw);
    if (!key) return "";
    if (AREA_ALIASES[key]) return AREA_ALIASES[key];
    const fromOrder = AREA_ORDER.find((name) => normalizeKey(name) === key);
    return fromOrder || String(raw).trim();
  }

  function canonicalProject(raw) {
    const key = normalizeKey(raw);
    if (!key || key === "overview" || key === "sub projects") return "";
    if (PROJECT_ALIASES[key]) return PROJECT_ALIASES[key];
    return String(raw).trim();
  }

  function isAreaName(raw) {
    const key = normalizeKey(raw);
    if (!key) return false;
    if (AREA_ALIASES[key]) return true;
    return AREA_ORDER.some((name) => normalizeKey(name) === key);
  }

  function isHeaderRow(values) {
    const joined = values.join(" ").toLowerCase();
    return joined.includes("sub project");
  }

  function paragraphs(text) {
    return String(text || "")
      .split(/\n\s*\n/)
      .map((part) => part.replace(/\s+/g, " ").trim())
      .filter(Boolean);
  }

  function emptyArea(name) {
    return {
      name,
      slug: slugify(name),
      page: AREA_PAGES[name] || `${slugify(name)}.html`,
      image: PANEL_IMAGES[name] || "",
      overview: "",
      projects: [],
    };
  }

  function parseCategorization(text) {
    const json = JSON.parse(text.replace(/^[^(]*\(/, "").replace(/\);?\s*$/, ""));
    const rows = json.table.rows || [];
    const grouped = new Map();
    let currentArea = "";

    for (const name of AREA_ORDER) {
      grouped.set(name, emptyArea(name));
    }

    for (const row of rows) {
      const values = (row.c || []).map((cell) => formatCell(cell));
      const areaCell = values[0] || "";
      const projectCell = values[1] || "";
      const researchersCell = values[2] || "";
      if (!areaCell && !projectCell) continue;
      if (isHeaderRow([areaCell, projectCell, researchersCell])) continue;

      if (areaCell) currentArea = canonicalArea(areaCell);
      if (!currentArea) continue;

      if (!grouped.has(currentArea)) grouped.set(currentArea, emptyArea(currentArea));

      const title = canonicalProject(projectCell);
      if (!title) continue;

      grouped.get(currentArea).projects.push({
        title,
        slug: slugify(title),
        body: "",
        photo: "",
        photoAlt: "",
        researchers: researchersCell === "-" ? "" : researchersCell,
      });
    }

    return grouped;
  }

  function parseAreaSheet(text) {
    const json = JSON.parse(text.replace(/^[^(]*\(/, "").replace(/\);?\s*$/, ""));
    const rows = json.table.rows || [];
    const overviewParts = [];
    const projects = [];

    for (const row of rows) {
      const values = (row.c || []).map((cell) => formatCell(cell));
      const titleCell = values[0] || "";
      const body = values[1] || "";
      const photo = resolvePhoto(values[2] || "");
      if (!titleCell && !body) continue;

      if (normalizeKey(titleCell) === "overview") {
        if (body) overviewParts.push(body);
        continue;
      }

      const title = canonicalProject(titleCell) || titleCell.trim();
      if (!title) continue;

      projects.push({
        title,
        slug: slugify(title),
        body,
        photo,
        photoAlt: "",
        researchers: "",
      });
    }

    return {
      overview: overviewParts.join("\n\n"),
      projects,
    };
  }

  function mergeAreaContent(area, extra) {
    if (!extra) return area;
    if (extra.overview) area.overview = extra.overview;

    const byKey = new Map();
    for (const project of extra.projects) {
      byKey.set(normalizeKey(project.title), project);
    }

    const used = new Set();
    for (const project of area.projects) {
      const match = byKey.get(normalizeKey(project.title));
      if (!match) continue;
      used.add(normalizeKey(project.title));
      project.body = match.body || project.body;
      project.photo = match.photo || project.photo;
    }

    for (const project of extra.projects) {
      if (used.has(normalizeKey(project.title))) continue;
      area.projects.push(project);
    }

    for (const project of area.projects) {
      const figure = FIGURES[project.slug];
      if (!project.photo && figure) {
        project.photo = figure.src;
        project.photoAlt = figure.alt || "";
      }
    }

    return area;
  }

  async function fetchSheetGviz({ gid, sheet } = {}) {
    const param = sheet
      ? `sheet=${encodeURIComponent(sheet)}`
      : `gid=${encodeURIComponent(gid ?? GID)}`;
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&${param}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.text();
  }

  let cache = null;

  async function loadResearch() {
    if (cache) return cache;
    if (!SHEET_ID) throw new Error("Missing SHEET_ID in research-config.js.");

    const areaNames = AREA_ORDER.slice();
    const requests = [fetchSheetGviz({ gid: GID })].concat(
      areaNames.map((name) => fetchSheetGviz({ sheet: name }))
    );

    const results = await Promise.allSettled(requests);
    const catResult = results[0];
    if (catResult.status !== "fulfilled") throw catResult.reason;

    const grouped = parseCategorization(catResult.value);

    areaNames.forEach((name, i) => {
      const result = results[i + 1];
      if (result.status !== "fulfilled") return;
      try {
        if (!grouped.has(name)) grouped.set(name, emptyArea(name));
        mergeAreaContent(grouped.get(name), parseAreaSheet(result.value));
      } catch (err) {
        console.error(`Could not parse research sheet “${name}”.`, err);
      }
    });

    cache = { grouped };
    return cache;
  }

  window.RESEARCH_DATA = {
    AREA_ORDER,
    loadResearch,
    slugify,
    paragraphs,
    canonicalArea,
  };
})();
