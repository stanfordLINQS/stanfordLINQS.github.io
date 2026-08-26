(function () {
  const config = window.RESEARCH_CONFIG || {};
  const {
    SHEET_ID,
    GID = "0",
    AREA_PAGES = {},
    PANEL_IMAGES = {},
    FIGURES = {},
  } = config;

  // Spellings that should still share a description, without changing the displayed title.
  const PROJECT_MATCH_KEYS = {
    "piezo optomechanics transduction": "piezo optomechanical transduction",
    "eo transduction": "electro optic transduction",
    "integrated photonics": "integrated phononics",
    biosensing: "bio sensing",
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

  function lookupMap(map, name) {
    if (!map || !name) return "";
    if (map[name]) return map[name];
    const slug = slugify(name);
    if (map[slug]) return map[slug];
    for (const [key, value] of Object.entries(map)) {
      if (slugify(key) === slug) return value;
    }
    return "";
  }

  function findArea(grouped, raw) {
    const slug = slugify(raw);
    const key = normalizeKey(raw);
    if (!slug && !key) return null;
    for (const area of grouped.values()) {
      if (area.slug === slug || normalizeKey(area.name) === key) return area;
    }
    return grouped.get(String(raw || "").trim()) || null;
  }

  function matchKey(raw) {
    const key = normalizeKey(raw);
    return PROJECT_MATCH_KEYS[key] || key;
  }

  function projectTitle(raw) {
    const key = normalizeKey(raw);
    if (!key || key === "overview" || key === "sub projects") return "";
    return String(raw).trim();
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
    const slug = slugify(name);
    return {
      name,
      slug,
      page: lookupMap(AREA_PAGES, name) || `${slug}.html`,
      image: lookupMap(PANEL_IMAGES, name) || `images/research/${slug}.png`,
      overview: "",
      projects: [],
      loaded: false,
    };
  }

  function parseCategorization(text) {
    const json = JSON.parse(text.replace(/^[^(]*\(/, "").replace(/\);?\s*$/, ""));
    const rows = json.table.rows || [];
    const grouped = new Map();
    const byKey = new Map();
    let currentArea = "";

    for (const row of rows) {
      const values = (row.c || []).map((cell) => formatCell(cell));
      const areaCell = values[0] || "";
      const projectCell = values[1] || "";
      const researchersCell = values[2] || "";
      if (!areaCell && !projectCell) continue;
      if (isHeaderRow([areaCell, projectCell, researchersCell])) continue;

      if (areaCell) {
        const key = normalizeKey(areaCell);
        currentArea = byKey.get(key) || areaCell.trim();
        if (!grouped.has(currentArea)) {
          grouped.set(currentArea, emptyArea(currentArea));
          byKey.set(key, currentArea);
        }
      }
      if (!currentArea) continue;

      const title = projectTitle(projectCell);
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
      const photoAlt = String(values[3] || "").trim();
      if (!titleCell && !body) continue;

      if (normalizeKey(titleCell) === "overview") {
        if (body) overviewParts.push(body);
        continue;
      }

      const title = projectTitle(titleCell) || titleCell.trim();
      if (!title) continue;

      projects.push({
        title,
        slug: slugify(title),
        body,
        photo,
        photoAlt,
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
      byKey.set(matchKey(project.title), project);
    }

    const used = new Set();
    for (const project of area.projects) {
      const key = matchKey(project.title);
      const match = byKey.get(key);
      if (!match) continue;
      used.add(key);
      project.body = match.body || project.body;
      project.photo = match.photo || project.photo;
      project.photoAlt = match.photoAlt || project.photoAlt;
    }

    for (const project of extra.projects) {
      if (used.has(matchKey(project.title))) continue;
      area.projects.push(project);
    }

    for (const project of area.projects) {
      const figure = FIGURES[project.slug];
      if (figure) {
        if (!project.photo) project.photo = figure.src;
        if (!project.photoAlt) project.photoAlt = figure.alt || "";
      }
      if (project.photo && !project.photoAlt) {
        project.photoAlt = `Research figure for ${project.title}`;
      }
    }

    return area;
  }

  async function fetchSheetGviz({ gid, sheet } = {}) {
    const param = sheet
      ? `sheet=${encodeURIComponent(sheet)}`
      : `gid=${encodeURIComponent(gid ?? GID)}`;
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&${param}&_=${Date.now()}`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.text();
  }

  try {
    sessionStorage.removeItem(`linqs-research-v1:${SHEET_ID}`);
  } catch (err) {
    /* private mode */
  }

  function applyAreaSheet(grouped, sheetName, text) {
    const area = findArea(grouped, sheetName);
    if (!area) return;
    try {
      mergeAreaContent(area, parseAreaSheet(text));
      area.loaded = true;
    } catch (err) {
      console.error(`Could not parse research sheet “${sheetName}”.`, err);
    }
  }

  async function ensureAreaSheet(grouped, sheetName) {
    const area = findArea(grouped, sheetName);
    if (!area || area.loaded) return;
    const names = [sheetName, area.name].filter(
      (name, i, all) => name && all.indexOf(name) === i
    );
    for (const name of names) {
      try {
        applyAreaSheet(grouped, name, await fetchSheetGviz({ sheet: name }));
        if (area.loaded) return;
      } catch (err) {
        console.error(`Could not load research sheet “${name}”.`, err);
      }
    }
  }

  async function loadResearch({ sheet } = {}) {
    if (!SHEET_ID) throw new Error("Missing SHEET_ID in research-config.js.");

    const fetches = [fetchSheetGviz({ gid: GID })];
    if (sheet) fetches.push(fetchSheetGviz({ sheet }));

    const results = await Promise.allSettled(fetches);
    if (results[0].status !== "fulfilled") throw results[0].reason;

    const grouped = parseCategorization(results[0].value);
    if (sheet && results[1] && results[1].status === "fulfilled") {
      applyAreaSheet(grouped, sheet, results[1].value);
    }
    if (sheet) await ensureAreaSheet(grouped, sheet);

    return { grouped };
  }

  window.RESEARCH_DATA = {
    loadResearch,
    slugify,
    paragraphs,
    findArea,
  };
})();
