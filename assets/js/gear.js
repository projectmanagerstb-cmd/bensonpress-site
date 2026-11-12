(function () {
  "use strict";
  var root = document.querySelector("[data-gear-showcase]");
  if (!root) return;

  var items = [
    { name: "Flat Bill Cap", price: "From $26.85", slug: "flat-bill-cap" },
    { name: "BlackOPS SLAP Stainless-steel tumbler", price: "From $37.69", slug: "stainless-steel-tumbler" },
    { name: "SLAP Black Glossy Mug", price: "From $19.80", slug: "black-glossy-mug-6aefc337a1aa3" },
    { name: "BlackOPS Glossy Mug", price: "From $19.80", slug: "black-glossy-mug" },
    { name: "BlackOPS Unisex Premium Sweatshirt", price: "From $36.50", slug: "unisex-premium-sweatshirt" },
    { name: "BlackOPS TTIA Premium heavyweight long sleeve shirt", price: "From $36.00", slug: "premium-heavyweight-long-sleeve-shirt-6acd83057e9e7" },
    { name: "BlackOPS This Too Is America", price: "From $48.00", slug: "premium-heavyweight-long-sleeve-shirt" },
    { name: "BlackOPS -saga Men’s Long Sleeve Shirt", price: "From $33.50", slug: "mens-long-sleeve-shirt" },
    { name: "BlackOPS Clear Case for iPhone®", price: "From $20.00", slug: "blackops-clear-case-for-iphone" },
    { name: "BLACK OPS Tagline Type Tee", price: "From $28.00", slug: "black-ops-tagline-type-tee" },
    { name: "BLACK OPS Performance Quarter-Zip", price: "From $55.00", slug: "black-ops-performance-quarter-zip" },
    { name: "BLACK OPS Performance Tee", price: "From $38.00", slug: "black-ops-performance-tee" },
    { name: "BLACK OPS Mug", price: "From $20.00", slug: "black-ops-mug" },
    { name: "BLACK OPS Embroidered Cap", price: "From $30.00", slug: "black-ops-embroidered-cap" },
    { name: "BLACK OPS Saga Hoodie", price: "From $65.00", slug: "black-ops-saga-hoodie" },
    { name: "LEGACY Book III Tee", price: "From $28.00", slug: "legacy-book-iii-tee" },
    { name: "GHOST Book II Tee", price: "From $28.00", slug: "ghost-book-ii-tee" },
    { name: "SLAP Book I Tee", price: "From $28.00", slug: "slap-book-i-tee" },
    { name: "BLACK OPS Tagline Tee", price: "From $28.00", slug: "black-ops-tagline-tee" },
    { name: "BLACK OPS Saga Logo Tee", price: "From $28.00", slug: "black-ops-saga-logo-tee" }
  ];

  var link = root.querySelector(".gear-link");
  var nameEl = root.querySelector(".gear-name");
  var priceEl = root.querySelector(".gear-price");
  var imgs = root.querySelectorAll(".gear-img");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var order = [];
  var cursor = 0;
  var front = 0;
  var timer = 0;
  var paused = false;
  var onScreen = true;

  function shuffle(list) {
    var copy = list.slice();
    for (var i = copy.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var swap = copy[i];
      copy[i] = copy[j];
      copy[j] = swap;
    }
    return copy;
  }

  function reshuffle(avoid) {
    order = shuffle(items.map(function (_, index) { return index; }));
    if (order.length > 1 && order[0] === avoid) {
      var swap = order[0];
      order[0] = order[1];
      order[1] = swap;
    }
    cursor = 0;
  }

  function srcFor(item, ext) {
    return "assets/gear/" + item.slug + "." + ext;
  }

  function paint(index, animate) {
    var item = items[index];
    var incoming = imgs[front ? 0 : 1];
    var outgoing = imgs[front ? 1 : 0];
    incoming.src = srcFor(item, "webp");
    incoming.setAttribute("data-fallback", srcFor(item, "jpg"));
    incoming.alt = item.name;
    incoming.removeAttribute("aria-hidden");
    if (!animate || reduce) {
      incoming.classList.add("is-on");
      outgoing.classList.remove("is-on");
      outgoing.alt = "";
      outgoing.setAttribute("aria-hidden", "true");
    } else {
      function reveal() {
        incoming.classList.add("is-on");
        outgoing.classList.remove("is-on");
        outgoing.alt = "";
        outgoing.setAttribute("aria-hidden", "true");
        incoming.removeEventListener("load", reveal);
      }
      if (incoming.complete && incoming.naturalWidth) reveal();
      else incoming.addEventListener("load", reveal);
    }
    nameEl.textContent = item.name;
    priceEl.textContent = item.price;
    link.href = "https://blackops-gear.printful.me/product/" + item.slug;
    link.setAttribute("aria-label", item.name + ", " + item.price + ". Opens the product page.");
    front = front ? 0 : 1;
  }

  imgs.forEach(function (img) {
    img.addEventListener("error", function () {
      var fallback = img.getAttribute("data-fallback");
      if (fallback && img.src.indexOf(fallback) === -1) img.src = fallback;
    });
  });

  function currentIndex() {
    return order[cursor];
  }

  function step(delta) {
    var previous = currentIndex();
    cursor += delta;
    if (cursor >= order.length || cursor < 0) reshuffle(previous);
    if (cursor < 0) cursor = order.length - 1;
    paint(currentIndex(), !reduce);
    schedule();
  }

  function tick() {
    if (paused || !onScreen || reduce) return;
    step(1);
  }

  function schedule() {
    window.clearInterval(timer);
    timer = 0;
    if (reduce || paused || !onScreen) return;
    timer = window.setInterval(tick, 4000);
  }

  function setPaused(next) {
    paused = next;
    schedule();
  }

  reshuffle(-1);
  if (reduce) {
    cursor = Math.floor(Math.random() * order.length);
  }
  paint(currentIndex(), false);
  schedule();

  root.addEventListener("mouseenter", function () { setPaused(true); });
  root.addEventListener("mouseleave", function () { setPaused(false); });
  root.addEventListener("focusin", function () { setPaused(true); });
  root.addEventListener("focusout", function (event) {
    if (!root.contains(event.relatedTarget)) setPaused(false);
  });
  root.querySelector("[data-gear-prev]").addEventListener("click", function () { step(-1); });
  root.querySelector("[data-gear-next]").addEventListener("click", function () { step(1); });

  if ("IntersectionObserver" in window) {
    var observer = new IntersectionObserver(function (entries) {
      onScreen = entries[0].isIntersecting;
      schedule();
    }, { threshold: 0.25 });
    observer.observe(root);
  }
})();
