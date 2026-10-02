/* ===========================================
   Kaif — Portfolio  |  animations.js
   Scroll reveal + hero entrance + scroll
   progress + back to top.

   No dependencies. Only opacity and transform
   are animated (compositor-friendly, no layout).
   Every effect degrades gracefully: if this
   file fails to load, the page still works.
   =========================================== */
(function () {
  "use strict";

  var root = document.documentElement;
  var motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

  function reduced() { return motionQuery.matches; }

  function show(el) { el.classList.add("is-in"); }

  function showAll(list) {
    for (var i = 0; i < list.length; i++) show(list[i]);
  }

  /* Stagger helper: keeps sibling reveals quick and capped so the
     last card in a 10-item grid never feels slow. */
  function stagger(index) {
    return Math.min(index * 60, 360) + "ms";
  }

  /* ---------- 1. Hero entrance (runs on load, not on scroll) ---------- */
  var heroTargets = [];
  var heroText = document.querySelector(".hero-text");

  if (heroText) {
    var heroItems = Array.prototype.slice.call(heroText.children);
    heroItems.forEach(function (el, i) {
      el.classList.add("reveal");
      el.style.transitionDelay = Math.min(i * 90, 450) + "ms";
      heroTargets.push(el);
    });
  }

  var heroPhoto = document.querySelector(".hero-photo");
  if (heroPhoto) {
    heroPhoto.classList.add("reveal-scale");
    heroPhoto.style.transitionDelay = "140ms";
    heroTargets.push(heroPhoto);
  }

  /* ---------- 2. Scroll reveal for every section ---------- */
  /* Cards are grouped by their parent so siblings stagger from each other,
     and no element inside another card is targeted twice. */
  var revealTargets = [];
  var sections = document.querySelectorAll("main > section");

  Array.prototype.forEach.call(sections, function (section) {
    if (section.classList.contains("hero")) return;

    var title = section.querySelector(".section-title");
    if (title) {
      title.classList.add("reveal");
      revealTargets.push(title);
    }

    var sub = section.querySelector(".section-sub");
    if (sub) {
      sub.classList.add("reveal");
      sub.style.transitionDelay = "90ms";
      revealTargets.push(sub);
    }

    var counters = Object.create(null);

    Array.prototype.forEach.call(section.querySelectorAll(".card"), function (card) {
      var parent = card.parentElement;
      if (parent && parent.closest(".card")) return;   /* not a nested card */

      var key = parent ? parent.className + "|" + (parent.id || "") : "root";
      var index = counters[key] || 0;
      counters[key] = index + 1;

      /* The personal-details card is a plain wrapper with no visual
         style of its own, so staggering its rows reads as one smooth
         motion instead of a card fading behind a fading list. */
      var rows = card.querySelectorAll(".details-row");
      if (rows.length) {
        Array.prototype.forEach.call(rows, function (row, i) {
          row.classList.add("reveal");
          row.style.transitionDelay = stagger(i);
          revealTargets.push(row);
        });
        return;
      }

      card.classList.add("reveal");
      card.style.transitionDelay = stagger(index);
      revealTargets.push(card);
    });
  });

  /* ---------- 3. Play the animations ---------- */
  if (reduced() || !("IntersectionObserver" in window)) {
    /* Reduced motion (or an old browser): show everything immediately. */
    showAll(heroTargets.concat(revealTargets));
  } else {
    heroTargets.forEach(function (el, i) {
      window.setTimeout(function () { show(el); }, 60 + i * 30);
    });

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        show(entry.target);
        observer.unobserve(entry.target);  /* only ever plays once */
      });
    }, { rootMargin: "0px 0px -6% 0px", threshold: 0.06 });

    revealTargets.forEach(function (el) { observer.observe(el); });
  }

  /* ---------- 3b. Hand `transform` back to the hover effects ----------
     The reveal needs a slow 0.6s curve; a hover lift needs a fast 0.22s one.
     They use the same property, so once the entrance has finished we mark the
     element "settled" and the stylesheet switches `transform` over to the
     fast timing. This keeps the two effects from fighting each other.

     Done on transitionend (not a guessed timer) so it is correct even if the
     browser clamps the duration, and it is a no-op without CSS transitions. */
  function markSettled(el) {
    if (el.dataset.settled) return;
    el.dataset.settled = "1";
    el.classList.add("is-settled");
  }

  if ("IntersectionObserver" in window) {
    revealTargets.forEach(function (el) {
      el.addEventListener("transitionend", function (e) {
        /* Ignore the colour/shadow transitions settling mid-hover. */
        if (e.target === el && e.propertyName === "transform") markSettled(el);
      });
      /* Safety net: if no transition ever fires (e.g. the element was
         already on screen and skipped the animation), settle it anyway. */
      window.setTimeout(function () { markSettled(el); }, 1400);
    });
  }

  /* If the user turns reduced motion on mid-session, reveal the rest. */
  function onMotionChange() {
    if (reduced()) showAll(heroTargets.concat(revealTargets));
  }
  if (motionQuery.addEventListener) motionQuery.addEventListener("change", onMotionChange);
  else if (motionQuery.addListener) motionQuery.addListener(onMotionChange);

  /* ---------- 4. Scroll progress + back to top ---------- */
  var bar = document.getElementById("scrollProgress");
  var toTop = document.getElementById("backToTop");
  var scheduled = false;

  function update() {
    var y = window.pageYOffset || root.scrollTop || 0;
    var max = root.scrollHeight - window.innerHeight;

    if (bar) {
      var ratio = max > 0 ? Math.min(Math.max(y / max, 0), 1) : 0;
      bar.style.transform = "scaleX(" + ratio + ")";
    }

    if (toTop) {
      if (y > 320) toTop.classList.add("is-visible");
      else toTop.classList.remove("is-visible");
    }

    scheduled = false;
  }

  function onScroll() {
    if (scheduled) return;          /* one update per frame, max */
    scheduled = true;
    window.requestAnimationFrame(update);
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  update();

  if (toTop) {
    toTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: reduced() ? "auto" : "smooth" });
    });
  }
})();