// Astra Projections - slideshow + form handling (no dependencies)

// FORM DELIVERY: the Wix forms do not work off Wix. Set ONE of these to make the forms deliver.
//  - FORM_ENDPOINT: a free form backend URL (e.g. https://formspree.io/f/XXXX or https://formsubmit.co/ajax/you@domain)
//  - CONTACT_EMAIL: fallback that opens the visitor's email app with the message filled in
const FORM_ENDPOINT = "";
const CONTACT_EMAIL = "";

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

document.querySelectorAll("form.quote").forEach((form) => {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const status = form.querySelector(".status");
    const data = Object.fromEntries(new FormData(form));
    data._subject = "Astra Projections website: " + (form.dataset.kind || "message");
    if (FORM_ENDPOINT) {
      try {
        const r = await fetch(FORM_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(data),
        });
        status.textContent = r.ok ? "Thanks, your message was sent." : "Sending failed, please try again.";
        if (r.ok) form.reset();
      } catch (err) {
        status.textContent = "Sending failed, please try again.";
      }
      return;
    }
    if (CONTACT_EMAIL) {
      const body = Object.entries(data).filter(([k]) => k !== "_subject").map(([k, v]) => k + ": " + v).join("\n");
      location.href = "mailto:" + CONTACT_EMAIL + "?subject=" + encodeURIComponent(data._subject) + "&body=" + encodeURIComponent(body);
      return;
    }
    status.textContent = "This form is not connected yet. Please reach us on Facebook or LinkedIn.";
  });
});
