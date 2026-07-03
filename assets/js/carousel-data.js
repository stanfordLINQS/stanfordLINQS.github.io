(function () {
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

  function isPhotoUrl(value) {
    const raw = String(value || "").trim();
    if (!raw) return false;
    return /drive\.google\.com|^https?:\/\//i.test(raw) || /^[a-zA-Z0-9_-]{20,}$/.test(raw);
  }

  function normalizeSectionName(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");
  }

  function parseCarouselSheet(text, options) {
    const config = options || {};
    const imageOverrides = config.imageOverrides || {};
    const targetSection = config.section
      ? normalizeSectionName(config.section)
      : null;

    const json = JSON.parse(text.replace(/^[^(]*\(/, "").replace(/\);?\s*$/, ""));
    const labels = json.table.cols.map((c) => (c.label || "").trim());
    const rows = json.table.rows;
    const images = [];
    const seen = new Set();
    let currentSection = null;

    function shouldIncludePhoto() {
      if (!targetSection) return true;
      const section = currentSection ? normalizeSectionName(currentSection) : null;
      return section === targetSection;
    }

    function addPhoto(value, objectPosition) {
      const url = resolvePhoto(value);
      if (!url) return;
      const key = extractDriveId(url) || url;
      if (seen.has(key)) return;
      seen.add(key);
      let item = {
        url,
        objectPosition: objectPosition || "center center",
      };
      const overrides = imageOverrides[key];
      if (overrides) item = { ...item, ...overrides };
      images.push(item);
    }

    for (const label of labels) {
      if (isPhotoUrl(label) && shouldIncludePhoto()) addPhoto(label);
    }

    for (const row of rows) {
      const values = row.c.map((cell) => formatCell(cell));
      if (!values.some(Boolean)) continue;

      const joined = values.join(" ").toLowerCase();
      if (joined.includes("name") && joined.includes("photo")) continue;

      const nonEmpty = values.filter(Boolean);
      if (nonEmpty.length === 1 && !isPhotoUrl(nonEmpty[0])) {
        currentSection = nonEmpty[0].trim();
        continue;
      }

      if (!shouldIncludePhoto()) continue;

      for (const value of values) {
        if (isPhotoUrl(value)) addPhoto(value);
      }
    }

    return images;
  }

  async function loadCarouselImages(options) {
    const config = options || {};
    const { SHEET_ID, GID = "0", sheet } = config;
    if (!SHEET_ID) return [];

    const param = sheet
      ? `sheet=${encodeURIComponent(sheet)}`
      : `gid=${encodeURIComponent(GID)}`;
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&${param}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    return parseCarouselSheet(text, config);
  }

  window.CAROUSEL_DATA = {
    loadCarouselImages,
    parseCarouselSheet,
    resolvePhoto,
  };
})();
