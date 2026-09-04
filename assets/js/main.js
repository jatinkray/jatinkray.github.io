/* ============================================================
   JATIN KUMAR RAY — "The Reliability Report" interactions
   typing · theme · reveal · counters · meters · dial ·
   scrollspy · tabs · lightbox
   ============================================================ */
(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- theme ---------- */
  var btn = document.getElementById("theme-toggle");
  if (btn) {
    btn.addEventListener("click", function () {
      var isLight =
        document.documentElement.getAttribute("data-theme") === "light";
      if (isLight) {
        document.documentElement.removeAttribute("data-theme");
        try { localStorage.setItem("theme", "dark"); } catch (e) {}
      } else {
        document.documentElement.setAttribute("data-theme", "light");
        try { localStorage.setItem("theme", "light"); } catch (e) {}
      }
    });
  }

  /* ---------- typing effect ---------- */
  var typedEl = document.getElementById("typed");
  if (typedEl) {
    var phrases = [
      "whoami --role staff-sre",
      "kubectl get platforms -o wide",
      "uptime --since 2011 --calls 1B",
      "optimus prime --cost -2M",
    ];
    if (reduce) {
      typedEl.textContent = phrases[0];
    } else {
      var pi = 0, ci = 0, deleting = false;
      var tick = function () {
        var phrase = phrases[pi];
        if (!deleting) {
          ci++;
          if (ci === phrase.length) {
            deleting = true;
            setTimeout(tick, 1900);
            return;
          }
        } else {
          ci--;
          if (ci === 0) {
            deleting = false;
            pi = (pi + 1) % phrases.length;
          }
        }
        typedEl.textContent = phrase.slice(0, ci);
        setTimeout(tick, deleting ? 22 : 55);
      };
      tick();
    }
  }

  /* ---------- count-up ---------- */
  function fmt(val, decimals) {
    var n = decimals > 0 ? val.toFixed(decimals) : Math.round(val).toString();
    var parts = n.split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
  }
  function runCount(el) {
    if (el.dataset.done) return;
    el.dataset.done = "1";
    var raw = el.dataset.raw;
    if (raw && raw !== "undefined" && raw !== "") {
      el.textContent = raw;
      return;
    }
    var to = parseFloat(el.dataset.to);
    if (isNaN(to)) return;
    var decimals = parseInt(el.dataset.decimals || "0", 10);
    var prefix = el.dataset.prefix && el.dataset.prefix !== "undefined" ? el.dataset.prefix : "";
    var suffix = el.dataset.suffix && el.dataset.suffix !== "undefined" ? el.dataset.suffix : "";
    if (reduce) {
      el.textContent = prefix + fmt(to, decimals) + suffix;
      return;
    }
    var dur = 1400;
    var start = performance.now();
    var step = function (now) {
      var t = Math.min(1, (now - start) / dur);
      var e = 1 - Math.pow(1 - t, 3);
      el.textContent = prefix + fmt(to * e, decimals) + suffix;
      if (t < 1) requestAnimationFrame(step);
      else el.textContent = prefix + fmt(to, decimals) + suffix;
    };
    requestAnimationFrame(step);
  }

  /* ---------- meters + dial ---------- */
  function fillMeter(el) {
    if (el.dataset.done) return;
    el.dataset.done = "1";
    el.style.width = (el.dataset.fill || 0) + "%";
  }
  function fillDial(el) {
    if (!el || el.dataset.done) return;
    el.dataset.done = "1";
    var pct = 0.995;
    var full = parseFloat(el.getAttribute("stroke-dasharray"));
    el.style.strokeDashoffset = String(full * (1 - pct));
  }

  /* ---------- reveal on scroll ---------- */
  var rvHandler = function (entries, io) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      var el = en.target;
      el.classList.add("in");
      el.querySelectorAll(".count").forEach(function (c) {
        setTimeout(function () { runCount(c); }, 120);
      });
      el.querySelectorAll(".m-fill").forEach(function (m) {
        setTimeout(function () { fillMeter(m); }, 150);
      });
      var d = el.querySelector(".dial-arc");
      if (d) fillDial(d);
      io.unobserve(el);
    });
  };

  if (reduce) {
    document.querySelectorAll("[data-rv]").forEach(function (el) {
      el.classList.add("in");
    });
    document.querySelectorAll(".count").forEach(runCount);
    document.querySelectorAll(".m-fill").forEach(fillMeter);
    fillDial(document.querySelector(".dial-arc"));
  } else {
    var io = new IntersectionObserver(rvHandler, {
      threshold: 0.15,
      rootMargin: "0px 0px -6% 0px",
    });
    document.querySelectorAll("[data-rv]").forEach(function (el) {
      io.observe(el);
    });
  }

  /* ---------- scrollspy (side nav) ---------- */
  var navLinks = document.querySelectorAll(".side-nav a");
  if (navLinks.length && "IntersectionObserver" in window) {
    var sections = document.querySelectorAll(
      "#report, #signals, #capabilities, #products, #mission, #stack, #contact"
    );
    var spy = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) {
            navLinks.forEach(function (a) {
              a.classList.toggle(
                "active",
                a.getAttribute("data-sec") === en.target.id
              );
            });
          }
        });
      },
      { rootMargin: "-30% 0px -60% 0px" }
    );
    sections.forEach(function (s) { spy.observe(s); });
  }

  /* ---------- case tabs + auto-rotating carousel ---------- */
  var ROTATE_MS = 5000;
  document.querySelectorAll(".case-tabs").forEach(function (tabs) {
    var caseEl = tabs.closest(".case");
    var frame = caseEl ? caseEl.querySelector(".case-frame") : null;
    var img = frame ? frame.querySelector("img") : null;
    var tabEls = tabs.querySelectorAll(".case-tab");
    var timer = null;
    var idx = 0;

    var show = function (i) {
      var tab = tabEls[i];
      if (!tab) return;
      tabs.querySelectorAll(".case-tab").forEach(function (t) {
        t.classList.remove("active");
      });
      // restart the progress bar animation
      tab.classList.add("active");
      if (frame && img) {
        img.src = tab.dataset.shot;
        img.alt = tab.dataset.cap;
        frame.dataset.zoom = tab.dataset.shot;
        frame.dataset.cap = tab.dataset.cap;
      }
    };

    var next = function () {
      idx = (idx + 1) % tabEls.length;
      show(idx);
    };

    var start = function () {
      if (reduce || tabEls.length < 2) return;
      stop();
      tabs.classList.remove("paused");
      timer = setInterval(next, ROTATE_MS);
    };
    var stop = function () {
      if (timer) { clearInterval(timer); timer = null; }
      tabs.classList.add("paused");
    };

    tabEls.forEach(function (tab, i) {
      tab.addEventListener("click", function () {
        idx = i;
        show(idx);
        // manual choice: pause rotation for a while, then resume
        stop();
        clearTimeout(tab._resume);
        tab._resume = setTimeout(start, 12000);
      });
    });

    // pause on hover anywhere over the gallery
    var body = caseEl ? caseEl.querySelector(".case-body") : tabs.parentElement;
    if (body) {
      body.addEventListener("mouseenter", stop);
      body.addEventListener("mouseleave", start);
    }

    // only rotate while the gallery is actually on screen
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) start(); else stop();
        });
      }, { threshold: 0.25 });
      io.observe(frame || tabs);
    } else {
      start();
    }
  });

  /* ---------- lightbox ---------- */
  var lb = document.getElementById("lightbox");
  var lbImg = document.getElementById("lb-img");
  var lbCap = document.getElementById("lb-cap");
  var lbX = lb ? lb.querySelector(".lb-x") : null;

  function openLb(src, cap) {
    if (!lb || !src) return;
    lbImg.hidden = false;
    lbImg.src = src;
    lbImg.alt = cap || "";
    lbCap.textContent = cap || "";
    lb.classList.add("open");
    lb.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    if (lbX) lbX.focus();
  }
  function closeLb() {
    if (!lb) return;
    lb.classList.remove("open");
    lb.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    lbImg.hidden = true;
  }

  document.querySelectorAll(".case-frame").forEach(function (frame) {
    var open = function () { openLb(frame.dataset.zoom, frame.dataset.cap); };
    frame.addEventListener("click", open);
    frame.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        open();
      }
    });
  });
  if (lb) {
    lb.addEventListener("click", closeLb);
    lbX.addEventListener("click", function (e) {
      e.stopPropagation();
      closeLb();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeLb();
    });
  }

  /* ---------- dynamic background: telemetry mesh ----------
     A drifting constellation of service-nodes linked by faint edges,
     with data pulses travelling between them — reads as an
     AI/neural lattice and an SRE distributed-trace map at once.
     Skipped entirely under prefers-reduced-motion.               */
  var meshCanvas = document.getElementById("bgMesh");
  if (meshCanvas && !reduce) {
    var mctx = meshCanvas.getContext("2d");
    var nodes = [], pulses = [];
    var DPR = Math.min(window.devicePixelRatio || 1, 2);

    var resize = function () {
      meshCanvas.width = window.innerWidth * DPR;
      meshCanvas.height = window.innerHeight * DPR;
      buildNodes();
    };

    var buildNodes = function () {
      // density scales with viewport area, capped for perf
      var count = Math.min(Math.round((window.innerWidth * window.innerHeight) / 24000), 96);
      nodes = [];
      for (var i = 0; i < count; i++) {
        nodes.push({
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
          vx: (Math.random() - 0.5) * 0.16,
          vy: (Math.random() - 0.5) * 0.16,
          r: Math.random() * 1.6 + 0.7,
          tw: Math.random() * Math.PI * 2, // twinkle phase
        });
      }
      pulses = [];
    };

    var isLight = function () {
      return document.documentElement.getAttribute("data-theme") === "light";
    };

    var spawnPulse = function (a, b) {
      pulses.push({ a: a, b: b, t: 0, speed: 0.006 + Math.random() * 0.007 });
    };

    var LINK_DIST = 160;
    var lastSpawn = 0;

    var drawMesh = function (ts) {
      var W = window.innerWidth, H = window.innerHeight;
      mctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      mctx.clearRect(0, 0, W, H);
      var light = isLight();

      // palette (rgba strings resolved once per frame)
      var nodeCol = light ? "10,110,80" : "52,199,123";    // ops emerald
      var linkCol  = light ? "10,110,80" : "52,199,123";
      var pulseCol = light ? "8,125,85" : "110,231,183";   // bright emerald
      var goldCol  = "234,179,8";                           // rare gold pulse

      // move nodes
      for (var i = 0; i < nodes.length; i++) {
        var n = nodes[i];
        n.x += n.vx; n.y += n.vy; n.tw += 0.012;
        if (n.x < -20) n.x = W + 20;
        if (n.x > W + 20) n.x = -20;
        if (n.y < -20) n.y = H + 20;
        if (n.y > H + 20) n.y = -20;
      }

      // edges
      for (var a = 0; a < nodes.length; a++) {
        for (var b = a + 1; b < nodes.length; b++) {
          var dx = nodes[a].x - nodes[b].x;
          var dy = nodes[a].y - nodes[b].y;
          if (dx > LINK_DIST || dx < -LINK_DIST || dy > LINK_DIST || dy < -LINK_DIST) continue;
          var d = Math.sqrt(dx * dx + dy * dy);
          if (d < LINK_DIST) {
            var alpha = (1 - d / LINK_DIST) * (light ? 0.16 : 0.15);
            mctx.strokeStyle = "rgba(" + linkCol + "," + alpha.toFixed(3) + ")";
            mctx.lineWidth = 1;
            mctx.beginPath();
            mctx.moveTo(nodes[a].x, nodes[a].y);
            mctx.lineTo(nodes[b].x, nodes[b].y);
            mctx.stroke();
          }
        }
      }

      // nodes (soft twinkle)
      for (var k = 0; k < nodes.length; k++) {
        var m = nodes[k];
        var tw = 0.55 + 0.45 * Math.sin(m.tw);
        mctx.fillStyle = "rgba(" + nodeCol + "," + ((light ? 0.55 : 0.65) * tw).toFixed(3) + ")";
        mctx.beginPath();
        mctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
        mctx.fill();
      }

      // pulses: spawn on a random close pair every ~450ms
      if (ts - lastSpawn > 450 && nodes.length > 1) {
        lastSpawn = ts;
        var sa = nodes[Math.floor(Math.random() * nodes.length)];
        var best = null, bestD = Infinity;
        for (var j = 0; j < nodes.length; j++) {
          var o = nodes[j];
          if (o === sa) continue;
          var ddx = sa.x - o.x, ddy = sa.y - o.y;
          var dd = ddx * ddx + ddy * ddy;
          if (dd < bestD) { bestD = dd; best = o; }
        }
        if (best && Math.sqrt(bestD) < LINK_DIST * 1.6) {
          spawnPulse(sa, best);
          if (Math.random() < 0.16) spawnPulse(best, sa); // occasional round-trip
        }
      }

      // draw pulses
      for (var p = pulses.length - 1; p >= 0; p--) {
        var pl = pulses[p];
        pl.t += pl.speed;
        if (pl.t >= 1) { pulses.splice(p, 1); continue; }
        // nodes keep drifting — re-interpolate live positions
        var x = pl.a.x + (pl.b.x - pl.a.x) * pl.t;
        var y = pl.a.y + (pl.b.y - pl.a.y) * pl.t;
        var fade = Math.sin(pl.t * Math.PI); // ease in/out
        // short trailing line
        var tTail = Math.max(0, pl.t - 0.12);
        var tx = pl.a.x + (pl.b.x - pl.a.x) * tTail;
        var ty = pl.a.y + (pl.b.y - pl.a.y) * tTail;
        mctx.strokeStyle = "rgba(" + pulseCol + "," + (0.5 * fade).toFixed(3) + ")";
        mctx.lineWidth = 1.4;
        mctx.beginPath();
        mctx.moveTo(tx, ty);
        mctx.lineTo(x, y);
        mctx.stroke();
        // bright head
        mctx.fillStyle = "rgba(" + pulseCol + "," + (0.9 * fade).toFixed(3) + ")";
        mctx.beginPath();
        mctx.arc(x, y, 1.8, 0, Math.PI * 2);
        mctx.fill();
      }

      requestAnimationFrame(drawMesh);
    };

    resize();
    window.addEventListener("resize", resize);
    requestAnimationFrame(drawMesh);
  }
})();
