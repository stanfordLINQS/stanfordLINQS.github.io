(function () {
  var toggle = document.querySelector(".navPanelToggle");
  var panel = document.getElementById("navPanel");
  if (!toggle || !panel) return;

  toggle.addEventListener("click", function (e) {
    e.preventDefault();
    panel.classList.toggle("visible");
  });

  document.addEventListener("click", function (e) {
    if (
      panel.classList.contains("visible") &&
      !panel.contains(e.target) &&
      !toggle.contains(e.target)
    ) {
      panel.classList.remove("visible");
    }
  });
})();
