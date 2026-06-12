import { state } from '../state.js';
import { scheduleRender } from '../render.js';

let rampEl = null;

export function initRamp({ container, addStopButton }) {
  rampEl = container;
  addStopButton.addEventListener('click', () => {
    state.colorama.stops.push({ t: 0.5, color: '#888888' });
    renderRamp();
    scheduleRender();
  });
  renderRamp();
}

export function renderRamp() {
  rampEl.innerHTML = '';
  state.colorama.stops.forEach((stop, i) => {
    const row = document.createElement('div');
    row.className = 'ramp-stop';

    const color = document.createElement('input');
    color.type = 'color';
    color.value = stop.color;
    color.oninput = () => {
      stop.color = color.value;
      scheduleRender();
    };

    const range = document.createElement('input');
    range.type = 'range';
    range.min = 0;
    range.max = 100;
    range.value = Math.round(stop.t * 100);
    range.style.flex = '1';

    const val = document.createElement('span');
    val.className = 'val';
    val.textContent = Math.round(stop.t * 100);

    range.oninput = () => {
      stop.t = range.value / 100;
      val.textContent = range.value;
      scheduleRender();
    };

    const del = document.createElement('button');
    del.className = 'icon';
    del.textContent = '×';
    del.onclick = () => {
      if (state.colorama.stops.length > 2) {
        state.colorama.stops.splice(i, 1);
        renderRamp();
        scheduleRender();
      }
    };

    row.append(color, range, val, del);
    rampEl.appendChild(row);
  });
}
