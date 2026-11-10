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
    "pm-consulting": "PM Consulting",
    "pm": "PM Consulting",
    "ai-governance": "AI Governance",
    "training": "Training & Workshops",
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
