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

const plate = document.querySelector(".plate-drawing");
const flower = plate?.querySelector(".plate-flower");

if (flower) {
  const restPosition = "translate(3 2)";
  const resetPlate = () => flower.setAttribute("transform", restPosition);

  plate.addEventListener("pointermove", (event) => {
    if (event.pointerType !== "mouse" || motionPreference.matches) return;

    const { left, top, width, height } = plate.getBoundingClientRect();
    // Snap the drawing by at most one cell in each direction.
    const column = Math.round(2 * (event.clientX - left) / width - .9);
    const row = Math.round(2 * (event.clientY - top) / height - .9);
    const position = `translate(${3 + column} ${2 + row})`;
    if (flower.getAttribute("transform") !== position) flower.setAttribute("transform", position);
  }, { passive: true });
  plate.addEventListener("pointerleave", resetPlate);
  motionPreference.addEventListener("change", resetPlate);
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
