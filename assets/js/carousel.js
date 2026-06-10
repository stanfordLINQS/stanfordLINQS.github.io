(function () {
  const banner = document.querySelector("#banner.banner-home");
  if (!banner) return;
  const media = banner.querySelector(".banner-media");
  if (!media) return;

  const config = window.CAROUSEL_CONFIG || {};
  const intervalMs = config.intervalMs || 6000;
  let urls = resolveImageUrls(config.images || []);
  if (!urls.length) urls = ["images/banner.png"];

  const carousel = document.createElement("div");
  carousel.className = "banner-carousel";
  carousel.setAttribute("aria-hidden", "true");

  urls.forEach((url, i) => {
    const slide = document.createElement("div");
    slide.className = "banner-slide" + (i === 0 ? " active" : "");
    slide.style.backgroundImage = `url("${url}")`;
    carousel.appendChild(slide);
  });

  const overlay = document.createElement("div");
  overlay.className = "banner-overlay";

  media.appendChild(carousel);
  media.appendChild(overlay);

  const slides = carousel.querySelectorAll(".banner-slide");
  let index = 0;
  let timer = null;

  // Prev/next arrows
  const prevBtn = document.createElement("button");
  prevBtn.type = "button";
  prevBtn.className = "banner-arrow banner-arrow-prev";
  prevBtn.setAttribute("aria-label", "Previous image");
  prevBtn.innerHTML = "&#10094;";

  const nextBtn = document.createElement("button");
  nextBtn.type = "button";
  nextBtn.className = "banner-arrow banner-arrow-next";
  nextBtn.setAttribute("aria-label", "Next image");
  nextBtn.innerHTML = "&#10095;";

  // Dot indicators
  const dotsWrap = document.createElement("div");
  dotsWrap.className = "banner-dots";
  const dots = urls.map((_, i) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = "banner-dot" + (i === 0 ? " active" : "");
    dot.setAttribute("aria-label", `Go to image ${i + 1} of ${urls.length}`);
    dot.addEventListener("click", () => {
      show(i);
      start();
    });
    dotsWrap.appendChild(dot);
    return dot;
  });

  media.appendChild(prevBtn);
  media.appendChild(nextBtn);
  media.appendChild(dotsWrap);

  // Hide controls when there's only one image
  if (slides.length < 2) {
    prevBtn.style.display = "none";
    nextBtn.style.display = "none";
    dotsWrap.style.display = "none";
  }

  function show(next) {
    slides[index].classList.remove("active");
    dots[index].classList.remove("active");
    index = (next + slides.length) % slides.length;
    slides[index].classList.add("active");
    dots[index].classList.add("active");
  }

  function start() {
    stop();
    timer = setInterval(() => show(index + 1), intervalMs);
  }

  function stop() {
    if (timer) clearInterval(timer);
  }

  prevBtn.addEventListener("click", () => {
    show(index - 1);
    start();
  });
  nextBtn.addEventListener("click", () => {
    show(index + 1);
    start();
  });

  media.addEventListener("mouseenter", stop);
  media.addEventListener("mouseleave", start);
  start();
})();

function resolveImageUrls(images) {
  return images
    .map((item) => {
      if (typeof item === "string") return item.trim();
      if (item && item.driveId) {
        return `https://drive.google.com/uc?export=view&id=${item.driveId}`;
      }
      return "";
    })
    .filter(Boolean);
}
