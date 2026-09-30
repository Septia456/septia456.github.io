// Septia Nenengsih — Portofolio
document.documentElement.classList.add("js");

(function () {
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

  // ---- Highlight the current section in the navbar -----------------
  // Sections without their own nav item map to the nearest one.
  var alias = { motto: "education", parents: "education", home: null };
  var links = {};
  nav.querySelectorAll(".nav-links a").forEach(function (a) {
    links[a.dataset.section] = a;
  });

  function setActive(id) {
    var key = id in alias ? alias[id] : id;
    Object.keys(links).forEach(function (k) {
      links[k].classList.toggle("is-active", k === key);
    });
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
            obs.unobserve(e.target);
          }
        });
      },
      { threshold: 0.08 }
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
})();
