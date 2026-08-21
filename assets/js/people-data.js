(function () {
  const config = window.PEOPLE_CONFIG || {};
  const { SHEET_ID, GID = "0", ALUMNI_SHEET = "", PHOTOS = {}, PHOTO_POSITION = {}, PHOTO_VERSION = "1", THESIS_URLS = {} } = config;

  const COL_SECTION = 0;
  const COL_NAME = 1;
  const PHOTO_EXTS = ["jpg", "jpeg", "webp", "png"];

  function sectionKey(text) {
    return String(text || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");
  }

  function isReservedHeader(text) {
    const key = sectionKey(text);
    return key === "section" || key === "role" || key === "group" || key === "name";
  }

  function normalizeSection(raw) {
    return String(raw || "").trim();
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
    if (detail === heading) return true;
    if (detail === heading.replace(/s$/, "")) return true;
    if (heading === detail.replace(/s$/, "")) return true;
    return false;
  }

  function formatCell(cell) {
    if (!cell) return "";
    if (cell.v != null && String(cell.v).trim()) return String(cell.v).trim();
    if (cell.f) return String(cell.f).replace(/^=/, "").trim();
    return "";
  }

  function extractDriveId(url) {
    const raw = String(url || "").trim();
    const m = raw.match(/\/d\/([a-zA-Z0-9_-]+)|[?&]id=([a-zA-Z0-9_-]+)/);
    if (m) return m[1] || m[2];
    if (/^[a-zA-Z0-9_-]{20,}$/.test(raw)) return raw;
    return "";
  }

  function cacheBust(url) {
    if (!url || /^https?:\/\//i.test(url) || !PHOTO_VERSION) return url;
    const joiner = url.includes("?") ? "&" : "?";
    return `${url}${joiner}v=${encodeURIComponent(PHOTO_VERSION)}`;
  }

  function drivePhotoUrls(fileId) {
    if (!fileId) return [];
    const id = encodeURIComponent(fileId);
    return [
      `https://lh3.googleusercontent.com/d/${fileId}=w800`,
      `https://drive.google.com/thumbnail?id=${id}&sz=w1000`,
      `https://lh3.googleusercontent.com/d/${fileId}`,
    ];
  }

  function drivePhotoUrl(fileId) {
    return drivePhotoUrls(fileId)[0] || "";
  }

  function resolvePhoto(value, name) {
    const raw = String(value || PHOTOS[name] || "").trim();
    if (!raw) return "";

    const driveId = extractDriveId(raw);
    if (driveId) return drivePhotoUrl(driveId);
    if (/^https?:\/\//i.test(raw)) return raw;
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
    const candidates = [];
    const seen = new Set();

    function add(url) {
      if (!url || seen.has(url)) return;
      seen.add(url);
      candidates.push(url);
    }

    const driveId = person.driveId || extractDriveId(person.photo);
    drivePhotoUrls(driveId).forEach(add);
    add(person.photo);

    if (!person.photo && !driveId) return candidates;

    const slug = slugify(person.name);
    if (slug) {
      for (const ext of PHOTO_EXTS) {
        add(cacheBust(`images/people/${slug}.${ext}`));
      }
    }
    return candidates;
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

      if (sectionCell && !isReservedHeader(sectionCell)) {
        currentSection = normalizeSection(sectionCell);
        if (!grouped.has(currentSection)) grouped.set(currentSection, []);
        if (!name) continue;
      }

      if (!name || !currentSection) continue;

      const title = col.title >= 0 ? values[col.title] : "";
      const displayTitle = title && !isRedundantDetail(title, currentSection) ? title : "";
      const sheetPhoto = col.photo >= 0 ? values[col.photo] : "";

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
        photo: resolvePhoto(sheetPhoto, name),
        driveId: extractDriveId(sheetPhoto) || extractDriveId(PHOTOS[name] || ""),
        photoPosition: PHOTO_POSITION[name] || "",
      };

      grouped.get(currentSection).push(person);
      bySlug.set(person.slug, person);
    }

    return { grouped, bySlug };
  }

  function parseAlumniGviz(text) {
    const json = JSON.parse(text.replace(/^[^(]*\(/, "").replace(/\);?\s*$/, ""));
    const rows = json.table.rows;
    const alumni = [];
    let currentGroup = "";

    for (const row of rows) {
      const values = row.c.map((cell) => formatCell(cell));
      while (values.length < 4) values.push("");

      const groupCell = values[0] || "";
      const name = values[1] || "";
      const gradYear = values[2] || "";
      const currentJob = values[3] || "";

      if (!values.some(Boolean)) continue;
      if (name.toLowerCase() === "name") continue;

      if (groupCell && !isReservedHeader(groupCell)) {
        currentGroup = normalizeSection(groupCell);
        if (!name) continue;
      }

      if (!name) continue;

      alumni.push({
        name,
        slug: slugify(name),
        section: "Alumni",
        alumniGroup: currentGroup,
        gradYear,
        currentJob,
        thesisUrl: THESIS_URLS[name] || "",
        title: "",
        pronouns: "",
        email: "",
        phone: "",
        mailCode: "",
        location: "",
        personalWebsite: "",
        googleScholar: "",
        linkedin: "",
        twitter: "",
        researchAreas: "",
        education: "",
        bio: "",
        photo: "",
        photoPosition: "",
        isAlumni: true,
      });
    }

    return alumni;
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

  async function loadPeople() {
    if (!SHEET_ID) throw new Error("Missing SHEET_ID in people-config.js.");

    const requests = [fetchSheetGviz({ gid: GID })];
    if (ALUMNI_SHEET) requests.push(fetchSheetGviz({ sheet: ALUMNI_SHEET }));

    const [mainText, alumniText] = await Promise.all(requests);
    const { grouped, bySlug } = parseGviz(mainText);

    if (alumniText) {
      const alumni = parseAlumniGviz(alumniText);
      if (alumni.length) grouped.set("Alumni", alumni);
    }

    return { grouped, bySlug };
  }

  function personUrl(slug) {
    return `person.html?p=${encodeURIComponent(slug)}`;
  }

  window.PEOPLE_DATA = {
    loadPeople,
    parseGviz,
    slugify,
    photoCandidates,
    initials,
    personUrl,
    isRedundantDetail,
  };
})();
