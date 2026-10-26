// O controle nativo oferece arraste, toque e navegação pelo teclado.
export function initComparisons() {
  for (const frame of document.querySelectorAll("[data-comparison]")) {
    const slider = frame.querySelector(".comparison-range");
    const update = () => {
      const value = Math.max(0, Math.min(100, Number(slider.value)));
      frame.style.setProperty("--comparison", `${value}%`);
      slider.setAttribute(
        "aria-valuetext",
        `${value}% antes e ${100 - value}% depois`,
      );
    };
    slider.addEventListener("input", update);
    update();
  }
}
