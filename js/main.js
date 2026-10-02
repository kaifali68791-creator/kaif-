/* ===========================================
   Kaif — Portfolio  |  main.js
   Small and dependency-free.
   =========================================== */
(function () {
  "use strict";

  /* ---------- 1. Mobile menu ---------- */
  var toggle = document.getElementById("navToggle");
  var menu = document.getElementById("navMenu");

  function closeMenu() {
    menu.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
  }

  toggle.addEventListener("click", function () {
    var open = menu.classList.toggle("open");
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
  });

  // Close the menu after clicking any link inside it
  menu.addEventListener("click", function (e) {
    if (e.target.tagName === "A") closeMenu();
  });

  // Close the menu when clicking outside of it
  document.addEventListener("click", function (e) {
    if (!menu.contains(e.target) && !toggle.contains(e.target)) closeMenu();
  });

  // Close the menu when pressing Escape
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeMenu();
  });

  /* ---------- 2. Footer year ---------- */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- 3. Highlight the current section in the nav ---------- */
  var navLinks = Array.prototype.slice.call(
    document.querySelectorAll('.nav-menu a[href^="#"]')
  );

  // Ignore placeholder links such as href="#" (the Resume button):
  // "#" is not a valid selector and would throw a SyntaxError.
  var sections = navLinks
    .map(function (link) {
      var href = link.getAttribute("href");
      if (!href || href === "#") return null;
      return document.querySelector(href);
    })
    .filter(Boolean);

  function setActive(id) {
    navLinks.forEach(function (link) {
      link.classList.toggle("active", link.getAttribute("href") === "#" + id);
    });
  }

  if ("IntersectionObserver" in window && sections.length) {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
    );
    sections.forEach(function (section) { observer.observe(section); });
  }

  /* ---------- 4. Placeholder links ----------
     Any element with [data-placeholder] currently has no real link.
     Instead of jumping to "#" we block it and show a small message,
     so there are no broken links or page jumps. */
  var toast = document.getElementById("toast");
  var toastTimer = null;

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toast.classList.remove("show");
    }, 2600);
  }

  document.addEventListener("click", function (e) {
    var el = e.target.closest("[data-placeholder]");
    if (!el) return;
    e.preventDefault();
    showToast("This link is not added yet. Please fill it in index.html.");
  });

  /* ---------- 5. Service worker (offline / installable) ----------
     Appended at the end of the existing IIFE so nothing above it changes.
     Registration is fire-and-forget: it waits for window "load" so it can
     never delay first paint, the reveal animations or any tap, and every
     failure path is swallowed because a missing/offline service worker must
     not break the page. */
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("sw.js").catch(function () {
        /* Not fatal: the site works exactly the same without it. */
      });
    });
  }
})();