// Septia Nenengsih — Portofolio
document.documentElement.classList.add("js");

(function () {
  var root = document.documentElement;
  var reduceMotion =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---- Intro loader → welcome hero ---------------------------------
  // "Welcome to my Portofolio" with a loading bar, then the whole screen
  // dissolves (blur + fade) and the page underneath animates in.
  var intro = document.getElementById("intro");

  function pageReady() {
    if (root.classList.contains("is-ready") && !root.classList.contains("intro-active")) {
      startTyper();
      return;
    }
    root.classList.remove("intro-active");
    root.classList.add("is-ready");
    startTyper();
  }

  if (!intro || reduceMotion) {
    if (intro) intro.remove();
    pageReady();
  } else {
    var pctEl = intro.querySelector(".intro-pct");
    var bar = intro.querySelector(".intro-bar");
    var loaded = document.readyState === "complete";
    var t0 = performance.now();
    var MIN = 1500; // shortest time the loader stays on screen
    var MAX = 4000; // never wait longer than this for slow images
    var p = 0;
    var leaving = false;

    window.addEventListener("load", function () {
      loaded = true;
    });

    var tick = function (now) {
      var t = now - t0;
      var target = (loaded && t > MIN) || t > MAX ? 100 : Math.min(92, (t / MIN) * 92);
      p = Math.min(target, p + Math.max(0.5, (target - p) * 0.12));
      pctEl.textContent = Math.round(p) + "%";
      bar.style.setProperty("--p", (p / 100).toFixed(3));
      if (p >= 100) {
        setTimeout(leave, 250);
        return;
      }
      if (!leaving) requestAnimationFrame(tick);
    };

    var leave = function () {
      if (leaving) return;
      leaving = true;
      intro.classList.add("is-leaving");
      setTimeout(pageReady, 200);
      setTimeout(function () {
        intro.remove();
      }, 1100);
    };

    intro.addEventListener("click", leave); // click to skip
    requestAnimationFrame(tick);
  }

  // ---- Typewriter in the welcome hero ------------------------------
  var typerStarted = false;
  function startTyper() {
    var el = document.querySelector(".typer");
    if (!el || typerStarted || reduceMotion) return;
    typerStarted = true;
    var words = el.getAttribute("data-words").split("|");
    var wi = 0;
    var ci = 0;
    var deleting = false;
    el.textContent = "";

    function step() {
      var word = words[wi];
      if (!deleting) {
        ci++;
        el.textContent = word.slice(0, ci);
        if (ci >= word.length) {
          deleting = true;
          return setTimeout(step, 2200);
        }
        return setTimeout(step, 70);
      }
      ci--;
      el.textContent = word.slice(0, ci);
      if (ci <= 0) {
        deleting = false;
        wi = (wi + 1) % words.length;
        return setTimeout(step, 350);
      }
      setTimeout(step, 35);
    }
    setTimeout(step, 1300);
  }

  // ---- Mobile menu -------------------------------------------------
  var nav = document.getElementById("top-nav");
  var toggle = nav.querySelector(".nav-toggle");

  function setMenu(open) {
    nav.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
  }

  toggle.addEventListener("click", function () {
    setMenu(!nav.classList.contains("is-open"));
  });

  nav.querySelectorAll(".nav-links a").forEach(function (a) {
    a.addEventListener("click", function () {
      setMenu(false);
    });
  });

  // ---- Navbar turns clear while it sits over the welcome photo -----
  var welcome = document.getElementById("welcome");
  function updateNavClear() {
    var clear = welcome && window.scrollY < welcome.offsetHeight - nav.offsetHeight - 8;
    nav.classList.toggle("is-clear", !!clear);
  }
  updateNavClear();
  window.addEventListener("scroll", updateNavClear, { passive: true });
  window.addEventListener("resize", updateNavClear);

  // ---- Sliding indicator under the active nav link -----------------
  var navBox = nav.querySelector("nav");
  var indicator = document.createElement("span");
  indicator.className = "nav-indicator";
  indicator.setAttribute("aria-hidden", "true");
  navBox.appendChild(indicator);
  var currentLink = null;

  function moveIndicator(a) {
    currentLink = a || null;
    if (!a) {
      indicator.style.opacity = "0";
      return;
    }
    var box = navBox.getBoundingClientRect();
    var r = a.getBoundingClientRect();
    indicator.style.width = r.width + "px";
    indicator.style.transform =
      "translate(" + (r.left - box.left) + "px," + (r.bottom - box.top - 2) + "px)";
    indicator.style.opacity = "1";
  }

  window.addEventListener("resize", function () {
    moveIndicator(currentLink);
  });
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () {
      moveIndicator(currentLink);
    });
  }

  // ---- Highlight the current section in the navbar -----------------
  // Sections without their own nav item map to the nearest one.
  var alias = { motto: "education", parents: "education", home: null, welcome: null, watchlist: "gallery" };
  var links = {};
  nav.querySelectorAll(".nav-links a").forEach(function (a) {
    links[a.dataset.section] = a;
  });

  function setActive(id) {
    var key = id in alias ? alias[id] : id;
    Object.keys(links).forEach(function (k) {
      links[k].classList.toggle("is-active", k === key);
    });
    moveIndicator(links[key]);
  }

  // ---- Items inside a section appear one after another -------------
  var STAGGER =
    ".hero-strip figure, .facts li, .timeline li, .ach-card, .steps li, .eng-item, " +
    ".parent, .phone, .arches figure, .watch-card, .contact-list li, .social-row a";
  document.querySelectorAll(".reveal").forEach(function (section) {
    section.querySelectorAll(STAGGER).forEach(function (el, i) {
      el.classList.add("stagger");
      el.style.setProperty("--d", Math.min(i, 8) * 90 + "ms");
    });
  });

  function settle(section) {
    // drop the stagger timing once it has played, so hover effects stay snappy
    setTimeout(function () {
      section.querySelectorAll(".stagger").forEach(function (el) {
        el.classList.remove("stagger");
        el.style.removeProperty("--d");
      });
    }, 2200);
  }

  if ("IntersectionObserver" in window) {
    var sections = document.querySelectorAll("main section[id]");
    var spy = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) setActive(e.target.id);
        });
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );
    sections.forEach(function (s) {
      spy.observe(s);
    });

    // ---- Scroll reveal ---------------------------------------------
    var reveal = new IntersectionObserver(
      function (entries, obs) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            e.target.classList.add("is-visible");
            settle(e.target);
            obs.unobserve(e.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -6% 0px" }
    );
    document.querySelectorAll(".reveal").forEach(function (el) {
      reveal.observe(el);
    });
  } else {
    document.querySelectorAll(".reveal").forEach(function (el) {
      el.classList.add("is-visible");
    });
  }

  // ---- Achievements filter -----------------------------------------
  var chips = document.querySelectorAll(".chip[data-filter]");
  var rows = document.querySelectorAll(".ach-list tbody tr");

  chips.forEach(function (chip) {
    chip.addEventListener("click", function () {
      var f = chip.dataset.filter;
      chips.forEach(function (c) {
        c.classList.toggle("is-active", c === chip);
      });
      rows.forEach(function (r) {
        r.classList.toggle("is-hidden", f !== "all" && r.dataset.cat !== f);
      });
    });
  });

  // ---- Watchlist: swap the thumbnail for the YouTube player --------
  document.querySelectorAll(".watch-thumb[data-yt]").forEach(function (box) {
    var btn = box.querySelector(".watch-play");
    if (!btn) return;
    btn.addEventListener("click", function () {
      var frame = document.createElement("iframe");
      frame.src =
        "https://www.youtube-nocookie.com/embed/" + box.dataset.yt + "?autoplay=1&rel=0";
      frame.title = btn.getAttribute("aria-label").replace(/^Play /, "");
      frame.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
      frame.allowFullscreen = true;
      box.appendChild(frame);
      btn.remove();
    });
  });

  // ---- English class: load the Google Drive player on click --------
  document.querySelectorAll(".eng-video[data-drive]").forEach(function (box) {
    var btn = box.querySelector(".eng-play");
    if (!btn) return;
    btn.addEventListener("click", function () {
      var frame = document.createElement("iframe");
      frame.src = "https://drive.google.com/file/d/" + box.dataset.drive + "/preview";
      frame.title = "Self-introduction video";
      frame.allow = "autoplay; fullscreen";
      frame.allowFullscreen = true;
      box.appendChild(frame);
      btn.remove();
    });
  });
})();
