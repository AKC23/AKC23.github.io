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

  // ---- Footer year ----
  var y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();
})();
