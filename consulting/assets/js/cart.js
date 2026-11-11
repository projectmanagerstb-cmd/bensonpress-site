(function () {
  "use strict";

  // Display-only catalog. Checkout prices come from the worker, never from here.
  var CATALOG = {
    "pmo-individual": { name: "PMO Setup Kit – Individual license", price: 89, physical: false },
    "pmo-team": { name: "PMO Setup Kit – Team license (up to 10 users)", price: 249, physical: false },
    "pmo-enterprise": { name: "PMO Setup Kit – Enterprise license", price: 599, physical: false },
    "aig-individual": { name: "AI Governance for PMOs – Individual license", price: 199, physical: false },
    "aig-team": { name: "AI Governance for PMOs – Team license (up to 10 users)", price: 399, physical: false },
    "aig-enterprise": { name: "AI Governance for PMOs – Enterprise license", price: 799, physical: false },
    "invoice-payment": { name: "Invoice payment – Training, workshops & consulting", custom: true },
    "pay-any-amount": { name: "Payment to Benson Press", custom: true }
  };

  var STORAGE_KEY = "bp-consulting-cart-v1";
  var MIN_QTY = 1;
  var MAX_QTY = 10;
  var MIN_CUSTOM = 1;
  var MAX_CUSTOM = 25000;

  // Set by the worker deploy step; overridable with window.BP_CHECKOUT_URL.
  var DEFAULT_CHECKOUT_URL = "https://bensonpress-checkout.bensonpress.workers.dev/checkout";

  function checkoutUrl() {
    return window.BP_CHECKOUT_URL || DEFAULT_CHECKOUT_URL;
  }

  function loadCart() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      var data = raw ? JSON.parse(raw) : { items: [] };
      if (!data || !Array.isArray(data.items)) return { items: [] };
      return data;
    } catch (e) {
      return { items: [] };
    }
  }

  function saveCart(cart) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    renderAll();
  }

  function itemCount(cart) {
    return cart.items.reduce(function (sum, item) { return sum + (item.qty || 0); }, 0);
  }

  function subtotal(cart) {
    return cart.items.reduce(function (sum, item) {
      var product = CATALOG[item.sku];
      if (!product || product.custom) return sum;
      return sum + product.price * item.qty;
    }, 0);
  }

  function money(n) {
    return "$" + Number(n).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  }

  function announce(message) {
    var live = document.getElementById("cart-live");
    if (!live) return;
    live.textContent = "";
    window.setTimeout(function () { live.textContent = message; }, 50);
  }

  function addItem(sku, qty) {
    var product = CATALOG[sku];
    if (!product || product.custom) return false;
    qty = parseInt(qty, 10);
    if (!qty || qty < MIN_QTY) qty = 1;
    var cart = loadCart();
    var found = null;
    for (var i = 0; i < cart.items.length; i++) {
      if (cart.items[i].sku === sku) { found = cart.items[i]; break; }
    }
    if (found) {
      found.qty = Math.min(MAX_QTY, found.qty + qty);
    } else {
      cart.items.push({ sku: sku, qty: Math.min(MAX_QTY, qty) });
    }
    saveCart(cart);
    announce(product.name + " added to cart.");
    return true;
  }

  function setQty(sku, qty) {
    qty = parseInt(qty, 10);
    var cart = loadCart();
    if (!qty || qty < MIN_QTY) {
      cart.items = cart.items.filter(function (item) { return item.sku !== sku; });
    } else {
      cart.items.forEach(function (item) {
        if (item.sku === sku) item.qty = Math.min(MAX_QTY, qty);
      });
    }
    saveCart(cart);
  }

  function removeItem(sku) {
    var cart = loadCart();
    var product = CATALOG[sku];
    cart.items = cart.items.filter(function (item) { return item.sku !== sku; });
    saveCart(cart);
    if (product) announce(product.name + " removed from cart.");
  }

  function clearCart() {
    saveCart({ items: [] });
  }

  function formatCountLabel(count) {
    if (count <= 0) return "Cart, empty";
    return "Cart, " + count + (count === 1 ? " item" : " items");
  }

  function renderBadges() {
    var cart = loadCart();
    var count = itemCount(cart);
    var badges = document.querySelectorAll("[data-cart-count]");
    badges.forEach(function (badge) {
      if (count > 0) {
        badge.hidden = false;
        badge.textContent = String(count);
      } else {
        badge.hidden = true;
        badge.textContent = "";
      }
    });
    document.querySelectorAll("[data-cart-link]").forEach(function (link) {
      link.setAttribute("aria-label", formatCountLabel(count));
    });
  }

  function renderList(container) {
    if (!container) return;
    var cart = loadCart();
    if (!cart.items.length) {
      container.innerHTML = '<p class="cart-empty">Your cart is empty.</p><p><a class="btn" href="/kits.html">Continue shopping</a></p>';
      return;
    }
    var rows = cart.items.map(function (item) {
      var product = CATALOG[item.sku] || { name: item.sku, price: 0 };
      var line = product.price * item.qty;
      return (
        '<div class="cart-row" data-sku="' + item.sku + '">' +
          '<div class="cart-row-info">' +
            '<p class="cart-row-name">' + escapeHtml(product.name) + '</p>' +
            '<p class="cart-row-price">' + money(product.price) + ' each</p>' +
          '</div>' +
          '<div class="cart-row-qty">' +
            '<label><span class="visually-hidden">Quantity for ' + escapeHtml(product.name) + '</span>' +
            '<input type="number" min="1" max="10" value="' + item.qty + '" data-cart-qty="' + item.sku + '"></label>' +
          '</div>' +
          '<p class="cart-row-line">' + money(line) + '</p>' +
          '<button type="button" class="cart-remove" data-cart-remove="' + item.sku + '">Remove</button>' +
        '</div>'
      );
    }).join("");
    container.innerHTML =
      rows +
      '<p class="cart-subtotal">Subtotal <strong>' + money(subtotal(cart)) + '</strong></p>' +
      '<p class="cart-fine">Taxes, if any, are calculated by Square at checkout.</p>' +
      '<p class="cart-actions">' +
        '<button type="button" class="btn solid" data-cart-checkout>Checkout securely with Square</button>' +
      '</p>' +
      '<p class="cart-status" data-cart-status role="status" hidden></p>';
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function showStatus(root, message, isError) {
    var el = (root || document).querySelector("[data-cart-status]");
    if (!el) return;
    el.hidden = false;
    el.textContent = message;
    el.classList.toggle("is-error", !!isError);
  }

  function ensureDrawer() {
    if (document.getElementById("cart-drawer-root")) return;
    var root = document.createElement("div");
    root.id = "cart-drawer-root";
    root.hidden = true;
    root.innerHTML =
      '<div class="cart-backdrop" data-cart-close tabindex="-1"></div>' +
      '<aside class="cart-drawer" role="dialog" aria-modal="true" aria-labelledby="cart-drawer-title" tabindex="-1">' +
        '<div class="cart-drawer-bar">' +
          '<h2 id="cart-drawer-title">Your cart</h2>' +
          '<button type="button" class="btn" data-cart-close>Close</button>' +
        '</div>' +
        '<div class="cart-list" data-cart-list></div>' +
        '<p><a href="cart.html">Open full cart page</a></p>' +
      '</aside>';
    document.body.appendChild(root);
  }

  function ensureLiveRegion() {
    if (document.getElementById("cart-live")) return;
    var live = document.createElement("div");
    live.id = "cart-live";
    live.className = "visually-hidden";
    live.setAttribute("role", "status");
    live.setAttribute("aria-live", "polite");
    document.body.appendChild(live);
  }

  var lastFocus = null;

  function openDrawer(event) {
    if (event) event.preventDefault();
    ensureDrawer();
    var root = document.getElementById("cart-drawer-root");
    renderList(root.querySelector("[data-cart-list]"));
    lastFocus = document.activeElement;
    root.hidden = false;
    document.body.classList.add("cart-open");
    var panel = root.querySelector(".cart-drawer");
    var closeBtn = root.querySelector("[data-cart-close].btn") || root.querySelector("[data-cart-close]");
    if (closeBtn && closeBtn.tagName === "BUTTON") closeBtn.focus();
    else if (panel) panel.focus();
  }

  function closeDrawer() {
    var root = document.getElementById("cart-drawer-root");
    if (!root || root.hidden) return;
    root.hidden = true;
    document.body.classList.remove("cart-open");
    if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
  }

  function startCheckout(triggerRoot) {
    var cart = loadCart();
    if (!cart.items.length) {
      showStatus(triggerRoot, "Your cart is empty.", true);
      return;
    }
    var payload = {
      items: cart.items.map(function (item) {
        return { sku: item.sku, qty: item.qty };
      })
    };
    postCheckout(payload, triggerRoot);
  }

  function postCheckout(payload, triggerRoot) {
    var buttons = (triggerRoot || document).querySelectorAll("[data-cart-checkout], [data-pay-submit]");
    buttons.forEach(function (btn) { btn.disabled = true; });
    showStatus(triggerRoot, "Connecting to Square…", false);

    fetch(checkoutUrl(), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    })
      .then(function (res) {
        return res.json().then(function (body) {
          return { ok: res.ok, body: body };
        });
      })
      .then(function (result) {
        if (!result.ok || !result.body || !result.body.url) {
          var message = (result.body && result.body.error) || "Could not start checkout. Please try again.";
          showStatus(triggerRoot, message, true);
          buttons.forEach(function (btn) { btn.disabled = false; });
          return;
        }
        window.location.href = result.body.url;
      })
      .catch(function () {
        showStatus(triggerRoot, "Could not reach checkout. Check your connection and try again.", true);
        buttons.forEach(function (btn) { btn.disabled = false; });
      });
  }

  function bindStatic() {
    document.querySelectorAll("[data-cart-add]").forEach(function (form) {
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        var selected = form.querySelector('input[type="radio"]:checked');
        var sku = selected ? selected.value : form.getAttribute("data-sku");
        if (!sku) return;
        if (addItem(sku, 1)) openDrawer();
      });
    });

    document.querySelectorAll("[data-cart-link]").forEach(function (link) {
      link.addEventListener("click", function (event) {
        // Keep a real cart page for no-JS and full-page use; icon opens the drawer when JS is on.
        if (link.classList.contains("cart-icon-link")) {
          openDrawer(event);
        }
      });
    });

    document.addEventListener("click", function (event) {
      var close = event.target.closest("[data-cart-close]");
      if (close) {
        event.preventDefault();
        closeDrawer();
        return;
      }
      var remove = event.target.closest("[data-cart-remove]");
      if (remove) {
        removeItem(remove.getAttribute("data-cart-remove"));
        return;
      }
      var checkout = event.target.closest("[data-cart-checkout]");
      if (checkout) {
        event.preventDefault();
        startCheckout(checkout.closest(".cart-drawer, .cart-page, form, main") || document);
      }
    });

    document.addEventListener("change", function (event) {
      var input = event.target.closest("[data-cart-qty]");
      if (!input) return;
      setQty(input.getAttribute("data-cart-qty"), input.value);
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") closeDrawer();
      var root = document.getElementById("cart-drawer-root");
      if (!root || root.hidden || event.key !== "Tab") return;
      var focusable = root.querySelector(".cart-drawer").querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable.length) return;
      var first = focusable[0];
      var last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });

    document.querySelectorAll("[data-pay-form]").forEach(function (form) {
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        var sku = form.getAttribute("data-sku");
        var amountInput = form.querySelector('[name="amount"]');
        var noteInput = form.querySelector('[name="note"]');
        var amount = parseFloat(amountInput && amountInput.value, 10);
        if (!isFinite(amount) || amount < MIN_CUSTOM || amount > MAX_CUSTOM) {
          showStatus(form, "Enter an amount between $1 and $25,000.", true);
          return;
        }
        var cents = Math.round(amount * 100);
        if (cents < 100 || cents > 2500000) {
          showStatus(form, "Enter an amount between $1 and $25,000.", true);
          return;
        }
        var note = noteInput ? String(noteInput.value || "").trim() : "";
        postCheckout({ items: [{ sku: sku, qty: 1 }], amount_cents: cents, note: note }, form);
      });
    });
  }

  function renderAll() {
    renderBadges();
    document.querySelectorAll("[data-cart-list]").forEach(renderList);
  }

  function onThankYouPage() {
    return /thank-you\.html(?:[?#]|$)/.test(location.pathname) || document.body.hasAttribute("data-clear-cart");
  }

  ensureLiveRegion();
  if (onThankYouPage()) clearCart();
  ensureDrawer();
  bindStatic();
  renderAll();
})();
