import { state, images } from '../state.js';

export function applyDisplacement(srcImageData, w, h) {
  if (!state.disp.on || !images.displacement) return srcImageData;

  const scratch = document.createElement('canvas');
  scratch.width = w;
  scratch.height = h;
  const sctx = scratch.getContext('2d');
  sctx.drawImage(images.displacement, 0, 0, w, h);
  const dd = sctx.getImageData(0, 0, w, h).data;

  const sd = srcImageData.data;
  const out = new ImageData(w, h);
  const od = out.data;
  const ampX = state.disp.strengthX;
  const ampY = state.disp.strengthY;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const di = (y * w + x) * 4;
      const lum = (dd[di] * 0.299 + dd[di + 1] * 0.587 + dd[di + 2] * 0.114) / 255;
      const sig = (lum - 0.5) * 2;
      let sx = Math.round(x + sig * ampX);
      let sy = Math.round(y + sig * ampY);
      if (sx < 0) sx = 0;
      else if (sx >= w) sx = w - 1;
      if (sy < 0) sy = 0;
      else if (sy >= h) sy = h - 1;
      const si = (sy * w + sx) * 4;
      od[di] = sd[si];
      od[di + 1] = sd[si + 1];
      od[di + 2] = sd[si + 2];
      od[di + 3] = 255;
    }
  }
  return out;
}
