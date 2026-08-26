function applyCarouselOverrides(item, config) {
  const cfg = config || window.CAROUSEL_CONFIG || {};
  const driveId = extractCarouselDriveId(item.url);
  const overrides = driveId && cfg.imageOverrides?.[driveId];
  if (!overrides) return item;

  const next = { ...item, ...overrides };
  if (overrides.src || overrides.url) {
    next.url = resolveCarouselUrl(String(overrides.src || overrides.url));
  }
  return next;
}

function normalizeCarouselImages(images, config) {
  return images
    .map((item) => {
      if (typeof item === "string") {
        const url = resolveCarouselUrl(item);
        return url ? { url, objectPosition: "center center" } : null;
      }
      if (item && item.driveId) {
        return {
          url: `https://lh3.googleusercontent.com/d/${item.driveId}=w1200`,
          objectPosition: item.objectPosition || "center center",
        };
      }
      if (item && (item.src || item.url)) {
        const url = resolveCarouselUrl(String(item.src || item.url));
        return url
          ? { url, objectPosition: item.objectPosition || "center center" }
          : null;
      }
      return null;
    })
    .filter(Boolean)
    .map((item) => applyCarouselOverrides(item, config));
}

function extractCarouselDriveId(value) {
  const m = String(value).match(/\/d\/([a-zA-Z0-9_-]+)|[?&]id=([a-zA-Z0-9_-]+)/);
  return m ? m[1] || m[2] : "";
}

function resolveCarouselUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";

  const driveId = extractCarouselDriveId(raw);
  if (driveId) return `https://lh3.googleusercontent.com/d/${driveId}=w1200`;

  if (/^https?:\/\//i.test(raw)) return raw;

  if (/^[a-zA-Z0-9_-]{20,}$/.test(raw)) {
    return `https://lh3.googleusercontent.com/d/${raw}=w1200`;
  }

  return raw;
}

function resolveImageUrls(images) {
  return normalizeCarouselImages(images).map((item) => item.url);
}

function localFallbackUrl(config, index, currentUrl) {
  const locals = config.images || [];
  const raw = locals[index];
  if (!raw) return "";
  const url =
    typeof raw === "string"
      ? resolveCarouselUrl(raw)
      : resolveCarouselUrl(raw.src || raw.url || "");
  return url && url !== currentUrl ? url : "";
}

function createSlideImage(item, fallbackUrl, loading) {
  const img = document.createElement("img");
  img.alt = "";
  img.decoding = "async";
  img.loading = loading || "lazy";
  // Drive/lh3 blocks requests that send a localhost referrer.
  img.referrerPolicy = "no-referrer";
  if (item.objectPosition) img.style.objectPosition = item.objectPosition;
  img.src = item.url;
  if (fallbackUrl) {
    img.addEventListener("error", () => {
      if (img.getAttribute("src") !== fallbackUrl) img.src = fallbackUrl;
    });
  }
  return img;
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
  let items = normalizeCarouselImages(config.images || [], config);
  if (config.shuffle) items = shuffleArray(items);
  if (!items.length) return;

  const carousel = document.createElement("div");
  carousel.className = "banner-carousel";
  carousel.setAttribute("aria-hidden", "true");

  items.forEach((item, i) => {
    const slide = document.createElement("div");
    slide.className = "banner-slide" + (i === 0 ? " active" : "");
    const fallbackUrl = localFallbackUrl(config, i, item.url);
    slide.appendChild(
      createSlideImage(item, fallbackUrl, i === 0 ? "eager" : "lazy")
    );
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

  const pauseBtn = document.createElement("button");
  pauseBtn.type = "button";
  pauseBtn.className = "banner-pause";
  dotsWrap.appendChild(pauseBtn);

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

  const multi = slides.length > 1;
  if (!multi) {
    prevBtn.hidden = true;
    nextBtn.hidden = true;
    dotsWrap.hidden = true;
  }

  let userPaused = false;
  let holdPaused = false;

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

  function autoplayAllowed() {
    return multi && !userPaused && !holdPaused && !document.hidden;
  }

  function syncPauseButton() {
    pauseBtn.hidden = !multi;
    pauseBtn.textContent = userPaused ? "Play" : "Pause";
    pauseBtn.setAttribute(
      "aria-label",
      userPaused ? "Play slideshow" : "Pause slideshow"
    );
  }

  function start() {
    stop();
    if (!autoplayAllowed()) return;
    timer = setInterval(() => show(index + 1), intervalMs);
  }

  function stop() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  pauseBtn.addEventListener("click", () => {
    userPaused = !userPaused;
    syncPauseButton();
    if (userPaused) stop();
    else start();
  });

  prevBtn.addEventListener("click", () => {
    show(index - 1);
    start();
  });
  nextBtn.addEventListener("click", () => {
    show(index + 1);
    start();
  });

  media.addEventListener("mouseenter", () => {
    holdPaused = true;
    stop();
  });
  media.addEventListener("mouseleave", () => {
    holdPaused = false;
    start();
  });
  media.addEventListener("focusin", () => {
    holdPaused = true;
    stop();
  });
  media.addEventListener("focusout", (event) => {
    if (media.contains(event.relatedTarget)) return;
    holdPaused = false;
    start();
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop();
    else start();
  });

  syncPauseButton();
  start();
}

(function () {
  const banner = document.querySelector("#banner.banner-home");
  if (!banner) return;
  const media = banner.querySelector(".banner-media");
  if (!media) return;

  initHomeCarousel(media);
})();

async function initHomeCarousel(media) {
  const config = window.CAROUSEL_CONFIG || {};
  const loadCarouselImages = window.CAROUSEL_DATA?.loadCarouselImages;
  let images = [];

  if (loadCarouselImages) {
    try {
      images = await loadCarouselImages(config);
    } catch (err) {
      console.error(err);
    }
  }

  if (!images.length) images = config.images || [];

  initImageCarousel(media, { ...config, images }, { overlay: true });
}

(function () {
  const media = document.getElementById("people-carousel");
  if (!media) return;
  initPeopleCarousel(media);
})();

async function initPeopleCarousel(media) {
  const config = window.PEOPLE_CAROUSEL_CONFIG || {};
  const loadCarouselImages = window.CAROUSEL_DATA?.loadCarouselImages;
  let images = [];

  if (loadCarouselImages) {
    try {
      images = await loadCarouselImages(config);
    } catch (err) {
      console.error(err);
    }
  }

  if (!images.length) images = config.images || [];

  initImageCarousel(media, { ...config, images }, { fixedFrame: true });
}
