/* ============================================================
   Jatin Kumar Ray · interactions
   theme · incident replay · galleries · lightbox · scrollspy ·
   reveal · copy email. No dependencies.
   ============================================================ */
(function () {
  "use strict";
  var doc = document.documentElement;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hasIO = "IntersectionObserver" in window;
  var each = function (sel, fn, root) {
    Array.prototype.forEach.call((root || document).querySelectorAll(sel), fn);
  };

  /* ---------- theme ---------- */
  var themeBtn = document.getElementById("theme");
  var themeMeta = document.querySelector('meta[name="theme-color"]');
  var syncTheme = function () {
    var light = doc.getAttribute("data-theme") === "light";
    if (themeBtn) themeBtn.setAttribute("aria-label", light ? "Switch to dark theme" : "Switch to light theme");
    if (themeMeta) themeMeta.setAttribute("content", light ? "#f5f3ef" : "#0b0c0e");
  };
  if (themeBtn) {
    themeBtn.addEventListener("click", function () {
      var light = doc.getAttribute("data-theme") === "light";
      if (light) doc.removeAttribute("data-theme");
      else doc.setAttribute("data-theme", "light");
      try { localStorage.setItem("theme", light ? "dark" : "light"); } catch (e) {}
      syncTheme();
    });
  }
  syncTheme();

  /* ---------- incident replay ----------
     Each log row carries data-t (replay second it appears), data-p (chart
     progress 0–1 at that moment) and data-state (drives colours via CSS).
     Without JS the figure shows its final, fully readable state.          */
  var fig = document.getElementById("replay");
  if (fig) {
    var steps = Array.prototype.slice.call(fig.querySelectorAll(".rp-log li"));
    var btn = fig.querySelector(".rp-btn");
    var btnUse = btn.querySelector("use");
    var statusT = fig.querySelector(".rp-status-t");
    var LABEL = {
      firing: "Firing", investigating: "Investigating", approval: "Needs approval",
      mitigating: "Mitigating", resolved: "Resolved",
    };
    var END = 22; // seconds
    var keys = steps.map(function (li) { return { t: +li.dataset.t, p: +li.dataset.p }; });
    keys.push({ t: END, p: 1 });

    var t = 0, last = 0, raf = 0, shown = -2;
    var playing = false, ended = true, userPaused = false, autoplayed = false;

    var progressAt = function (time) {
      for (var i = keys.length - 1; i >= 0; i--) {
        if (time >= keys[i].t) {
          var a = keys[i], b = keys[i + 1];
          if (!b || reduce) return a.p; // reduced motion: jump, don't glide
          return a.p + (b.p - a.p) * ((time - a.t) / (b.t - a.t));
        }
      }
      return keys[0].p;
    };

    var render = function () {
      fig.style.setProperty("--p", progressAt(t).toFixed(4));
      var n = -1;
      for (var i = 0; i < steps.length; i++) if (t >= keys[i].t) n = i;
      if (n === shown) return;
      shown = n;
      steps.forEach(function (li, i) {
        li.classList.toggle("on", i <= n);
        li.classList.toggle("latest", i === n && !ended);
      });
      var state = n >= 0 ? steps[n].dataset.state : "firing";
      fig.setAttribute("data-state", state);
      statusT.textContent = LABEL[state];
    };

    var setBtn = function (kind) {
      var map = {
        pause: ["#i-pause", "Pause the replay"],
        play: ["#i-play", "Play the replay"],
        replay: ["#i-replay", "Replay the incident"],
      };
      btnUse.setAttribute("href", map[kind][0]);
      btn.setAttribute("aria-label", map[kind][1]);
    };

    var arm = function () {
      t = 0; shown = -2; ended = false;
      fig.classList.remove("static");
      fig.classList.add("armed", "is-live");
      render();
      setBtn("play");
    };

    var finish = function () {
      playing = false; ended = true;
      fig.classList.remove("is-live");
      steps.forEach(function (li) { li.classList.remove("latest"); });
      setBtn("replay");
    };

    var frame = function (now) {
      raf = 0;
      if (!playing) return;
      t += Math.min(0.1, (now - last) / 1000); // clamp long frames (tab switch)
      last = now;
      if (t >= END) { t = END; render(); finish(); return; }
      render();
      raf = requestAnimationFrame(frame);
    };

    var play = function () {
      if (playing) return;
      if (ended) arm();
      playing = true;
      last = performance.now();
      setBtn("pause");
      raf = requestAnimationFrame(frame);
    };

    var pause = function () {
      playing = false;
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
      if (!ended) setBtn("play");
    };

    btn.hidden = false;
    btn.addEventListener("click", function () {
      if (playing) { userPaused = true; pause(); }
      else { userPaused = false; play(); }
    });

    if (reduce || !hasIO) {
      fig.classList.add("static"); // final state; the button replays on demand
      setBtn("replay");
    } else {
      arm(); // first frame: only the alert is visible
      new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) {
          if (!autoplayed) { autoplayed = true; play(); }
          else if (!ended && !playing && !userPaused) play();
        } else if (playing) {
          pause(); // offscreen: stop the clock, resume when visible again
        }
      }, { threshold: 0.35 }).observe(fig);
    }
  }

  /* ---------- screenshot galleries ---------- */
  var lb = document.getElementById("lb");
  var lbImg = document.getElementById("lb-img");
  var lbCap = document.getElementById("lb-cap");
  var openLb = function (src, alt, caption) {
    if (!lb || typeof lb.showModal !== "function") {
      window.open(src, "_blank", "noopener");
      return;
    }
    lbImg.src = src;
    lbImg.alt = alt;
    lbCap.textContent = caption;
    lb.showModal();
  };
  if (lb) {
    lb.querySelector(".lb-x").addEventListener("click", function () { lb.close(); });
    lb.addEventListener("click", function (e) { if (e.target === lb) lb.close(); });
  }

  each(".gallery", function (g) {
    var frameBtn = g.querySelector(".g-frame");
    var img = frameBtn.querySelector("img");
    var cap = g.querySelector(".g-cap");
    var tabs = g.querySelectorAll(".g-tab");
    each(".g-tab", function (tab) {
      tab.addEventListener("click", function () {
        Array.prototype.forEach.call(tabs, function (x) {
          x.setAttribute("aria-pressed", String(x === tab));
        });
        img.src = tab.dataset.src;
        img.alt = tab.dataset.alt;
        cap.textContent = tab.dataset.cap;
        frameBtn.setAttribute("aria-label", "Enlarge screenshot: " + tab.dataset.cap);
      });
    }, g);
    frameBtn.addEventListener("click", function () {
      openLb(img.currentSrc || img.src, img.alt, cap.textContent);
    });
  });

  /* ---------- scrollspy for the top nav ---------- */
  var links = {};
  each(".nav a", function (a) { links[a.getAttribute("href").slice(1)] = a; });
  if (hasIO && Object.keys(links).length) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        Object.keys(links).forEach(function (id) {
          var on = id === en.target.id;
          links[id].classList.toggle("active", on);
          if (on) links[id].setAttribute("aria-current", "true");
          else links[id].removeAttribute("aria-current");
        });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    each("main section[id]", function (s) { spy.observe(s); });
  }

  /* ---------- reveal on scroll ---------- */
  if (!reduce && hasIO) {
    doc.classList.add("rv");
    var rio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add("in");
        rio.unobserve(en.target);
      });
    }, { threshold: 0, rootMargin: "0px 0px -10% 0px" });
    each("[data-reveal]", function (el) { rio.observe(el); });
  }

  /* ---------- copy email ---------- */
  each("[data-copy]", function (b) {
    var msg = b.parentElement.querySelector(".copy-msg");
    var use = b.querySelector("use");
    b.addEventListener("click", function () {
      var done = function (ok) {
        if (msg) msg.textContent = ok ? "Copied" : "Copy failed";
        use.setAttribute("href", ok ? "#i-check" : "#i-copy");
        clearTimeout(b._t);
        b._t = setTimeout(function () {
          if (msg) msg.textContent = "";
          use.setAttribute("href", "#i-copy");
        }, 2000);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(b.dataset.copy).then(
          function () { done(true); },
          function () { done(false); }
        );
      } else {
        done(false);
      }
    });
  });
})();
