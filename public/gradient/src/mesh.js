import { state } from './state.js';
import { hexToRgb, randomVividHex } from './color.js';

export function initGrid(cols, rows) {
  state.points = [];
  const jx = 0.45 / (cols - 1);
  const jy = 0.45 / (rows - 1);
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      let x = i / (cols - 1);
      let y = j / (rows - 1);
      const edgeX = i === 0 || i === cols - 1;
      const edgeY = j === 0 || j === rows - 1;
      if (!edgeX) x += (Math.random() * 2 - 1) * jx;
      if (!edgeY) y += (Math.random() * 2 - 1) * jy;
      state.points.push({
        x: Math.max(0, Math.min(1, x)),
        y: Math.max(0, Math.min(1, y)),
        color: randomVividHex(),
      });
    }
  }
}

export function renderGradientTo(ctx, w, h) {
  const img = ctx.createImageData(w, h);
  const data = img.data;
  const pts = state.points;
  const n = pts.length;
  const rgbs = pts.map((p) => hexToRgb(p.color));
  const pxs = pts.map((p) => p.x * w);
  const pys = pts.map((p) => p.y * h);
  const power = state.falloff;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let r = 0, g = 0, b = 0, wsum = 0, exact = -1;
      for (let k = 0; k < n; k++) {
        const dx = x - pxs[k];
        const dy = y - pys[k];
        const d2 = dx * dx + dy * dy;
        if (d2 < 0.5) { exact = k; break; }
        const ww = 1 / Math.pow(d2, power / 2);
        wsum += ww;
        r += rgbs[k][0] * ww;
        g += rgbs[k][1] * ww;
        b += rgbs[k][2] * ww;
      }
      const idx = (y * w + x) * 4;
      if (exact >= 0) {
        data[idx] = rgbs[exact][0];
        data[idx + 1] = rgbs[exact][1];
        data[idx + 2] = rgbs[exact][2];
      } else {
        data[idx] = r / wsum;
        data[idx + 1] = g / wsum;
        data[idx + 2] = b / wsum;
      }
      data[idx + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
}
