export function initSections(root = document) {
  root.querySelectorAll('[data-section]').forEach((sec) => {
    const head = sec.querySelector('.section-head');
    head.addEventListener('click', () => sec.classList.toggle('open'));
  });
}
