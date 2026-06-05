(function () {
  const config = window.PEOPLE_CONFIG || {};
  const { SHEET_ID, GID = "0", PHOTOS = {}, SECTION_ORDER = [] } = config;

  const COL_SECTION = 0; // column A
  const COL_NAME = 1; // column B

  const els = {
    status: document.getElementById("people-status"),
    sections: document.getElementById("people-sections"),
  };

  if (!els.sections) return;

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
    alumni: "Alumni",
    "affiliated researchers": "Affiliated Researchers",
  };

  init();

  function init() {
    if (!SHEET_ID) {
      return showStatus("Missing SHEET_ID in people-config.js.", true);
    }
    load();
  }

  async function load() {
    showStatus("Loading people…");
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&gid=${GID}`;
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      const grouped = parseGviz(text);
      const total = [...grouped.values()].reduce((n, arr) => n + arr.length, 0);
      if (!total) {
        return showStatus("No people found in the spreadsheet.", true);
      }
      els.status.hidden = true;
      render(grouped);
    } catch (err) {
      console.error(err);
      showStatus(
        "Could not load the spreadsheet. Share it as “Anyone with the link” → Viewer, then refresh.",
        true
      );
    }
  }

  function parseGviz(text) {
    const json = JSON.parse(text.replace(/^[^(]*\(/, "").replace(/\);?\s*$/, ""));
    const labels = json.table.cols.map((c) => (c.label || "").trim());
    const labelsLower = labels.map((l) => l.toLowerCase());

    const col = {
      email: findCol(labelsLower, ["email", "e-mail", "email address"]),
      photo: findCol(labelsLower, ["photo", "image", "picture", "photo url", "photo file"]),
    };

    if (col.email < 0) col.email = 2;
    if (col.photo < 0) col.photo = findCol(labelsLower, ["url", "link", "website"]);

    const skip = new Set([COL_SECTION, COL_NAME, col.email, col.photo].filter((i) => i >= 0));

    const grouped = new Map();
    let currentSection = "";

    for (const row of json.table.rows) {
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

      const email = col.email >= 0 ? values[col.email] : "";

      const extras = [];
      labels.forEach((label, i) => {
        if (skip.has(i) || !values[i]) return;
        if (isMetaColumn(label)) return;
        extras.push({ label, value: values[i] });
      });

      grouped.get(currentSection).push({
        name,
        email,
        photo: resolvePhoto(col.photo >= 0 ? values[col.photo] : "", name),
        extras,
      });
    }

    return grouped;
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

  function isSectionLabel(text) {
    const key = sectionKey(text);
    if (!key) return false;
    if (SECTION_ALIASES[key]) return true;
    if (SECTION_ORDER.map((s) => sectionKey(s)).includes(key)) return true;
    return /investigator|researchers?|students?|alumni|affiliated/i.test(text);
  }

  function sectionKey(text) {
    return String(text || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");
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

  function isMetaColumn(label) {
    return /^(#|id|row|slug|hidden|notes internal)$/i.test(label);
  }

  function formatCell(cell) {
    if (!cell || cell.v == null) return "";
    if (cell.f) return String(cell.f).replace(/^=/, "").trim();
    return String(cell.v).trim();
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

    return `images/people/${raw.replace(/^\.?\//, "")}`;
  }

  function extractDriveId(url) {
    const m = String(url).match(/\/d\/([a-zA-Z0-9_-]+)|[?&]id=([a-zA-Z0-9_-]+)/);
    return m ? m[1] || m[2] : "";
  }

  function render(grouped) {
    const seen = new Set();
    const order = [];

    for (const section of SECTION_ORDER) {
      if (grouped.has(section) && grouped.get(section).length) {
        order.push(section);
        seen.add(section);
      }
    }

    for (const section of grouped.keys()) {
      if (!seen.has(section) && grouped.get(section).length) order.push(section);
    }

    const html = order
      .map((section) => sectionHtml(section, grouped.get(section)))
      .join("");

    els.sections.innerHTML =
      html ||
      '<p class="people-status error">No sections matched. Check SECTION_ORDER in people-config.js.</p>';
  }

  function sectionHtml(title, people) {
    return `
      <section class="people-group">
        <h3>${escapeHtml(title)}</h3>
        <div class="people-grid">
          ${people.map(personCard).join("")}
        </div>
      </section>`;
  }

  function personCard(person) {
    const photo = person.photo
      ? `<img class="person-photo" src="${escapeAttr(person.photo)}" alt="" loading="lazy" />`
      : `<div class="person-photo person-photo-placeholder" aria-hidden="true">${escapeHtml(initials(person.name))}</div>`;

    const email = person.email
      ? `<a class="person-email" href="mailto:${escapeAttr(person.email)}">${escapeHtml(person.email)}</a>`
      : "";

    const extras = person.extras
      .map((e) => `<p class="person-detail">${linkify(escapeHtml(e.value))}</p>`)
      .join("");

    return `
      <article class="person-card">
        ${photo}
        <div class="person-body">
          <p class="person-name">${escapeHtml(person.name)}</p>
          ${extras}
          ${email}
        </div>
      </article>`;
  }

  function initials(name) {
    return String(name)
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase();
  }

  function linkify(text) {
    return text.replace(
      /(https?:\/\/[^\s<]+)/g,
      '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
    );
  }

  function showStatus(msg, isError) {
    els.status.textContent = msg;
    els.status.classList.toggle("error", !!isError);
    els.status.hidden = false;
    els.sections.innerHTML = "";
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
    );
  }

  function escapeAttr(str) {
    return escapeHtml(str);
  }
})();
