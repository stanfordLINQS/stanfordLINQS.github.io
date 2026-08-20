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
