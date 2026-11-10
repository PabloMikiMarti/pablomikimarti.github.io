const themeButton = document.querySelector(".theme-toggle");
const themeLabel = themeButton.querySelector(".theme-label");
const systemTheme = matchMedia("(prefers-color-scheme: dark)");
const root = document.documentElement;

function updateThemeControl() {
  const dark = (root.dataset.theme || (systemTheme.matches ? "dark" : "light")) === "dark";
  themeButton.setAttribute("aria-pressed", String(dark));
  themeLabel.textContent = dark ? "Light" : "Dark";
  return dark;
}

themeButton.addEventListener("click", () => {
  const theme = updateThemeControl() ? "light" : "dark";
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

const title = document.querySelector(".name-container");
const displacement = document.querySelector("#name-displacement");
const motionPreference = matchMedia("(prefers-reduced-motion: reduce)");
let warpRange = 1;
let maxDisplacement = 0;
let amount = 0;
let frame = 0;
let previousTime;

function drawName(time) {
  frame = 0;
  const progress = Math.min(1, Math.max(0, window.scrollY / warpRange));
  const target = progress === 1 ? 0 : maxDisplacement * Math.sin(Math.PI * progress) ** 1.4;
  const elapsed = previousTime === undefined ? 1000 / 60 : time - previousTime;
  previousTime = time;
  amount += (target - amount) * (1 - Math.exp(-elapsed / 78));
  const settling = Math.abs(target - amount) > .12;
  if (!settling) amount = target;

  title.classList.toggle("is-distorted", amount > .12);
  displacement.setAttribute("scale", amount.toFixed(2));
  if (settling) {
    frame = requestAnimationFrame(drawName);
  } else {
    previousTime = undefined;
  }
}

function queueNameUpdate() {
  if (!frame && !motionPreference.matches) frame = requestAnimationFrame(drawName);
}

function measureName() {
  // Measure the unwarped layout so the range stays tied to the visible title.
  const bounds = title.getBoundingClientRect();
  warpRange = Math.max(1, bounds.bottom + window.scrollY);
  maxDisplacement = Math.min(28, Math.max(9, bounds.height * .1));
  queueNameUpdate();
}

function applyMotionPreference() {
  if (motionPreference.matches) {
    cancelAnimationFrame(frame);
    frame = 0;
    previousTime = undefined;
    amount = 0;
    title.classList.remove("is-distorted");
    displacement.setAttribute("scale", "0");
  } else {
    measureName();
  }
}

window.addEventListener("scroll", queueNameUpdate, { passive: true });
window.addEventListener("resize", measureName);
window.addEventListener("pageshow", measureName);
motionPreference.addEventListener("change", applyMotionPreference);
if ("ResizeObserver" in window) new ResizeObserver(measureName).observe(title);
applyMotionPreference();

const panotField = document.querySelector(".panot-field");
const panotTile = panotField?.querySelector(".panot-tile");
const hero = panotField?.closest(".hero");

function snapTile(offset, space, target, step) {
  const first = Math.ceil(offset / step);
  const last = Math.floor((offset + space) / step);
  const cell = Math.round((offset + target) / step);
  return Math.max(first, Math.min(last, cell)) * step - offset;
}

if (panotTile && hero) {
  const placeTile = (event) => {
    const step = parseFloat(getComputedStyle(hero).getPropertyValue("--grid-step"));
    if (!step) return;
    const field = panotField.getBoundingClientRect();
    const grid = hero.getBoundingClientRect();
    const { width, height } = panotTile.getBoundingClientRect();
    const spaceX = field.width - width;
    const spaceY = field.height - height;
    const targetX = event ? event.clientX - field.left - width / 2 + step / 2 : spaceX;
    const targetY = event ? event.clientY - field.top - height / 2 + step / 2 : spaceY / 2;
    const x = snapTile(field.left - grid.left, spaceX, targetX, step);
    const y = snapTile(field.top - grid.top, spaceY, targetY, step);
    const position = `translate(${x}px, ${y}px)`;
    if (panotTile.style.transform !== position) panotTile.style.transform = position;
  };
  const resetTile = () => placeTile();

  panotField.addEventListener("pointermove", (event) => {
    if (event.pointerType === "mouse" && !motionPreference.matches) placeTile(event);
  }, { passive: true });
  panotField.addEventListener("pointerleave", resetTile);
  motionPreference.addEventListener("change", resetTile);
  window.addEventListener("resize", resetTile);
  if ("ResizeObserver" in window) new ResizeObserver(resetTile).observe(hero);
  resetTile();
}

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
