// Preserva o details nativo e anima a altura ao abrir ou fechar a resposta.
export function initFaq() {
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

  for (const details of document.querySelectorAll('.faq-list details')) {
    const summary = details.querySelector('summary');
    const answer = details.querySelector('p');
    let animation = null;
    let fade = null;
    let expanded = details.open;

    summary.addEventListener('click', (event) => {
      event.preventDefault();
      expanded = !expanded;
      const startHeight = details.getBoundingClientRect().height;
      const startOpacity = details.open ? getComputedStyle(answer).opacity : 0;
      animation?.cancel();
      fade?.cancel();

      if (reducedMotion.matches || !details.animate) {
        details.open = expanded;
        details.style.removeProperty('height');
        details.style.removeProperty('overflow');
        return;
      }

      // Mantém o conteúdo disponível até a animação de fechamento terminar.
      details.open = true;
      details.style.height = 'auto';
      const border = details.getBoundingClientRect().height - details.clientHeight;
      const endHeight = expanded
        ? details.getBoundingClientRect().height
        : summary.getBoundingClientRect().height + border;
      details.style.height = `${startHeight}px`;
      details.style.overflow = 'hidden';
      const options = { duration: 320, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' };
      animation = details.animate(
        { height: [`${startHeight}px`, `${endHeight}px`] },
        options,
      );
      fade = answer.animate(
        { opacity: [startOpacity, expanded ? 1 : 0] },
        options,
      );
      details.dataset.expanded = String(expanded);
      animation.onfinish = () => {
        details.open = expanded;
        details.style.removeProperty('height');
        details.style.removeProperty('overflow');
        animation = null;
        fade = null;
      };
    });
  }
}
