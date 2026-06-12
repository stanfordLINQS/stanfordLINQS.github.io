(function () {
  const publications = window.PUBLICATIONS || [];
  const container = document.getElementById("publications-list");

  if (!container) return;

  if (!publications.length) {
    container.innerHTML = '<p class="publications-status">No publications listed yet.</p>';
    return;
  }

  const byYear = new Map();
  for (const pub of publications) {
    const year = pub.year || pub.yearLabel || "Unknown";
    if (!byYear.has(year)) byYear.set(year, []);
    byYear.get(year).push(pub);
  }

  const years = [...byYear.keys()].sort((a, b) => Number(b) - Number(a));

  container.innerHTML = years.map((year) => yearSection(year, byYear.get(year))).join("");

  function yearSection(year, items) {
    return `
      <h3 class="publications-year-heading">${escapeHtml(String(year))}</h3>
      ${items.map(publicationEntry).join("")}`;
  }

  function publicationEntry(pub) {
    const figure = pub.figure
      ? `<img class="publication-figure" src="${escapeAttr(pub.figure)}" width="150" alt="" loading="lazy" />`
      : "";

    const blockClass = pub.figure ? "publication-block has-figure" : "publication-block";

    return `
      <div class="${blockClass}">
        ${figure}
        <div class="publication-text">
          ${escapeHtml(pub.authors || "")}<br />
          <span class="publication-title">${escapeHtml(pub.title || "")}</span><br />
          ${venueHtml(pub)}
        </div>
      </div>`;
  }

  function venueHtml(pub) {
    const parts = [];

    if (pub.journal && pub.journal !== "arXiv") {
      const detail = formatJournalDetail(pub);
      if (pub.doi) {
        parts.push(
          `<a href="https://doi.org/${escapeAttr(pub.doi)}" class="publication-journal"><em>${escapeHtml(pub.journal)}</em>${detail ? " " + detail : ""} (${pub.yearLabel || pub.year})</a>`
        );
      } else {
        parts.push(
          `<span class="publication-journal"><em>${escapeHtml(pub.journal)}</em>${detail ? " " + detail : ""} (${pub.yearLabel || pub.year})</span>`
        );
      }
    } else if (pub.arxiv) {
      parts.push(
        `<a href="https://arxiv.org/abs/${escapeAttr(pub.arxiv)}" class="publication-journal"><em>arXiv:${escapeHtml(pub.arxiv)}</em> (${pub.yearLabel || pub.year})</a>`
      );
    }

    if (pub.arxiv && pub.journal && pub.journal !== "arXiv") {
      parts.push(
        `<span class="publication-link-sep">|</span> <a href="https://arxiv.org/abs/${escapeAttr(pub.arxiv)}">arXiv</a>`
      );
    }

    for (const link of pub.links || []) {
      parts.push(
        `<span class="publication-link-sep">|</span> <a href="${escapeAttr(link.url)}">${escapeHtml(link.label)}</a>`
      );
    }

    return parts.join(" ");
  }

  function formatJournalDetail(pub) {
    const bits = [];
    if (pub.volume) bits.push(`<strong>${escapeHtml(pub.volume)}</strong>`);
    if (pub.issue) bits.push(`(${escapeHtml(pub.issue)})`);
    if (pub.pages) bits.push(`, ${escapeHtml(pub.pages)}`);
    return bits.join("");
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
