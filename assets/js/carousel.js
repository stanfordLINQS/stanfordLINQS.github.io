function normalizeCarouselImages(images) {
  return images
    .map((item) => {
      if (typeof item === "string") {
        const url = item.trim();
        return url ? { url, objectPosition: "center center" } : null;
      }
      if (item && item.driveId) {
        return {
          url: `https://drive.google.com/uc?export=view&id=${item.driveId}`,
          objectPosition: item.objectPosition || "center center",
        };
      }
      if (item && (item.src || item.url)) {
        const url = String(item.src || item.url).trim();
        return url
          ? { url, objectPosition: item.objectPosition || "center center" }
          : null;
      }
      return null;
    })
    .filter(Boolean);
}

function resolveImageUrls(images) {
  return normalizeCarouselImages(images).map((item) => item.url);
}

function shuffleArray(items) {
  const arr = items.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function initImageCarousel(media, config, options) {
  if (!media) return;

  const opts = options || {};
  const intervalMs = config.intervalMs || 6000;
  let items = normalizeCarouselImages(config.images || []);
  if (config.shuffle) items = shuffleArray(items);
  if (!items.length) return;

  const carousel = document.createElement("div");
  carousel.className = "banner-carousel";
  carousel.setAttribute("aria-hidden", "true");

  items.forEach((item, i) => {
    const slide = document.createElement("div");
    slide.className = "banner-slide" + (i === 0 ? " active" : "");
    if (opts.fixedFrame) {
      const img = document.createElement("img");
      img.src = item.url;
      img.alt = "";
      img.decoding = "async";
      img.loading = i === 0 ? "eager" : "lazy";
      img.style.objectPosition = item.objectPosition;
      slide.appendChild(img);
    } else if (opts.naturalFit) {
      const img = document.createElement("img");
      img.src = item.url;
      img.alt = "";
      img.decoding = "async";
      img.loading = i === 0 ? "eager" : "lazy";
      slide.appendChild(img);
    } else {
      slide.style.backgroundImage = `url("${item.url}")`;
    }
    carousel.appendChild(slide);
  });

  media.appendChild(carousel);

  if (opts.overlay) {
    const overlay = document.createElement("div");
    overlay.className = "banner-overlay";
    media.appendChild(overlay);
  }

  const slides = carousel.querySelectorAll(".banner-slide");
  let index = 0;
  let timer = null;

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

  const dotsWrap = document.createElement("div");
  dotsWrap.className = "banner-dots";
  const dots = items.map((_, i) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = "banner-dot" + (i === 0 ? " active" : "");
    dot.setAttribute("aria-label", `Go to image ${i + 1} of ${items.length}`);
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
    if (opts.naturalFit) resizeToActive();
  }

  function resizeToActive() {
    const img = slides[index].querySelector("img");
    if (!img || !img.naturalWidth) return;
    const height = (media.clientWidth / img.naturalWidth) * img.naturalHeight;
    media.style.height = `${height}px`;
  }

  if (opts.naturalFit) {
    slides.forEach((slide, i) => {
      const img = slide.querySelector("img");
      if (!img) return;
      img.addEventListener("load", () => {
        if (i === index) resizeToActive();
      });
      if (img.complete) resizeToActive();
    });
    window.addEventListener("resize", resizeToActive);
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
}

(function () {
  const banner = document.querySelector("#banner.banner-home");
  if (!banner) return;
  const media = banner.querySelector(".banner-media");
  const config = window.CAROUSEL_CONFIG || {};
  const urls = resolveImageUrls(config.images || []);
  initImageCarousel(media, { ...config, images: urls.length ? config.images : ["images/banner.png"] }, {
    overlay: true,
  });
})();

(function () {
  const media = document.getElementById("people-carousel");
  if (!media) return;
  initImageCarousel(media, window.PEOPLE_CAROUSEL_CONFIG || {}, { fixedFrame: true });
})();
