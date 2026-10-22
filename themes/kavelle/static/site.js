/* Kavelle page script. Every block is optional, so the same file works in every generated package
   (a WordPress page without the slider, a Shopify page without the form, and so on). */
(function () {
  var root = document.documentElement;
  var still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  $$("[data-year]").forEach(function (n) { n.textContent = new Date().getFullYear(); });
  if (!still) root.classList.add("anim");

  // Header turns solid after the first screen starts to scroll; phone menu.
  var bar = $("#top-bar"), burger = $("[data-burger]");
  if (bar) {
    var onScroll = function () { bar.classList.toggle("solid", scrollY > 40); };
    addEventListener("scroll", onScroll, { passive: true }); onScroll();
    if (burger) {
      burger.addEventListener("click", function () { var open = bar.classList.toggle("open"); burger.setAttribute("aria-expanded", String(open)); });
      $$("nav a", bar).forEach(function (a) { a.addEventListener("click", function () { bar.classList.remove("open"); burger.setAttribute("aria-expanded", "false"); }); });
    }
  }

  // Slider: fade every 5 s, letters of the title rise one by one.
  var slides = $$(".slide"), bars = $$("[data-bars] i"), cur = $("[data-cur]"), idx = 0, timer = null, DELAY = 5000;
  if (slides.length) {
    slides.forEach(function (s) {
      var h = $("h2", s); if (!h) return;
      var t = h.textContent;
      h.setAttribute("aria-label", t); h.textContent = "";
      t.split("").forEach(function (ch, i) { var l = document.createElement("span"); l.className = "l"; l.textContent = ch; l.style.setProperty("--i", i); l.setAttribute("aria-hidden", "true"); h.appendChild(l); });
    });
    var show = function (n) {
      idx = (n + slides.length) % slides.length;
      slides.forEach(function (s, i) { s.classList.toggle("on", i === idx); s.setAttribute("aria-hidden", String(i !== idx)); var b = $(".btn", s); if (b) b.tabIndex = i === idx ? 0 : -1; });
      bars.forEach(function (b, i) { b.className = i < idx ? "done" : ""; });
      if (cur) cur.textContent = String(idx + 1).padStart(2, "0");
      if (!still && bars[idx]) { void bars[idx].offsetWidth; bars[idx].style.setProperty("--dur", DELAY + "ms"); bars[idx].className = "run"; }
      clearTimeout(timer);
      if (!still) timer = setTimeout(function () { show(idx + 1); }, DELAY);
    };
    var prev = $("[data-prev]"), next = $("[data-next]");
    if (prev) prev.addEventListener("click", function () { show(idx - 1); });
    if (next) next.addEventListener("click", function () { show(idx + 1); });
    document.addEventListener("visibilitychange", function () { if (document.hidden) clearTimeout(timer); else show(idx); });
    show(0);
  }

  // Project categories: drag the row with the mouse.
  var cats = $("[data-cats]");
  if (cats) {
    var down = false, sx = 0, sl = 0, moved = false;
    cats.addEventListener("pointerdown", function (e) { if (e.pointerType !== "mouse") return; down = true; moved = false; sx = e.clientX; sl = cats.scrollLeft; });
    addEventListener("pointermove", function (e) { if (!down) return; var dx = e.clientX - sx; if (Math.abs(dx) > 4) { moved = true; cats.classList.add("drag"); } cats.scrollLeft = sl - dx; });
    addEventListener("pointerup", function () { down = false; cats.classList.remove("drag"); });
    cats.addEventListener("click", function (e) { if (moved) { e.preventDefault(); moved = false; } }, true);
    cats.addEventListener("dragstart", function (e) { e.preventDefault(); });
  }

  // Fades as blocks scroll in, and the numbers count up.
  function count(el) {
    var end = +el.dataset.count, t0 = null;
    function step(t) { if (!t0) t0 = t; var p = Math.min(1, (t - t0) / 1400); el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(step); }
    requestAnimationFrame(step);
  }
  if (!still && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add("in"); io.unobserve(e.target);
        $$("[data-count]", e.target).forEach(count);
      });
    }, { rootMargin: "0px 0px -12% 0px" });
    $$("[data-in]").forEach(function (el) { io.observe(el); });
  } else {
    $$("[data-in]").forEach(function (el) { el.classList.add("in"); });
  }

  // Running headings: repeat the text so the loop has no gap.
  $$("[data-run]").forEach(function (r) { var t = r.textContent.trim(); r.textContent = ""; for (var i = 0; i < 8; i++) { var s = document.createElement("span"); s.textContent = t; r.appendChild(s); } });

  // A service card fills in the topic of the form.
  $$("[data-service]").forEach(function (a) {
    a.addEventListener("click", function () {
      var v = a.getAttribute("data-service");
      $$('form input[name="service"]').forEach(function (r) { if (r.value === v) r.checked = true; });
    });
  });

  // Formgong form: thanks only when Formgong answers success: true. Forms without a status line
  // (for example the one the Formgong WordPress plugin draws) keep their own behaviour.
  $$('form[action^="https://formgong.com/submit"]').forEach(function (form) {
    var status = $("[data-status]", form);
    if (!status) return;
    var button = $('button[type="submit"]', form), label = $("[data-send-label]", form), sendText = label ? label.textContent : "";
    var say = function (text, bad) { status.textContent = text; status.classList.toggle("err", !!bad); };
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      if (button) button.disabled = true; if (label) label.textContent = "Sending…"; say("");
      var nameField = form.elements.namedItem("name");
      var first = ((nameField && nameField.value) || "").trim().split(/\s+/)[0];
      fetch(form.action, { method: "POST", headers: { Accept: "application/json" }, body: new FormData(form) })
        .then(function (res) { return res.json().catch(function () { return null; }); })
        .then(function (result) {
          if (result && result.success === true) {
            var n = $("[data-name]", form); if (n) n.textContent = first || "there";
            form.reset();
            form.classList.add("is-sent");
            var thanks = $(".thanks", form); if (thanks) thanks.focus();
          } else {
            say((result && result.message) || "Could not send. Please try again.", true);
          }
        })
        .catch(function () { say("Could not send. Check your connection and try again.", true); })
        .then(function () { if (button) button.disabled = false; if (label) label.textContent = sendText; });
    });
    var again = $("[data-again]", form);
    if (again) again.addEventListener("click", function () { form.classList.remove("is-sent"); say(""); if (form.elements.namedItem("name")) form.elements.namedItem("name").focus(); });
  });
})();
