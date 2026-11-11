const root = document.documentElement;
const systemTheme = matchMedia("(prefers-color-scheme: dark)");
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");

/* ---------------- theme toggle ---------------- */
const themeButton = document.querySelector(".theme-toggle");
const currentTheme = () => root.dataset.theme || (systemTheme.matches ? "dark" : "light");

function updateThemeControl() {
  const dark = currentTheme() === "dark";
  themeButton.setAttribute("aria-pressed", String(dark));
  themeButton.title = dark ? "Switch to light mode" : "Switch to dark mode";
}

themeButton.addEventListener("click", () => {
  const theme = currentTheme() === "dark" ? "light" : "dark";
  root.dataset.theme = theme;
  try {
    localStorage.setItem("portfolio-theme", theme);
  } catch {
    // The preference still applies to this page when storage is unavailable.
  }
  updateThemeControl();
});
systemTheme.addEventListener("change", updateThemeControl);
updateThemeControl();
themeButton.hidden = false;

/* ---------------- hero rotating phrase ---------------- */
(function () {
  const rot = document.querySelector(".rotator");
  if (!rot) return;
  const words = rot.dataset.words.split("|");
  let i = 0;
  // one span per letter; spaces become no-break spaces so inline-blocks keep their width
  const build = (word, el) => {
    el.textContent = "";
    [...word].forEach((c, k) => {
      const ch = document.createElement("span");
      ch.className = "ch";
      ch.textContent = c === " " ? " " : c;
      ch.style.setProperty("--i", k);
      el.appendChild(ch);
    });
    return el;
  };
  const first = rot.querySelector(".rot-word");
  const els = words.map((word, k) => {
    if (k === 0) return build(word, first);
    const el = document.createElement("span");
    el.className = "rot-word";
    rot.appendChild(el);
    return build(word, el);
  });
  // the width eases after the old letters clear (see the CSS delay), so the comma never clips them
  const fit = () => { rot.style.width = els[i].offsetWidth + "px"; };
  fit();
  if (document.fonts) document.fonts.ready.then(fit);
  addEventListener("resize", fit);
  if (reduceMotion.matches) return;
  setInterval(() => {
    if (document.hidden) return;
    const out = els[i];
    i = (i + 1) % els.length;
    out.classList.replace("is-current", "is-out");
    els[i].classList.add("is-current");
    fit();
    setTimeout(() => {
      out.classList.add("no-anim");
      out.classList.remove("is-out");
      void out.offsetWidth;
      out.classList.remove("no-anim");
    }, 1000);
  }, 3200);
})();

/* ---------------- copy email ---------------- */
const copyButton = document.querySelector(".copy-button");
const copyStatus = document.querySelector(".copy-status");
const email = document.querySelector(".email-link");
let copyReset;

if (navigator.clipboard) {
  copyButton.hidden = false;
  copyButton.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(email.textContent.trim());
      copyButton.textContent = "Copied";
      copyStatus.textContent = "Email address copied.";
      clearTimeout(copyReset);
      copyReset = setTimeout(() => { copyButton.textContent = "Copy"; }, 1800);
    } catch {
      copyStatus.textContent = "Could not copy the email address.";
    }
  });
}
