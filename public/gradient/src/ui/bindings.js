import { scheduleRender } from '../render.js';

export function bindRange(id, valId, target, key, parse = parseFloat) {
  const el = document.getElementById(id);
  const v = valId ? document.getElementById(valId) : null;
  el.addEventListener('input', () => {
    target[key] = parse(el.value);
    if (v) v.textContent = el.value;
    scheduleRender();
  });
}

export function bindCheck(id, target, key) {
  document.getElementById(id).addEventListener('change', (e) => {
    target[key] = e.target.checked;
    scheduleRender();
  });
}
