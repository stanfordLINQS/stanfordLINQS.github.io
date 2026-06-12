(function () {
  const config = window.PEOPLE_CONFIG || {};
  const { SHEET_ID, GID = "0", PHOTOS = {}, PHOTO_VERSION = "1", SECTION_ORDER = [] } = config;

  const COL_SECTION = 0;
  const COL_NAME = 1;
  const PHOTO_EXTS = ["jpg", "jpeg", "webp", "png"];

  const SECTION_ALIASES = {
    pi: "Principal Investigator",
    "principal investigator": "Principal Investigator",
    "principle investigator": "Principal Investigator",
    postdoc: "Postdoctoral Researchers",
    "postdoctoral researcher": "Postdoctoral Researchers",
    "postdoctoral researchers": "Postdoctoral Researchers",
    "graduate student researchers": "Graduate Student Researchers",
    "graduate student researcher": "Graduate Student Researchers",
    "ph.d. student researchers": "Graduate Student Researchers",
    "phd student researchers": "Graduate Student Researchers",
    "undergraduate student researchers": "Undergraduate Student Researchers",
    "undergraduate student researcher": "Undergraduate Student Researchers",
    "undergraduate researchers": "Undergraduate Student Researchers",
    administration: "Administration",
    administrative: "Administration",
    "administrative staff": "Administration",
    alumni: "Alumni",
    "affiliated researchers": "Affiliated Researchers",
  };

  function sectionKey(text) {
    return String(text || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");
  }

  function isSectionLabel(text) {
    const key = sectionKey(text);
    if (!key) return false;
    if (SECTION_ALIASES[key]) return true;
    if (SECTION_ORDER.map((s) => sectionKey(s)).includes(key)) return true;
    return /investigator|researchers?|students?|administration|administrative|alumni|affiliated/i.test(text);
  }

  function normalizeSection(raw) {
    const key = sectionKey(raw);
    if (!key) return "";
    if (SECTION_ALIASES[key]) return SECTION_ALIASES[key];
    const fromOrder = SECTION_ORDER.find((s) => sectionKey(s) === key);
    if (fromOrder) return fromOrder;
    return titleCase(raw.trim());
  }

  function titleCase(str) {
    return str.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
  }

  function findCol(labels, candidates) {
    for (const c of candidates) {
      const i = labels.findIndex((l) => l === c || l.includes(c));
      if (i >= 0) return i;
    }
    return -1;
  }

  function isHeaderRow(name, sectionCell) {
    const a = sectionCell.toLowerCase();
    const b = name.toLowerCase();
    return (
      b === "name" ||
      a === "section" ||
      a === "role" ||
      b === "full name" ||
      (a.includes("section") && b.includes("name"))
    );
  }

  function isRedundantDetail(value, section) {
    const detail = sectionKey(value);
    const heading = sectionKey(section);
    if (!detail || !heading) return false;
    if (isSectionLabel(value)) return true;
    if (detail === heading) return true;
    if (detail === heading.replace(/s$/, "")) return true;
    if (heading === detail.replace(/s$/, "")) return true;
    return false;
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

  function cacheBust(url) {
    if (!url || /^https?:\/\//i.test(url) || !PHOTO_VERSION) return url;
    const joiner = url.includes("?") ? "&" : "?";
    return `${url}${joiner}v=${encodeURIComponent(PHOTO_VERSION)}`;
  }

  function resolvePhoto(value, name) {
    const fromConfig = PHOTOS[name];
    const raw = (value || fromConfig || "").trim();
    if (!raw) return "";

    const driveId = extractDriveId(raw);
    if (driveId) {
      return `https://drive.google.com/uc?export=view&id=${driveId}`;
    }

    if (/^https?:\/\//i.test(raw)) return raw;

    if (/^[a-zA-Z0-9_-]{20,}$/.test(raw)) {
      return `https://drive.google.com/uc?export=view&id=${raw}`;
    }

    return cacheBust(`images/people/${raw.replace(/^\.?\//, "")}`);
  }

  function slugify(name) {
    return String(name)
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function photoCandidates(person) {
    if (person.photo) return [person.photo];
    const slug = slugify(person.name);
    if (!slug) return [];
    return PHOTO_EXTS.map((ext) => cacheBust(`images/people/${slug}.${ext}`));
  }

  function initials(name) {
    return String(name)
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase();
  }

  function parseGviz(text) {
    const json = JSON.parse(text.replace(/^[^(]*\(/, "").replace(/\);?\s*$/, ""));
    let labels = json.table.cols.map((c) => (c.label || "").trim());
    let rows = json.table.rows;

    // gviz often omits column labels; the sheet uses row 1 as headers instead.
    if (!labels.some(Boolean) && rows.length) {
      const headerValues = rows[0].c.map((cell) => formatCell(cell));
      if (headerValues.some((v) => /^(name|email|title)$/i.test(v))) {
        labels = headerValues;
        rows = rows.slice(1);
      }
    }

    const labelsLower = labels.map((l) => l.toLowerCase());

    const col = {
      pronouns: findCol(labelsLower, ["pronouns"]),
      title: findCol(labelsLower, ["title"]),
      email: findCol(labelsLower, ["email", "e-mail", "email address"]),
      phone: findCol(labelsLower, ["phone", "telephone", "tel"]),
      mailCode: findCol(labelsLower, ["mail code", "mailcode"]),
      location: findCol(labelsLower, ["location", "address", "office"]),
      photo: findCol(labelsLower, ["photo", "image", "picture", "photo url", "photo file"]),
      personalWebsite: findCol(labelsLower, ["personal website", "personal site", "website", "blog"]),
      googleScholar: findCol(labelsLower, ["google scholar", "scholar"]),
      linkedin: findCol(labelsLower, ["linkedin"]),
      twitter: findCol(labelsLower, ["twitter", "x"]),
      researchAreas: findCol(labelsLower, ["research areas", "research area", "research"]),
      education: findCol(labelsLower, ["education"]),
      bio: findCol(labelsLower, ["bio", "biography", "about"]),
    };

    if (col.email < 0) col.email = 5;

    const grouped = new Map();
    const bySlug = new Map();
    let currentSection = "";

    for (const row of rows) {
      const values = row.c.map((cell) => formatCell(cell));
      if (!values.some(Boolean)) continue;

      const sectionCell = values[COL_SECTION] || "";
      const name = values[COL_NAME] || "";

      if (isHeaderRow(name, sectionCell)) continue;

      if (sectionCell && isSectionLabel(sectionCell)) {
        currentSection = normalizeSection(sectionCell);
        if (!grouped.has(currentSection)) grouped.set(currentSection, []);
        if (!name || isSectionLabel(name)) continue;
      }

      if (!name || !currentSection) continue;
      if (isSectionLabel(name)) continue;

      const title = col.title >= 0 ? values[col.title] : "";
      const displayTitle = title && !isRedundantDetail(title, currentSection) ? title : "";

      const person = {
        name,
        slug: slugify(name),
        section: currentSection,
        pronouns: col.pronouns >= 0 ? values[col.pronouns] : "",
        title: displayTitle,
        email: col.email >= 0 ? values[col.email] : "",
        phone: col.phone >= 0 ? values[col.phone] : "",
        mailCode: col.mailCode >= 0 ? values[col.mailCode] : "",
        location: col.location >= 0 ? values[col.location] : "",
        personalWebsite: col.personalWebsite >= 0 ? values[col.personalWebsite] : "",
        googleScholar: col.googleScholar >= 0 ? values[col.googleScholar] : "",
        linkedin: col.linkedin >= 0 ? values[col.linkedin] : "",
        twitter: col.twitter >= 0 ? values[col.twitter] : "",
        researchAreas: col.researchAreas >= 0 ? values[col.researchAreas] : "",
        education: col.education >= 0 ? values[col.education] : "",
        bio: col.bio >= 0 ? values[col.bio] : "",
        photo: resolvePhoto(col.photo >= 0 ? values[col.photo] : "", name),
      };

      grouped.get(currentSection).push(person);
      bySlug.set(person.slug, person);
    }

    return { grouped, bySlug };
  }

  async function loadPeople() {
    if (!SHEET_ID) throw new Error("Missing SHEET_ID in people-config.js.");
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&gid=${GID}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    return parseGviz(text);
  }

  function personUrl(slug) {
    return `person.html?p=${encodeURIComponent(slug)}`;
  }

  window.PEOPLE_DATA = {
    SECTION_ORDER,
    loadPeople,
    parseGviz,
    slugify,
    photoCandidates,
    initials,
    personUrl,
    isRedundantDetail,
  };
})();
