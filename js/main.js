(function () {
  "use strict";

  var root = document.documentElement;

  // ---- Theme toggle (saved per browser, falls back to system preference) ----
  var themeBtn = document.querySelector(".theme-toggle");
  function currentTheme() {
    var attr = root.getAttribute("data-theme");
    if (attr) return attr;
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  function setThemeColorMeta(theme) {
    var m = document.querySelector('meta[name="theme-color"]');
    if (m) m.setAttribute("content", theme === "dark" ? "#16110e" : "#fffaf6");
  }
  setThemeColorMeta(currentTheme());
  if (themeBtn) {
    themeBtn.addEventListener("click", function () {
      var next = currentTheme() === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      setThemeColorMeta(next);
      try { localStorage.setItem("theme", next); } catch (e) {}
    });
  }

  // ---- Mobile menu ----
  var menuBtn = document.querySelector(".menu-btn");
  var links = document.getElementById("nav-links");
  function closeMenu() {
    if (!links) return;
    links.classList.remove("open");
    if (menuBtn) menuBtn.setAttribute("aria-expanded", "false");
  }
  if (menuBtn && links) {
    menuBtn.addEventListener("click", function () {
      var open = links.classList.toggle("open");
      menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
    });
    links.addEventListener("click", function (e) {
      if (e.target.tagName === "A") closeMenu();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeMenu();
    });
  }

  // ---- Active nav link on scroll ----
  var navAnchors = links ? Array.prototype.slice.call(links.querySelectorAll("a")) : [];
  var sections = navAnchors
    .map(function (a) { return document.querySelector(a.getAttribute("href")); })
    .filter(Boolean);
  if ("IntersectionObserver" in window && sections.length) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var id = "#" + entry.target.id;
        navAnchors.forEach(function (a) {
          a.classList.toggle("active", a.getAttribute("href") === id);
        });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    sections.forEach(function (s) { spy.observe(s); });
  }

  // ---- Reveal on scroll ----
  var reveals = document.querySelectorAll(".reveal");
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce || !("IntersectionObserver" in window)) {
    reveals.forEach(function (el) { el.classList.add("in"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: "0px 0px -40px 0px" });
    reveals.forEach(function (el) { io.observe(el); });
  }

  // ---- Reviews carousel (infinite loop) ----
  var car = document.getElementById("reviews");
  if (car) {
    var track = car.querySelector(".car-track");
    var originals = Array.prototype.slice.call(track.querySelectorAll(".slide"));
    var n = originals.length;
    var dotsBox = document.getElementById("reviews-dots");
    var dots = [];
    var clone = function (el) {
      var c = el.cloneNode(true);
      c.setAttribute("aria-hidden", "true");
      c.classList.add("is-clone");
      c.querySelectorAll("button").forEach(function (b) { b.tabIndex = -1; });
      return c;
    };
    var before = document.createDocumentFragment();
    var after = document.createDocumentFragment();
    originals.forEach(function (el) { before.appendChild(clone(el)); after.appendChild(clone(el)); });
    track.insertBefore(before, track.firstChild);
    track.appendChild(after);

    var step = function () {
      var gap = parseFloat(getComputedStyle(track).columnGap) || 18;
      return originals[0].getBoundingClientRect().width + gap;
    };
    var jump = function (left) {
      track.style.scrollBehavior = "auto";
      track.style.scrollSnapType = "none";
      track.scrollLeft = left;
      void track.offsetWidth;
      track.style.scrollSnapType = "";
      track.style.scrollBehavior = "";
    };
    var current = function () { return Math.round(track.scrollLeft / step()); };
    var recenter = function () {
      var i = current();
      if (i < n) jump((i + n) * step());
      else if (i >= 2 * n) jump((i - n) * step());
    };
    var update = function () {
      var idx = ((current() % n) + n) % n;
      dots.forEach(function (d, i) { d.setAttribute("aria-current", i === idx ? "true" : "false"); });
    };
    for (var i = 0; i < n; i++) {
      (function (i) {
        var d = document.createElement("button");
        d.type = "button"; d.setAttribute("aria-label", "Go to review " + (i + 1));
        d.addEventListener("click", function () {
          var base = Math.floor(current() / n) * n;
          track.scrollTo({ left: (base + i) * step() });
        });
        dotsBox.appendChild(d); dots.push(d);
      })(i);
    }
    var go = function (dir) { track.scrollTo({ left: (current() + dir) * step() }); };
    car.querySelector(".prev").addEventListener("click", function () { go(-1); });
    car.querySelector(".next").addEventListener("click", function () { go(1); });
    track.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") { e.preventDefault(); go(1); }
      if (e.key === "ArrowLeft") { e.preventDefault(); go(-1); }
    });
    var settle;
    track.addEventListener("scroll", function () {
      update();
      clearTimeout(settle);
      settle = setTimeout(recenter, 140);
    }, { passive: true });
    window.addEventListener("resize", function () { jump((current() % n + n) * step()); update(); });
    jump(n * step());
    update();
  }

  // ---- Featured project video ----
  var play = document.querySelector(".play-btn");
  if (play) {
    var media = play.closest(".featured-media");
    var vid = media.querySelector(".demo-video");
    var still = media.querySelector(".featured-img");
    var start = function () {
      still.hidden = true;
      play.hidden = true;
      vid.hidden = false;
      var r = media.getBoundingClientRect();
      if (r.top < 0 || r.bottom > window.innerHeight) media.scrollIntoView({ behavior: "smooth", block: "center" });
      vid.play().catch(function () {});
    };
    document.querySelectorAll("[data-play]").forEach(function (b) { b.addEventListener("click", start); });
  }

  // ---- Project image switchers ----
  document.querySelectorAll(".card-media.multi").forEach(function (box) {
    var slides = box.querySelectorAll(".m-slide");
    var btns = box.querySelectorAll(".m-dots button");
    btns.forEach(function (b, i) {
      b.addEventListener("click", function () {
        slides.forEach(function (sl, j) { sl.classList.toggle("on", j === i); sl.tabIndex = j === i ? 0 : -1; });
        btns.forEach(function (x, j) { x.setAttribute("aria-current", j === i ? "true" : "false"); });
      });
    });
  });

  // ---- Review lightbox ----
  var dlg = document.getElementById("lightbox");
  if (dlg && typeof dlg.showModal === "function") {
    var big = document.getElementById("lightbox-img");
    var cap = document.getElementById("lightbox-cap");
    document.querySelectorAll(".review-btn").forEach(function (b) {
      b.addEventListener("click", function () {
        var im = b.querySelector("img");
        big.src = b.getAttribute("data-full");
        big.alt = im ? im.alt : "";
        cap.textContent = b.getAttribute("data-title") || "";
        dlg.showModal();
      });
    });
    dlg.addEventListener("click", function (e) { if (e.target === dlg) dlg.close(); });
  }

  // ---- Back to top ----
  var topBtn = document.getElementById("to-top");
  if (topBtn) {
    topBtn.hidden = false;
    var toggleTop = function () { topBtn.classList.toggle("show", window.scrollY > 500); };
    window.addEventListener("scroll", toggleTop, { passive: true });
    toggleTop();
    topBtn.addEventListener("click", function () {
      var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
    });
  }

  // ---- Footer year ----
  var y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();
})();
