(function () {
  var box = document.getElementById("nav-check");
  if (box) {
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && box.checked) {
        box.checked = false;
        box.focus();
      }
    });
  }

  var params = new URLSearchParams(location.search);
  var thanks = document.getElementById("thanks");
  if (thanks && params.get("sent") === "1") thanks.hidden = false;

  var topic = document.getElementById("topic");
  var subject = document.getElementById("form-subject");
  if (topic) {

  var aliases = {
    "publishing": "Publishing",
    "speaking": "Speaking/Events",
    "media": "Media",
    "other": "Other"
  };

  function applyTopic(value) {
    if (!value) return;
    var wanted = aliases[value.toLowerCase()] || value;
    for (var i = 0; i < topic.options.length; i++) {
      if (topic.options[i].value === wanted) {
        topic.selectedIndex = i;
        return;
      }
    }
  }

  function syncSubject() {
    if (!subject) return;
    subject.value = topic.value
      ? "Benson Press website: " + topic.value
      : "Benson Press website contact";
  }

  applyTopic(params.get("topic"));
  topic.addEventListener("change", syncSubject);
  syncSubject();
  }

  var dialog = document.getElementById("lightbox");
  if (!dialog || typeof dialog.showModal !== "function") return;
  var items = Array.prototype.slice.call(document.querySelectorAll("[data-gallery-item]"));
  if (!items.length) return;
  var img = dialog.querySelector("img");
  var cap = dialog.querySelector("figcaption");
  var count = dialog.querySelector(".lightbox-count");
  var index = 0;
  var lastTrigger = null;

  function show(i) {
    index = (i + items.length) % items.length;
    var item = items[index];
    img.src = item.getAttribute("data-full");
    img.alt = item.getAttribute("data-alt") || "";
    cap.textContent = item.getAttribute("data-caption") || "";
    count.textContent = (index + 1) + " of " + items.length;
  }

  items.forEach(function (item, i) {
    item.addEventListener("click", function () {
      lastTrigger = item;
      show(i);
      dialog.showModal();
      var close = dialog.querySelector(".lightbox-close");
      if (close) close.focus();
    });
  });

  dialog.querySelector(".lightbox-close").addEventListener("click", function () {
    dialog.close();
  });
  dialog.querySelector("[data-prev]").addEventListener("click", function () { show(index - 1); });
  dialog.querySelector("[data-next]").addEventListener("click", function () { show(index + 1); });
  dialog.addEventListener("keydown", function (e) {
    if (e.key === "ArrowRight") { e.preventDefault(); show(index + 1); }
    if (e.key === "ArrowLeft") { e.preventDefault(); show(index - 1); }
  });
  dialog.addEventListener("click", function (e) {
    if (e.target === dialog) dialog.close();
  });
  dialog.addEventListener("close", function () {
    if (lastTrigger) lastTrigger.focus();
  });
})();

(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var header = document.querySelector("header.site");
  var headerTicking = false;

  function updateHeader() {
    if (header) header.classList.toggle("is-condensed", window.scrollY > 18);
    headerTicking = false;
  }
  window.addEventListener("scroll", function () {
    if (headerTicking) return;
    headerTicking = true;
    window.requestAnimationFrame(updateHeader);
  }, { passive: true });
  updateHeader();

  var stages = document.querySelectorAll(".hero, .alt, section, .book, .shop-card.book-card");
  if ("IntersectionObserver" in window) {
    var pauseObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        entry.target.classList.toggle("liquid-paused", !entry.isIntersecting);
        if (entry.target.classList.contains("hero")) {
          entry.target.classList.toggle("liquid-on", entry.isIntersecting);
        }
      });
    }, { threshold: 0.05 });
    stages.forEach(function (el) { pauseObserver.observe(el); });
  }

  if (!reduce && "IntersectionObserver" in window) {
    var revealNodes = document.querySelectorAll("main > section, .panel, .book, .shop-card, .featured-invite");
    revealNodes.forEach(function (el) { el.classList.add("reveal"); });
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: 0, rootMargin: "0px 0px -8px 0px" });
    revealNodes.forEach(function (el) { revealObserver.observe(el); });
  }

  var hero = document.querySelector(".hero");
  if (hero && !reduce && finePointer && window.matchMedia("(min-width: 800px)").matches) {
    var canvas = document.createElement("canvas");
    canvas.className = "liquid-canvas";
    canvas.setAttribute("aria-hidden", "true");
    hero.insertBefore(canvas, hero.firstChild);
    var ctx = canvas.getContext("2d", { alpha: true });
    var blobs = [
      { x: .18, y: .32, r: .28, c: "rgba(3,48,108,.85)", s: .4 },
      { x: .72, y: .22, r: .22, c: "rgba(219,153,29,.45)", s: .55 },
      { x: .58, y: .7, r: .2, c: "rgba(178,3,25,.28)", s: .33 },
      { x: .4, y: .5, r: .26, c: "rgba(3,48,108,.55)", s: .25 },
      { x: .84, y: .62, r: .16, c: "rgba(219,153,29,.22)", s: .48 }
    ];
    var running = false;
    var last = 0;
    function sizeCanvas() {
      var rect = hero.getBoundingClientRect();
      var dpr = Math.min(window.devicePixelRatio || 1, 1.25);
      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));
      canvas.style.width = rect.width + "px";
      canvas.style.height = rect.height + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function frame(now) {
      if (!running || !hero.classList.contains("liquid-on")) { running = false; return; }
      if (now - last < 33) { requestAnimationFrame(frame); return; }
      last = now;
      var w = hero.clientWidth;
      var h = hero.clientHeight;
      var t = now / 1000;
      ctx.clearRect(0, 0, w, h);
      blobs.forEach(function (b, i) {
        var x = (b.x + Math.sin(t * b.s + i) * .06) * w;
        var y = (b.y + Math.cos(t * b.s * .8 + i) * .05) * h;
        var rad = b.r * Math.min(w, h) * (1 + Math.sin(t * .3 + i) * .06);
        var g = ctx.createRadialGradient(x, y, rad * .1, x, y, rad);
        g.addColorStop(0, b.c);
        g.addColorStop(1, "rgba(0,1,16,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, rad, 0, Math.PI * 2);
        ctx.fill();
      });
      requestAnimationFrame(frame);
    }
    function start() {
      if (running || reduce) return;
      running = true;
      sizeCanvas();
      requestAnimationFrame(frame);
    }
    hero.classList.add("liquid-on");
    start();
    window.addEventListener("resize", sizeCanvas);
    var heroWatch = new MutationObserver(function () {
      if (hero.classList.contains("liquid-on")) start();
      else running = false;
    });
    heroWatch.observe(hero, { attributes: true, attributeFilter: ["class"] });

    var glow = document.createElement("div");
    glow.className = "hero-glow";
    glow.setAttribute("aria-hidden", "true");
    hero.appendChild(glow);
    hero.addEventListener("pointermove", function (event) {
      if (event.pointerType && event.pointerType !== "mouse") return;
      var rect = hero.getBoundingClientRect();
      glow.style.left = (event.clientX - rect.left) + "px";
      glow.style.top = (event.clientY - rect.top) + "px";
    });
  }

  document.addEventListener("click", function (event) {
    if (reduce) return;
    var btn = event.target.closest(".btn");
    if (!btn) return;
    var rect = btn.getBoundingClientRect();
    var ripple = document.createElement("span");
    ripple.className = "btn-ripple";
    var size = Math.max(rect.width, rect.height);
    ripple.style.width = ripple.style.height = size + "px";
    ripple.style.left = (event.clientX - rect.left - size / 2) + "px";
    ripple.style.top = (event.clientY - rect.top - size / 2) + "px";
    btn.appendChild(ripple);
    window.setTimeout(function () { ripple.remove(); }, 700);
  });
})();
