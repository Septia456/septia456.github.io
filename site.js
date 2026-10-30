/* Fills the page from the JSON files in /data (edited through /admin).
   The static markup in index.html stays as the fallback when JS or fetch fails.
   app.js waits for window.siteReady before it wires up animations. */
(function () {
  var SVG = "http://www.w3.org/2000/svg";

  // ---- tiny DOM helpers (no innerHTML: content comes from editable data) ----
  function h(tag, cls, kids, attrs) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        if (attrs[k] != null && attrs[k] !== "") n.setAttribute(k, attrs[k]);
      });
    }
    add(n, kids);
    return n;
  }

  function add(parent, kids) {
    if (kids == null || kids === false) return;
    if (Array.isArray(kids)) return kids.forEach(function (k) { add(parent, k); });
    parent.appendChild(typeof kids === "object" ? kids : document.createTextNode(String(kids)));
  }

  // text with **bold** and line breaks
  function rich(parent, text) {
    String(text || "").split("\n").forEach(function (line, i) {
      if (i) parent.appendChild(document.createElement("br"));
      line.split(/\*\*(.+?)\*\*/g).forEach(function (part, j) {
        if (!part) return;
        parent.appendChild(j % 2 ? h("strong", null, part) : document.createTextNode(part));
      });
    });
    return parent;
  }

  function richEl(tag, cls, text) {
    return rich(h(tag, cls), text);
  }

  function icon(id) {
    var svg = document.createElementNS(SVG, "svg");
    var use = document.createElementNS(SVG, "use");
    use.setAttribute("href", "#" + id);
    svg.appendChild(use);
    return svg;
  }

  function safeUrl(u) {
    return /^(https?:\/\/|\/|asset\/|mailto:|#)/i.test(u || "") ? u : "";
  }

  function img(o, lazy) {
    o = o || {};
    return h("img", null, null, {
      src: safeUrl(o.src),
      alt: o.alt || "",
      style: "object-position: " + (o.pos || "50% 50%"),
      loading: lazy ? "lazy" : ""
    });
  }

  function clear(n) {
    while (n.firstChild) n.removeChild(n.firstChild);
    return n;
  }

  function $(sel, root) {
    return (root || document).querySelector(sel);
  }

  function setText(sel, text, root) {
    var n = $(sel, root);
    if (n && text != null && text !== "") n.textContent = text;
    return n;
  }

  function link(label, href, iconId, extra) {
    var ext = /^https?:/i.test(href);
    var a = h("a", extra || "pill", null, {
      href: safeUrl(href),
      target: ext ? "_blank" : "",
      rel: ext ? "noopener" : ""
    });
    if (iconId) a.appendChild(icon(iconId));
    add(a, label);
    return a;
  }

  function tags(list) {
    return (list || []).map(function (t) { return h("span", "tag", t); });
  }

  function ytId(u) {
    var m = String(u || "").match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{11})/);
    return m ? m[1] : /^[\w-]{11}$/.test(u || "") ? u : "";
  }

  function driveId(u) {
    var m = String(u || "").match(/\/d\/([\w-]+)/) || String(u || "").match(/[?&]id=([\w-]+)/);
    return m ? m[1] : "";
  }

  // ---- renderers -------------------------------------------------------------
  var render = {};

  render.home = function (d) {
    var w = d.welcome || {};
    var sec = $("#welcome");
    if (w.image) {
      ["welcome-bg", "welcome-photo"].forEach(function (c) {
        var i = $("." + c, sec);
        if (i) i.src = safeUrl(w.image);
      });
    }
    if (w.image_alt) $(".welcome-photo", sec).alt = w.image_alt;
    setText(".welcome-kicker", w.kicker, sec);

    var title = $(".welcome-title", sec);
    if (title && w.title) {
      clear(title);
      title.appendChild(document.createTextNode(w.title));
      title.appendChild(h("span", "sr-only", " to the portofolio of " + (w.name || "")));
    }
    var sub = $(".welcome-sub", sec);
    if (sub && w.name) {
      clear(sub);
      add(sub, [(w.sub || "to the portofolio of") + " ", h("strong", null, w.name)]);
    }
    var words = (w.words || []).filter(Boolean);
    var typer = $(".typer", sec);
    if (typer && words.length) {
      typer.setAttribute("data-words", words.join("|"));
      typer.textContent = words[0];
      var sr = $(".welcome-type .sr-only", sec);
      if (sr) sr.textContent = "I'm " + words.join(", ") + ".";
    }

    var hero = d.hero || {};
    var strip = $("#home .hero-strip");
    if (strip && (hero.images || []).length) {
      clear(strip);
      hero.images.forEach(function (i) { strip.appendChild(h("figure", null, img(i))); });
    }
    setText("#home .hero-title", hero.title);
    setText("#home .hero-meta h2", hero.name);
    setText("#home .hero-meta p", hero.tagline);
    var btn = $("#home .pill-lg");
    if (btn) {
      if (hero.button) btn.textContent = hero.button;
      if (hero.button_link) btn.setAttribute("href", safeUrl(hero.button_link));
    }
  };

  render.about = function (d) {
    var sec = clear($("#about"));
    sec.appendChild(h("div", "about-photo", img(d.photo)));
    var copy = h("div", "about-copy");
    copy.appendChild(h("h2", "display", d.title || "About Me"));
    (d.paragraphs || []).forEach(function (p) { copy.appendChild(h("p", null, p)); });
    copy.appendChild(h("ol", "facts", (d.facts || []).map(function (f) { return h("li", null, f); })));
    copy.appendChild(
      h("div", "social-row", (d.social || []).map(function (s) {
        var a = link(null, s.url, null, "");
        a.removeAttribute("class");
        a.setAttribute("aria-label", s.icon);
        a.appendChild(icon("i-" + s.icon));
        return a;
      }))
    );
    sec.appendChild(copy);
  };

  render.education = function (d) {
    var sec = clear($("#education"));
    function timeline(list) {
      return h("ul", "timeline", (list || []).map(function (r) {
        return h("li", null, [h("strong", null, r.period), richEl("span", null, r.text)]);
      }));
    }
    sec.appendChild(h("div", "duo-cell duo-photo", img(d.photo_left)));
    sec.appendChild(h("div", "duo-cell duo-text", [h("h2", "display", d.education_title || "Education"), timeline(d.education)]));
    sec.appendChild(h("div", "duo-cell duo-text duo-text-alt", [h("h2", "display", d.training_title || "Training"), timeline(d.training)]));
    sec.appendChild(h("div", "duo-cell duo-photo", img(d.photo_right)));
  };

  render.motto = function (d) {
    var m = d.motto || {};
    var sec = clear($("#motto"));
    sec.appendChild(h("figure", "motto-frame", img(m.photo)));
    var copy = h("div", "motto-copy");
    copy.appendChild(h("h2", "display", m.title || "My Motto"));
    copy.appendChild(h("blockquote", null, ["“" + (m.quote || "") + "”", m.translation ? h("small", null, m.translation) : null]));
    (m.paragraphs || []).forEach(function (p) { copy.appendChild(h("p", null, p)); });
    if (m.signature) copy.appendChild(h("p", "signature", m.signature));
    if (m.cv && safeUrl(m.cv.url)) {
      var cv = link(m.cv.label || "See my CV", m.cv.url, "i-doc", "pill pill-lg motto-cv");
      cv.setAttribute("target", "_blank");
      cv.setAttribute("rel", "noopener");
      copy.appendChild(h("div", "motto-actions", cv));
    }
    sec.appendChild(copy);

    var p = d.parents || {};
    var psec = clear($("#parents"));
    var pc = h("div", "parents-copy");
    pc.appendChild(h("h2", "display", p.title || "My Parents"));
    var letter = h("div", "letter", null, { lang: "id" });
    (p.letter || []).forEach(function (t) { letter.appendChild(richEl("p", null, t)); });
    if (p.ending) letter.appendChild(richEl("p", "letter-end", p.ending));
    pc.appendChild(letter);
    psec.appendChild(pc);
    psec.appendChild(
      h("div", "parents-photos", (p.people || []).map(function (x) {
        return h("figure", "parent", [
          h("div", "parent-frame", img(x.photo, true)),
          h("figcaption", "parent-cap", [h("strong", null, x.role), h("span", null, x.name)])
        ]);
      }))
    );
  };

  render.achievements = function (d) {
    var sec = $("#achievements");
    setText(".ach-head h2", d.title, sec);
    setText(".ach-head > p", d.intro, sec);
    var headTags = $(".ach-head .tag-row", sec);
    if (headTags && (d.tags || []).length) clear(headTags), add(headTags, tags(d.tags));

    var cards = $(".ach-cards", sec);
    if (cards && (d.cards || []).length) {
      clear(cards);
      d.cards.forEach(function (c) {
        cards.appendChild(
          h("article", "ach-card", [
            h("figure", null, img(c.photo)),
            h("h3", null, c.title),
            h("p", null, c.subtitle),
            h("div", "tag-row", tags(c.tags))
          ])
        );
      });
    }

    var body = $(".ach-list tbody", sec);
    if (body && (d.rows || []).length) {
      clear(body);
      d.rows.forEach(function (r) {
        body.appendChild(
          h("tr", null, [r.year, r.achievement, r.result, r.organizer, r.level].map(function (v) { return h("td", null, v); }), {
            "data-cat": r.category || "academic"
          })
        );
      });
    }

    var pubs = $(".pubs ul", sec);
    if (pubs && (d.publications || []).length) {
      clear(pubs);
      d.publications.forEach(function (p) {
        pubs.appendChild(h("li", null, [h("strong", null, p.kind), h("span", null, p.text)]));
      });
    }
  };

  render.organization = function (d) {
    var sec = clear($("#organization"));
    var copy = h("div", "process-copy");
    copy.appendChild(h("h2", "display", d.title || "Organization"));
    copy.appendChild(
      h("ol", "steps", (d.steps || []).map(function (s) {
        return h("li", null, [h("span", "step-label", s.label), h("strong", null, s.role), h("span", null, s.place)]);
      }))
    );
    copy.appendChild(
      h("div", "committee", [h("span", "committee-title", d.committee_title), h("div", "tag-row", tags(d.committees))])
    );
    sec.appendChild(copy);
    sec.appendChild(h("figure", "process-photo", img(d.photo)));
  };

  render.english = function (d) {
    var sec = $("#english");
    var head = $(".eng-head", sec);
    setText(".eng-kicker", d.kicker, head);
    var h2 = $("h2", head);
    if (h2 && d.title) clear(h2), rich(h2, d.title);
    setText(".eng-head > p", d.intro, sec);

    var list = clear($(".eng-list", sec));
    (d.items || []).filter(function (i) { return i && i.title; }).forEach(function (item, index) {
      var li = h("li", "eng-item");
      li.appendChild(
        h("div", "eng-meta", [
          h("span", "eng-no", (index < 9 ? "0" : "") + (index + 1)),
          item.type ? h("span", "tag", item.type) : null,
          item.label ? h("span", "eng-when", item.label) : null
        ])
      );

      var body = h("div", "eng-body");
      var text = h("div", "eng-text", [h("h3", null, item.title), item.description ? h("p", null, item.description) : null]);
      if ((item.points || []).length) {
        text.appendChild(h("ol", "eng-points", item.points.map(function (p) { return h("li", null, p); })));
      }
      var row = h("div", "pill-row");
      var vid = driveId(item.video_url);
      if (vid) row.appendChild(link("Open in Google Drive", "https://drive.google.com/file/d/" + vid + "/view", "i-external"));
      if (safeUrl(item.pdf)) {
        row.appendChild(link("Read the PDF", item.pdf, "i-external"));
        var dl = link("Download", item.pdf, "i-download");
        dl.removeAttribute("target");
        dl.setAttribute("download", "");
        row.appendChild(dl);
      }
      (item.links || []).forEach(function (l) {
        if (safeUrl(l.url) && l.label) row.appendChild(link(l.label, l.url, "i-external"));
      });
      if (row.children.length) text.appendChild(row);
      body.appendChild(text);

      if (vid) {
        var box = h("div", "eng-video", null, { "data-drive": vid, "data-title": item.title });
        var card = h("span", "eng-play-card", [item.video_cover_title || "Play", item.video_cover_subtitle ? h("small", null, item.video_cover_subtitle) : null]);
        var btn = h("button", "eng-play", [card, h("span", "eng-play-btn", icon("i-play"))], {
          type: "button",
          "aria-label": "Play the video: " + item.title
        });
        box.appendChild(btn);
        body.appendChild(box);
      } else if (item.excerpt && (item.excerpt.body || []).length) {
        var ex = item.excerpt;
        var letter = h("div", "letter", null, { lang: "en" });
        if (ex.subject) letter.appendChild(h("p", "eng-letter-subject", ex.subject));
        if (ex.greeting) letter.appendChild(richEl("p", null, ex.greeting));
        ex.body.forEach(function (p) { letter.appendChild(richEl("p", null, p)); });
        if (ex.signoff) letter.appendChild(richEl("p", "eng-letter-sign", ex.signoff));
        body.appendChild(h("figure", "eng-letter", [h("span", "eng-letter-label", ex.label || "Excerpt"), letter]));
      } else if ((item.journals || []).length) {
        var jl = h("ol", "eng-journals");
        item.journals.forEach(function (j) {
          if (!j || !j.title) return;
          var jlinks = h("div", "eng-journal-links");
          if (safeUrl(j.url)) jlinks.appendChild(link("Article", j.url, "i-external", "eng-jlink"));
          if (safeUrl(j.pdf)) jlinks.appendChild(link("PDF", j.pdf, "i-download", "eng-jlink"));
          if (j.doi) jlinks.appendChild(link("DOI", "https://doi.org/" + String(j.doi).replace(/^https?:\/\/(dx\.)?doi\.org\//i, ""), null, "eng-jlink"));
          jl.appendChild(h("li", null, [h("strong", null, j.title), j.source ? h("span", null, j.source) : null, jlinks.children.length ? jlinks : null]));
        });
        body.appendChild(h("figure", "eng-reading", [h("span", "eng-letter-label", item.journals_label || "Reading list"), jl]));
      } else if (item.preview && safeUrl(item.preview.src)) {
        var pv = item.preview;
        var frame = h("a", "eng-doc", [img({ src: pv.src, alt: pv.alt || item.title, pos: "50% 0%" }, true), pv.label ? h("span", "eng-doc-label", pv.label) : null], {
          href: safeUrl(item.pdf) || safeUrl(pv.src),
          target: "_blank",
          rel: "noopener",
          "aria-label": "Open " + item.title
        });
        body.appendChild(frame);
      }
      li.appendChild(body);
      list.appendChild(li);
    });
  };

  render.social = function (d) {
    var sec = $("#social");
    var a = $(".phone-a img", sec), b = $(".phone-b img", sec), l = $(".laptop-screen img", sec);
    [[a, d.phone_a], [b, d.phone_b], [l, d.laptop]].forEach(function (p) {
      if (p[0] && p[1] && p[1].src) {
        p[0].src = safeUrl(p[1].src);
        p[0].style.objectPosition = p[1].pos || "50% 50%";
      }
    });
    setText("h2", d.title, sec);
    setText(".social-copy > p", d.text, sec);
    var row = $(".pill-row", sec);
    if (row && (d.links || []).length) {
      clear(row);
      d.links.forEach(function (x) { row.appendChild(link(x.label, x.url, "i-" + x.icon)); });
    }
  };

  render.gallery = function (d) {
    var sec = $("#gallery");
    setText("h2", d.title, sec);
    var arches = $(".arches", sec);
    if (arches && (d.items || []).length) {
      clear(arches);
      d.items.forEach(function (i) {
        arches.appendChild(h("figure", null, [h("div", "arch", img(i, true)), h("figcaption", "pill", i.caption)]));
      });
    }
  };

  render.watchlist = function (d) {
    var sec = $("#watchlist");
    setText(".watch-head h2", d.title, sec);
    setText(".watch-head p", d.text, sec);
    var grid = $(".watch-grid", sec);
    if (!grid) return;
    clear(grid);
    (d.items || []).forEach(function (v) {
      var id = ytId(v.url);
      if (!id) return;
      var btn = h("button", "watch-play", [
        h("img", null, null, { src: "https://i.ytimg.com/vi/" + id + "/hqdefault.jpg", alt: "", loading: "lazy" }),
        h("span", "watch-btn", icon("i-play"))
      ], { type: "button", "aria-label": "Play " + v.title });
      grid.appendChild(
        h("article", "watch-card", [
          h("div", "watch-thumb", btn, { "data-yt": id }),
          h("span", "watch-tag", v.tag),
          h("h3", null, v.title),
          link(v.channel, "https://youtu.be/" + id, null, "watch-channel")
        ])
      );
    });
  };

  render.contact = function (d) {
    var sec = $("#contact");
    var banner = $(".contact-banner", sec);
    if (banner && d.banner && d.banner.src) clear(banner).appendChild(img(d.banner, true));
    setText("h2", d.title, sec);
    var list = $(".contact-list", sec);
    if (list && (d.items || []).length) {
      clear(list);
      d.items.forEach(function (it) {
        var parts = [];
        (it.entries || []).forEach(function (e, i) {
          if (i) parts.push(" · ");
          parts.push(e.url ? link(e.text, e.url, null, "") : h("span", null, e.text));
        });
        parts.forEach(function (p) { if (p.removeAttribute) p.removeAttribute("class"); });
        list.appendChild(h("li", null, [icon("i-" + it.icon), h("div", null, [h("span", "label", it.label), parts])]));
      });
    }
  };

  // ---- load everything -------------------------------------------------------
  var names = ["home", "about", "education", "motto", "achievements", "organization", "english", "social", "gallery", "watchlist", "contact"];

  window.siteReady = !window.fetch
    ? Promise.resolve()
    : Promise.all(
        names.map(function (n) {
          return fetch("data/" + n + ".json?v=" + Date.now(), { cache: "no-cache" })
            .then(function (r) {
              if (!r.ok) throw new Error(n + " " + r.status);
              return r.json();
            })
            .then(function (d) {
              try {
                render[n](d);
              } catch (e) {
                if (window.console) console.warn("site.js: could not render " + n, e);
              }
            })
            .catch(function () { /* keep the static fallback for this section */ });
        })
      );
})();
