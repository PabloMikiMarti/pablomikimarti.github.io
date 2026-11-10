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

const panot = document.querySelector(".panot-trail");
const finePointer = matchMedia("(any-hover: hover) and (any-pointer: fine)");
let panotX = 0;
let panotY = 0;
let targetX = 0;
let targetY = 0;
let panotFrame = 0;
let panotTime;

function paintPanot() {
  panot.style.transform = `translate3d(${panotX.toFixed(1)}px, ${panotY.toFixed(1)}px, 0)`;
}

function easePanot(time) {
  const elapsed = panotTime === undefined ? 1000 / 60 : time - panotTime;
  const ease = 1 - Math.exp(-elapsed / 82);
  panotX += (targetX - panotX) * ease;
  panotY += (targetY - panotY) * ease;
  panotTime = time;

  if (Math.hypot(targetX - panotX, targetY - panotY) > .35) {
    panotFrame = requestAnimationFrame(easePanot);
  } else {
    panotX = targetX;
    panotY = targetY;
    panotFrame = 0;
    panotTime = undefined;
  }
  paintPanot();
}

function hidePanot() {
  panot.classList.remove("is-visible");
  cancelAnimationFrame(panotFrame);
  panotFrame = 0;
  panotTime = undefined;
}

function followPointer(event) {
  if (event.pointerType !== "mouse") {
    hidePanot();
    return;
  }
  const offset = 28;
  const size = 28;
  const { clientX, clientY } = event;
  targetX = Math.max(0, clientX + offset + size <= innerWidth ? clientX + offset : clientX - offset - size);
  targetY = Math.max(0, clientY + offset + size <= innerHeight ? clientY + offset : clientY - offset - size);

  if (!panot.classList.contains("is-visible")) {
    panotX = targetX;
    panotY = targetY;
    paintPanot();
    panot.classList.add("is-visible");
  } else if (!panotFrame && (panotX !== targetX || panotY !== targetY)) {
    panotFrame = requestAnimationFrame(easePanot);
  }
}

function syncPanot() {
  if (finePointer.matches && !motionPreference.matches) {
    window.addEventListener("pointermove", followPointer, { passive: true });
  } else {
    window.removeEventListener("pointermove", followPointer);
    hidePanot();
  }
}

root.addEventListener("pointerleave", hidePanot);
window.addEventListener("blur", hidePanot);
finePointer.addEventListener("change", syncPanot);
motionPreference.addEventListener("change", syncPanot);
syncPanot();

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
