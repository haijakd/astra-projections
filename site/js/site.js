// Astra Projections - slideshow + form handling (no dependencies)
// Forms post to /api/contact (functions/api/contact.js), which saves to D1 and emails the owner.
// Without JavaScript they still post, and the function redirects back with ?sent=1 or ?error=1.

(function slideshow() {
  const hero = document.querySelector(".hero");
  if (!hero) return;
  const slides = [...hero.querySelectorAll(".slide")];
  const dots = hero.querySelector(".dots");
  let i = 0, timer;
  slides.forEach((_, n) => {
    const b = document.createElement("button");
    b.type = "button";
    b.setAttribute("aria-label", "Slide " + (n + 1));
    b.addEventListener("click", () => { show(n); restart(); });
    dots.appendChild(b);
  });
  function show(n) {
    i = (n + slides.length) % slides.length;
    slides.forEach((s, k) => {
      if (k === i && s.dataset.src) { s.src = s.dataset.src; delete s.dataset.src; }
      s.classList.toggle("on", k === i);
    });
    [...dots.children].forEach((d, k) => d.classList.toggle("on", k === i));
    const next = slides[(i + 1) % slides.length];
    if (next.dataset.src) { next.src = next.dataset.src; delete next.dataset.src; }
  }
  function restart() { clearInterval(timer); timer = setInterval(() => show(i + 1), 4500); }
  show(0); restart();
})();

const SENT = "Thanks, your message was sent. We'll get back to you soon.";
const q = new URLSearchParams(location.search);
document.querySelectorAll("form.quote").forEach((form) => {
  const status = form.querySelector(".status");
  const button = form.querySelector('button[type="submit"]');
  const show = (text, ok) => { status.textContent = text; status.className = "status " + (ok ? "ok" : "err"); };
  if (q.has("sent")) show(SENT, true);
  if (q.has("error")) show("Something in the form needs fixing. Please check it and try again.", false);

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!form.reportValidity()) return;
    button.disabled = true;
    show("Sending...", true);
    try {
      const r = await fetch(form.action, { method: "POST", body: new FormData(form), headers: { Accept: "application/json" } });
      const out = await r.json().catch(() => ({}));
      if (r.ok && out.ok) { form.reset(); show(SENT, true); }
      else show(out.error || "The message could not be sent. Please try again.", false);
    } catch (err) {
      show("No connection. Please check your internet and try again.", false);
    } finally {
      button.disabled = false;
    }
  });
});
