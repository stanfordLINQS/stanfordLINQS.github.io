(function () {
  const { SECTION_ORDER, loadPeople, photoCandidates, initials, personUrl } = window.PEOPLE_DATA || {};

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
    const profileHref = escapeAttr(personUrl(person.slug));
    const profileLabel = escapeAttr(`View ${person.name}'s profile`);
    const candidates = photoCandidates(person);
    const photoInner = candidates.length
      ? `<img class="person-photo" src="${escapeAttr(candidates[0])}" data-fallbacks="${escapeAttr(candidates.slice(1).join("|"))}" data-name="${escapeAttr(person.name)}" alt="" loading="lazy" />`
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
