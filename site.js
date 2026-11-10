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
  if (!topic) return;

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
})();
