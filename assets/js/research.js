(function () {
  const { loadResearch, paragraphs, findArea } = window.RESEARCH_DATA || {};

  const els = {
    status: document.getElementById("research-status"),
    panels: document.getElementById("research-panels"),
    projects: document.getElementById("research-area-projects"),
    title: document.getElementById("research-area-title"),
    areaRoot: document.getElementById("research-area-content"),
  };

  if (!loadResearch) return;
  if (!els.panels && !els.projects) return;

  init();

  function init() {
    if (els.panels) loadLanding();
    if (els.projects) loadArea();
  }

  async function loadLanding() {
    showStatus("Loading research…");
    try {
      const { grouped } = await loadResearch();
      els.status.hidden = true;
      renderPanels(grouped);
    } catch (err) {
      console.error(err);
      showStatus(
        "Could not load the spreadsheet. Share it as “Anyone with the link” → Viewer, then refresh.",
        true
      );
    }
  }

  async function loadArea() {
    const areaHint = els.areaRoot && els.areaRoot.dataset.researchArea;
    if (!areaHint) {
      return showStatus("Missing research area.", true);
    }

    showStatus("Loading research…");
    try {
      const { grouped } = await loadResearch();
      const area = findArea(grouped, areaHint);
      if (!area) {
        return showStatus("No projects found for this research area.", true);
      }
      if (els.title) els.title.textContent = area.name;
      document.title = `${area.name} — LINQS Lab`;
      els.status.hidden = true;
      renderArea(area);
    } catch (err) {
      console.error(err);
      showStatus(
        "Could not load the spreadsheet. Share it as “Anyone with the link” → Viewer, then refresh.",
        true
      );
    }
  }

  function renderPanels(grouped) {
    const html = Array.from(grouped.values())
      .map((area) => {
        const href = escapeAttr(area.page || "#");
        const imageStyle = area.image
          ? ` style="background-image: url('${escapeAttr(area.image)}')"`
          : "";
        return `
          <a
            href="${href}"
            class="summary-panel research-panel research-panel-link"
            id="${escapeAttr(area.slug)}"
            aria-label="${escapeAttr(area.name)} — View projects"
          >
            <div class="research-panel-media" aria-hidden="true"${imageStyle}></div>
            <div class="research-panel-label">
              <h2>${escapeHtml(area.name)}</h2>
            </div>
            <div class="research-panel-cta">View Projects</div>
          </a>`;
      })
      .join("");

    els.panels.innerHTML =
      html ||
      '<p class="people-status error">No research areas found in the spreadsheet.</p>';
  }

  function renderArea(area) {
    const overview = area.overview
      ? `<div class="research-area-overview">${paragraphs(area.overview)
          .map((p) => `<p>${escapeHtml(p)}</p>`)
          .join("")}</div>`
      : "";

    const projects = area.projects.map(projectHtml).join("");
    els.projects.innerHTML = overview + projects;
  }

  function projectHtml(project) {
    const body = paragraphs(project.body)
      .map((p) => `<p>${escapeHtml(p)}</p>`)
      .join("");
    const figure = project.photo
      ? `<figure class="research-project-figure">
          <img src="${escapeAttr(project.photo)}" alt="${escapeAttr(project.photoAlt || project.title)}" loading="lazy" />
        </figure>`
      : "";
    const hasFigure = figure ? " has-figure" : "";
    const text = body ? `<div class="research-project-text">${body}</div>` : "";

    return `
      <section class="research-project-group" id="${escapeAttr(project.slug)}">
        <h2>${escapeHtml(project.title)}</h2>
        ${
          figure || text
            ? `<div class="research-project-body${hasFigure}">${figure}${text}</div>`
            : ""
        }
      </section>`;
  }

  function showStatus(msg, isError) {
    if (!els.status) return;
    els.status.textContent = msg;
    els.status.classList.toggle("error", !!isError);
    els.status.hidden = false;
    if (els.panels) els.panels.innerHTML = "";
    if (els.projects) els.projects.innerHTML = "";
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
