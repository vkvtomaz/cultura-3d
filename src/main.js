import { initFaq } from "./faq.js";
import { brand } from "./config.js";
import { buildWhatsAppUrl, buildOrderMessage } from "./contact.js";
import { initComparisons } from "./comparisons.js";

initComparisons();
initFaq();

// Mantém a preferência de tema e os rótulos acessíveis em sincronia.
const root = document.documentElement;
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
const themeButton = document.querySelector(".theme-toggle");
const themeLabel = document.querySelector("[data-theme-label]");

function reflectTheme() {
  const dark = root.dataset.theme === "dark";
  themeButton.setAttribute("aria-pressed", String(dark));
  themeButton.setAttribute(
    "aria-label",
    dark ? "Ativar modo claro" : "Ativar modo escuro",
  );
  themeLabel.textContent = dark ? "Claro" : "Escuro";
  document.querySelector('meta[name="theme-color"]').content = dark
    ? "#1d211f"
    : "#f3f0e7";
}
reflectTheme();
themeButton.addEventListener("click", () => {
  root.dataset.theme = root.dataset.theme === "dark" ? "light" : "dark";
  try {
    localStorage.setItem("cultura-theme", root.dataset.theme);
  } catch {}
  reflectTheme();
});
matchMedia("(prefers-color-scheme: dark)").addEventListener(
  "change",
  (event) => {
    try {
      if (localStorage.getItem("cultura-theme")) return;
    } catch {}
    root.dataset.theme = event.matches ? "dark" : "light";
    reflectTheme();
  },
);

// A navegação móvel também pode ser fechada pela tecla Escape.
const menuToggle = document.querySelector(".menu-toggle");
const mobileNav = document.getElementById("mobile-nav");
function setMenu(open) {
  menuToggle.setAttribute("aria-expanded", String(open));
  menuToggle.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
  mobileNav.hidden = !open;
}
menuToggle.addEventListener("click", () => setMenu(mobileNav.hidden));
mobileNav.addEventListener("click", (event) => {
  if (event.target.closest("a")) setMenu(false);
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !mobileNav.hidden) {
    setMenu(false);
    menuToggle.focus();
  }
});
matchMedia("(min-width: 851px)").addEventListener("change", (event) => {
  if (event.matches) setMenu(false);
});

for (const link of document.querySelectorAll("[data-whatsapp-link]"))
  link.href = buildWhatsAppUrl(brand.whatsapp, brand.greeting);
for (const year of document.querySelectorAll("[data-year]"))
  year.textContent = new Date().getFullYear();

// Prepara a mensagem; o visitante confirma o envio no WhatsApp.
const form = document.getElementById("order-form");
const feedback = document.getElementById("form-feedback");
const fallbackLink = document.getElementById("whatsapp-fallback");
form.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  try {
    const message = buildOrderMessage(Object.fromEntries(new FormData(form)));
    const url = buildWhatsAppUrl(brand.whatsapp, message);
    fallbackLink.href = url;
    fallbackLink.hidden = false;
    // Mantém um link alternativo caso o navegador bloqueie a nova aba.
    window.open(url, "_blank", "noopener,noreferrer");
    feedback.dataset.error = "false";
    feedback.textContent =
      "Continue no WhatsApp para revisar e enviar. Se a conversa não abriu, use o link abaixo.";
  } catch (error) {
    feedback.dataset.error = "true";
    feedback.textContent = error.message;
  }
});

// Carrega o modelo perto da área visível e usa a foto se houver falha.
const stage = document.querySelector(".object-stage");
const hero = document.querySelector(".hero");
const heroCanvas = document.getElementById("hero-canvas");
const heroPoster = stage.querySelector(".object-poster");
const colorName = document.querySelector(".material-name");
let scene = null,
  selectedColor = document.querySelector(
    '.material-swatch[aria-pressed="true"]',
  ).dataset.color,
  sceneLoading = false;
const viewerHint = () =>
  reducedMotion.matches || matchMedia("(pointer: coarse)").matches
    ? "Arraste para girar em 360° ↔︎"
    : "Mova o cursor · arraste para girar ↔︎";
document.getElementById("object-help").textContent = viewerHint();
async function loadScene() {
  if (scene || sceneLoading || navigator.connection?.saveData) return;
  sceneLoading = true;
  stage.dataset.modelState = "loading";
  document.getElementById("object-help").textContent = "Carregando modelo 3D…";
  try {
    const { createHeroScene } = await import("./dragon-viewer.js");
    scene = await createHeroScene({
      canvas: heroCanvas,
      stage,
      hero,
      image: heroPoster,
      color: selectedColor,
      reducedMotion,
    });
    scene.setColor(selectedColor);
    stage.dataset.modelState = "ready";
    document.getElementById("object-help").textContent = viewerHint();
  } catch {
    stage.dataset.modelState = "fallback";
    heroCanvas.hidden = true;
    heroPoster.hidden = false;
    document.getElementById("object-help").textContent = "Prévia da peça.";
  } finally {
    sceneLoading = false;
  }
}
const sceneObserver = new IntersectionObserver(
  ([entry]) => {
    if (entry.isIntersecting) {
      loadScene();
      sceneObserver.disconnect();
    }
  },
  { rootMargin: "120px" },
);
sceneObserver.observe(stage);
// Cada acabamento atualiza o material 3D e a paleta global do site.
for (const button of document.querySelectorAll(".material-swatch")) {
  button.addEventListener("click", () => {
    selectedColor = button.dataset.color;
    root.dataset.finish = button.dataset.finish;
    for (const swatch of document.querySelectorAll(".material-swatch"))
      swatch.setAttribute("aria-pressed", String(swatch === button));
    colorName.textContent = button.dataset.colorName;
    heroCanvas.setAttribute(
      "aria-label",
      `Modelo 3D do dragão com acabamento ${button.dataset.colorName.toLowerCase()}. Use as setas para girar e Home para voltar à vista inicial.`,
    );
    if (scene) scene.setColor(selectedColor);
  });
}

// Reproduz o filme sem áudio e pausa fora da tela para poupar recursos.
const video = document.getElementById("brand-film");
const videoFrame = document.querySelector(".film-frame");
const filmLoading = document.querySelector(".film-loading");
video.muted = true;
video.defaultMuted = true;
video.volume = 0;
let videoLoaded = false,
  hasStarted = false,
  userPaused = false,
  videoInView = false;
const shouldAutoPlayVideo = () =>
  videoInView &&
  !userPaused &&
  !document.hidden &&
  !reducedMotion.matches &&
  !navigator.connection?.saveData;
function loadVideo() {
  if (videoLoaded) return;
  video.src = video.dataset.src;
  video.preload = "metadata";
  video.load();
  videoLoaded = true;
}
function reflectVideo() {
  const playing = !video.paused && !video.ended;
  video.setAttribute("aria-pressed", String(playing));
  if (hasStarted) filmLoading.hidden = true;
}
async function playVideo() {
  loadVideo();
  try {
    await video.play();
    hasStarted = true;
    reflectVideo();
  } catch {
    reflectVideo();
  }
}
function toggleVideo() {
  if (!video.paused && !video.ended) {
    userPaused = true;
    video.pause();
  } else {
    userPaused = false;
    if (video.ended) video.currentTime = 0;
    playVideo();
  }
}
video.addEventListener("click", toggleVideo);
video.addEventListener("keydown", (event) => {
  if (event.key === " " || event.key === "Enter") {
    event.preventDefault();
    toggleVideo();
  }
});
for (const event of ["play", "pause", "ended"])
  video.addEventListener(event, reflectVideo);
video.addEventListener("error", () => {
  filmLoading.hidden = false;
  filmLoading.querySelector("small").textContent =
    "Não foi possível carregar o filme. Clique ou toque no vídeo para tentar novamente.";
  videoLoaded = false;
});
const videoObserver = new IntersectionObserver(
  ([entry]) => {
    videoInView = entry.isIntersecting && entry.intersectionRatio >= 0.45;
    if (videoInView) {
      if (shouldAutoPlayVideo()) playVideo();
    } else if (!video.paused) video.pause();
  },
  { threshold: [0, 0.45] },
);
videoObserver.observe(videoFrame);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) video.pause();
  else if (shouldAutoPlayVideo()) playVideo();
});
reducedMotion.addEventListener("change", () => {
  if (reducedMotion.matches) video.pause();
  else if (shouldAutoPlayVideo()) playVideo();
});
