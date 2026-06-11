(function () {
  const { loadPeople, photoCandidates, initials, personUrl } = window.PEOPLE_DATA || {};

  const els = {
    status: document.getElementById("person-status"),
    profile: document.getElementById("person-profile"),
  };

  if (!els.profile || !loadPeople) return;

  init();

  function init() {
    els.profile.addEventListener("error", onPhotoError, true);
    load();
  }

  async function load() {
    const slug = new URLSearchParams(window.location.search).get("p") || "";
    if (!slug) {
      return showStatus("No person selected.", true);
    }

    showStatus("Loading profile…");
    try {
      const { bySlug } = await loadPeople();
      const person = bySlug.get(slug);
      if (!person) {
        return showStatus("Person not found.", true);
      }
      document.title = `${person.name} — LINQS Lab`;
      els.status.hidden = true;
      render(person);
    } catch (err) {
      console.error(err);
      showStatus(
        "Could not load the spreadsheet. Share it as “Anyone with the link” → Viewer, then refresh.",
        true
      );
    }
  }

  function render(person) {
    const candidates = photoCandidates(person);
    const photo = candidates.length
      ? `<img class="person-profile-photo" src="${escapeAttr(candidates[0])}" data-fallbacks="${escapeAttr(candidates.slice(1).join("|"))}" data-name="${escapeAttr(person.name)}" alt="" />`
      : `<div class="person-profile-photo person-photo-placeholder" aria-hidden="true">${escapeHtml(initials(person.name))}</div>`;

    const bio = formatParagraphs(person.bio);
    const education = formatList(person.education);
    const research = formatResearch(person.researchAreas);
    const contact = contactHtml(person);
    const links = linksHtml(person);

    const pronouns = formatPronouns(person.pronouns);

    els.profile.innerHTML = `
      <p class="person-back"><a href="people.html">← People</a></p>
      <header class="person-profile-header">
        ${photo}
        <div class="person-profile-identity">
          <h1 class="person-profile-name">${escapeHtml(person.name)}</h1>
          ${pronouns ? `<p class="person-profile-pronouns">${escapeHtml(pronouns)}</p>` : ""}
        </div>
      </header>
      <div class="person-profile-layout">
        <div class="person-profile-main">
          ${bio ? `<section class="person-profile-section">${bio}</section>` : ""}
          ${education ? `<section class="person-profile-section"><h2>Education</h2>${education}</section>` : ""}
          ${research ? `<section class="person-profile-section"><h2>Research</h2>${research}</section>` : ""}
        </div>
        <aside class="person-profile-sidebar">
          ${contact}
          ${links}
        </aside>
      </div>`;
  }

  function contactHtml(person) {
    const contactItems = [];
    if (person.phone) {
      contactItems.push(
        `<p><span class="person-sidebar-label">p</span> ${escapeHtml(person.phone)}</p>`
      );
    }
    if (person.email) {
      contactItems.push(
        `<p><a class="person-inline-link" href="mailto:${escapeAttr(person.email)}">${escapeHtml(person.email)}</a></p>`
      );
    }
    if (person.mailCode) {
      contactItems.push(`<p>Mail Code: ${escapeHtml(person.mailCode)}</p>`);
    }

    let html = "";
    if (contactItems.length) {
      html += `
        <section class="person-sidebar-section">
          <h2 class="person-sidebar-heading">${iconEnvelope("person-sidebar-icon")} Contact</h2>
          ${contactItems.join("")}
        </section>`;
    }
    if (person.location) {
      html += `
        <section class="person-sidebar-section">
          <h2 class="person-sidebar-heading">Location</h2>
          ${formatLines(person.location)}
        </section>`;
    }
    return html;
  }

  function linksHtml(person) {
    const links = [];
    if (person.personalWebsite) {
      links.push(linkItem("Personal Website", person.personalWebsite));
    }
    if (person.twitter) {
      links.push(linkItem("Twitter", person.twitter));
    }
    if (person.googleScholar) {
      links.push(linkItem("Google Scholar", person.googleScholar));
    }
    if (person.linkedin) {
      links.push(linkItem("LinkedIn", person.linkedin));
    }
    if (!links.length) return "";

    return `
      <section class="person-sidebar-section">
        <h2 class="person-sidebar-heading">${iconLink()} Links</h2>
        <ul class="person-link-list">${links.join("")}</ul>
      </section>`;
  }

  function formatPronouns(pronouns) {
    const value = String(pronouns || "").trim();
    if (!value) return "";
    if (/^pronouns\s*:/i.test(value)) return value;
    return `Pronouns: ${value}`;
  }

  function iconEnvelope(className = "person-inline-icon") {
    return `<svg class="${className}" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z"/></svg>`;
  }

  function iconLink() {
    return `<svg class="person-sidebar-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/></svg>`;
  }

  function iconExternal() {
    return `<svg class="person-inline-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/></svg>`;
  }

  function linkItem(label, url) {
    return `<li><a class="person-inline-link" href="${escapeAttr(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(label)}${iconExternal()}</a></li>`;
  }

  function formatParagraphs(text) {
    return String(text)
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter(Boolean)
      .map((p) => `<p>${linkify(escapeHtml(p.replace(/\n/g, " ")))}</p>`)
      .join("");
  }

  function formatList(text) {
    const items = String(text)
      .split(/\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    if (!items.length) return "";
    return `<ul class="person-profile-list">${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
  }

  function formatLines(text) {
    return String(text)
      .split(/\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => `<p>${escapeHtml(line)}</p>`)
      .join("");
  }

  function formatResearch(text) {
    const items = String(text)
      .split(/[,;\n]/)
      .map((item) => item.trim())
      .filter(Boolean);
    if (!items.length) return "";
    return `<ul class="person-profile-list person-research-list">${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
  }

  function onPhotoError(e) {
    const img = e.target;
    if (!(img instanceof HTMLImageElement) || !img.classList.contains("person-profile-photo")) return;
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
    div.className = "person-profile-photo person-photo-placeholder";
    div.setAttribute("aria-hidden", "true");
    div.textContent = initials(name);
    return div;
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
    els.profile.innerHTML = "";
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
