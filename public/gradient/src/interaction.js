import { state, PREVIEW_W, PREVIEW_H } from './state.js';
import { scheduleRender } from './render.js';

const HIT_RADIUS_PX = 11;

export function initInteraction({ interactionCanvas, colorPicker }) {
  let dragIdx = -1;
  let didDrag = false;

  const hitTest = (x, y) => {
    for (let i = state.points.length - 1; i >= 0; i--) {
      const px = state.points[i].x * PREVIEW_W;
      const py = state.points[i].y * PREVIEW_H;
      const dx = x - px;
      const dy = y - py;
      if (dx * dx + dy * dy <= HIT_RADIUS_PX * HIT_RADIUS_PX) return i;
    }
    return -1;
  };

  const canvasCoords = (e) => {
    const r = interactionCanvas.getBoundingClientRect();
    return {
      x: (e.clientX - r.left) * (PREVIEW_W / r.width),
      y: (e.clientY - r.top) * (PREVIEW_H / r.height),
    };
  };

  interactionCanvas.addEventListener('mousedown', (e) => {
    if (e.button === 2) return;
    const { x, y } = canvasCoords(e);
    dragIdx = hitTest(x, y);
    didDrag = false;
  });

  window.addEventListener('mousemove', (e) => {
    if (dragIdx < 0) return;
    const { x, y } = canvasCoords(e);
    state.points[dragIdx].x = Math.max(0, Math.min(1, x / PREVIEW_W));
    state.points[dragIdx].y = Math.max(0, Math.min(1, y / PREVIEW_H));
    didDrag = true;
    scheduleRender();
  });

  window.addEventListener('mouseup', () => {
    if (dragIdx >= 0 && !didDrag) {
      const idx = dragIdx;
      colorPicker.value = state.points[idx].color;
      colorPicker.oninput = () => {
        state.points[idx].color = colorPicker.value;
        scheduleRender();
      };
      colorPicker.click();
    }
    dragIdx = -1;
  });

  interactionCanvas.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    const { x, y } = canvasCoords(e);
    const idx = hitTest(x, y);
    if (idx >= 0 && state.points.length > 2) {
      state.points.splice(idx, 1);
      scheduleRender();
    }
  });
}
