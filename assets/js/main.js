(function () {
  var file = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  if (!file) file = "index.html";

  var sectionByPage = {
    "index.html": "index.html",
    "people.html": "people.html",
    "person.html": "people.html",
    "research.html": "research.html",
    "transduction.html": "research.html",
    "superconducting-circuits.html": "research.html",
    "acoustics.html": "research.html",
    "nonlinear-optics.html": "research.html",
    "publications.html": "publications.html",
    "conferences.html": "publications.html",
    "contact.html": "contact.html"
  };
  var currentSection = sectionByPage[file] || file;

  document.querySelectorAll("#nav a, #navPanel a").forEach(function (link) {
    var href = (link.getAttribute("href") || "").split("/").pop().toLowerCase();
    if (href === currentSection) {
      link.setAttribute("aria-current", "page");
    }
  });
})();

(function () {
  var toggle = document.querySelector(".navPanelToggle");
  var panel = document.getElementById("navPanel");
  if (!toggle || !panel) return;

  function setOpen(open) {
    panel.classList.toggle("visible", open);
    document.body.classList.toggle("nav-open", open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    toggle.textContent = open ? "✕" : "☰";
  }

  toggle.addEventListener("click", function (e) {
    e.preventDefault();
    setOpen(!panel.classList.contains("visible"));
  });

  document.addEventListener("click", function (e) {
    if (
      panel.classList.contains("visible") &&
      !panel.contains(e.target) &&
      !toggle.contains(e.target)
    ) {
      setOpen(false);
    }
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") setOpen(false);
  });
})();
