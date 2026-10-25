(function () {
  const MONTHS = ["January", "February", "March", "April", "May", "June", "July",
    "August", "September", "October", "November", "December"];

  const items = (window.NEWS || []).slice().sort((a, b) => b.date.localeCompare(a.date));

  // Full list on news.html, grouped by year like the publications page.
  const list = document.getElementById("news-list");
  if (list) {
    if (!items.length) {
      list.innerHTML = '<p class="news-status">No news yet.</p>';
    } else {
      const byYear = new Map();
      for (const item of items) {
        const year = item.date.slice(0, 4);
        if (!byYear.has(year)) byYear.set(year, []);
        byYear.get(year).push(item);
      }
      list.innerHTML = [...byYear]
        .map(([year, group]) => `
          <h2 class="news-year-heading">${escapeHtml(year)}</h2>
          ${group.map(newsEntry).join("")}`)
        .join("");
    }
  }

  // Short list on the home page.
  const latest = document.getElementById("news-latest");
  if (latest) {
    const count = Number(latest.dataset.count) || 3;
    latest.innerHTML = items.slice(0, count).map(latestEntry).join("");
  }

  function newsEntry(item) {
    return `
      <article class="news-item" id="${escapeHtml(item.id)}">
        <p class="news-meta">${dateHtml(item.date)}${tagHtml(item.tag)}</p>
        <h3 class="news-title">${escapeHtml(item.title)}</h3>
        ${item.summary ? `<p class="news-summary">${item.summary}</p>` : ""}
        ${imageHtml(item.image)}
        ${linksHtml(item.links)}
        ${linksHtml(item.coverage, "In the news:")}
      </article>`;
  }

  function latestEntry(item) {
    return `
      <li class="news-latest-item">
        <p class="news-meta">${dateHtml(item.date)}${tagHtml(item.tag)}</p>
        <a class="news-latest-title" href="news.html#${escapeHtml(item.id)}">${escapeHtml(item.title)}</a>
      </li>`;
  }

  function dateHtml(date) {
    const [y, m, d] = date.split("-").map(Number);
    const label = d ? `${MONTHS[m - 1]} ${d}, ${y}` : `${MONTHS[m - 1]} ${y}`;
    return `<time datetime="${escapeHtml(date)}">${label}</time>`;
  }

  function tagHtml(tag) {
    return tag ? `<span class="news-tag">${escapeHtml(tag)}</span>` : "";
  }

  function imageHtml(image) {
    if (!image) return "";
    return `
      <figure class="news-figure">
        <img src="${escapeHtml(image.src)}" alt="${escapeHtml(image.alt || "")}" loading="lazy" decoding="async" />
        ${image.caption ? `<figcaption>${escapeHtml(image.caption)}</figcaption>` : ""}
      </figure>`;
  }

  function linksHtml(links, label) {
    if (!links || !links.length) return "";
    const prefix = label ? `<span class="news-links-label">${label}</span> ` : "";
    return `<p class="news-links">${prefix}${links
      .map((link) => `<a href="${escapeHtml(link.url)}">${link.label}</a>`)
      .join(' <span class="publication-link-sep">|</span> ')}</p>`;
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
    );
  }
})();
