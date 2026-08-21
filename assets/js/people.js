(function () {
  const { loadPeople, photoCandidates, initials, personUrl } = window.PEOPLE_DATA || {};

  const els = {
    status: document.getElementById("people-status"),
    sections: document.getElementById("people-sections"),
  };

  if (!els.sections || !loadPeople) return;

  init();

  function init() {
    els.sections.addEventListener("error", onPhotoError, true);
    load();
  }

  async function load() {
    showStatus("Loading people…");
    try {
      const { grouped } = await loadPeople();
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

  function onPhotoError(e) {
    const img = e.target;
    if (!(img instanceof HTMLImageElement) || !img.classList.contains("person-photo")) return;
    const rest = (img.dataset.fallbacks || "").split("|").filter(Boolean);
    if (rest.length) {
      img.dataset.fallbacks = rest.slice(1).join("|");
      img.src = rest[0];
    } else {
      img.replaceWith(placeholderEl(img.dataset.name || ""));
    }
  }

  function placeholderEl(name) {
    const div = document.createElement("div");
    div.className = "person-photo person-photo-placeholder";
    div.setAttribute("aria-hidden", "true");
    div.textContent = initials(name);
    return div;
  }

  function render(grouped) {
    const order = [...grouped.keys()].filter((section) => grouped.get(section).length);
    const alumni = order.filter((section) => section === "Alumni");
    const rest = order.filter((section) => section !== "Alumni");

    const html = [...rest, ...alumni]
      .map((section) => sectionHtml(section, grouped.get(section)))
      .join("");

    els.sections.innerHTML =
      html ||
      '<p class="people-status error">No sections found in the spreadsheet.</p>';
  }

  function sectionHtml(title, people) {
    if (title === "Alumni") {
      return alumniSectionHtml(people);
    }

    return `
      <section class="people-group">
        <h2>${escapeHtml(title)}</h2>
        <div class="people-grid">
          ${people.map(personCard).join("")}
        </div>
      </section>`;
  }

  function alumniSectionHtml(people) {
    const blocks = [];
    let currentGroup = null;
    let entries = [];

    function flushGroup() {
      if (!entries.length) return;
      blocks.push(`
        <div class="alumni-group">
          ${currentGroup ? `<h3 class="alumni-subgroup">${escapeHtml(currentGroup)}</h3>` : ""}
          <ul class="alumni-list">
            ${entries.join("")}
          </ul>
        </div>`);
      entries = [];
    }

    for (const person of people) {
      if (person.alumniGroup !== currentGroup) {
        flushGroup();
        currentGroup = person.alumniGroup;
      }
      entries.push(`<li class="alumni-entry">${alumniEntryHtml(person)}</li>`);
    }
    flushGroup();

    return `
      <section class="people-group people-group--alumni">
        <h2>Alumni</h2>
        ${blocks.join("")}
      </section>`;
  }

  function alumniEntryHtml(person) {
    const gradYear = String(person.gradYear || "").trim();
    const job = String(person.currentJob || "").trim();
    const showJob = job && job !== "-";
    const thesisUrl = String(person.thesisUrl || "").trim();

    const metaParts = [];
    if (gradYear) metaParts.push(escapeHtml(gradYear));
    if (thesisUrl) {
      metaParts.push(
        `<a class="alumni-thesis" href="${escapeAttr(thesisUrl)}" target="_blank" rel="noopener noreferrer">thesis</a>`
      );
    }
    if (showJob) metaParts.push(escapeHtml(job));

    const meta = metaParts.length
      ? `<span class="alumni-meta">${metaParts.join('<span class="alumni-sep" aria-hidden="true">·</span>')}</span>`
      : "";

    return `
      <strong class="alumni-name">${escapeHtml(person.name)}</strong>
      ${meta}`;
  }

  function personCard(person) {
    const profileHref = escapeAttr(personUrl(person.slug));
    const profileLabel = escapeAttr(`View ${person.name}'s profile`);
    const candidates = photoCandidates(person);
    const posStyle = person.photoPosition
      ? ` style="object-position: ${escapeAttr(person.photoPosition)}"`
      : "";
    const photoInner = candidates.length
      ? `<img class="person-photo" src="${escapeAttr(candidates[0])}" data-slug="${escapeAttr(person.slug)}" data-fallbacks="${escapeAttr(candidates.slice(1).join("|"))}" data-name="${escapeAttr(person.name)}" alt="" loading="lazy" referrerpolicy="no-referrer"${posStyle} />`
      : `<span class="person-photo person-photo-placeholder" aria-hidden="true">${escapeHtml(initials(person.name))}</span>`;
    const photo = `<a class="person-photo-link" href="${profileHref}" aria-label="${profileLabel}">${photoInner}</a>`;

    const title = person.title
      ? `<p class="person-title">${escapeHtml(person.title)}</p>`
      : "";

    return `
      <article class="person-card">
        ${photo}
        <div class="person-body">
          <p class="person-name">
            <a href="${profileHref}">${escapeHtml(person.name)}</a>
          </p>
          ${title}
        </div>
      </article>`;
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
