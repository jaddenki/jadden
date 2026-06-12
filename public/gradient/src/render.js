import { state, PREVIEW_W, PREVIEW_H } from './state.js';
import { renderPipeline } from './pipeline.js';

let outCtx = null;
let intCtx = null;
let scheduled = false;

export function initRenderer({ outputCanvas, interactionCanvas }) {
  outCtx = outputCanvas.getContext('2d');
  intCtx = interactionCanvas.getContext('2d');
}

export function scheduleRender() {
  if (scheduled || !outCtx) return;
  scheduled = true;
  requestAnimationFrame(() => {
    scheduled = false;
    renderPipeline(outCtx, PREVIEW_W, PREVIEW_H);
    drawInteraction();
  });
}

function drawInteraction() {
  intCtx.clearRect(0, 0, PREVIEW_W, PREVIEW_H);
  for (const p of state.points) {
    const x = p.x * PREVIEW_W;
    const y = p.y * PREVIEW_H;
    intCtx.beginPath();
    intCtx.arc(x, y, 7, 0, Math.PI * 2);
    intCtx.fillStyle = p.color;
    intCtx.fill();
    intCtx.lineWidth = 2;
    intCtx.strokeStyle = '#000';
    intCtx.stroke();
    intCtx.lineWidth = 1;
    intCtx.strokeStyle = '#fff';
    intCtx.stroke();
  }
}
