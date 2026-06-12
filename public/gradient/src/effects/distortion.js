import { state } from '../state.js';

const TAU = Math.PI * 2;

export function applyDistortion(srcImageData, w, h) {
  if (!state.distortion.on) return srcImageData;
  const { ampX, ampY, freqX, freqY } = state.distortion;
  const sd = srcImageData.data;
  const out = new ImageData(w, h);
  const od = out.data;

  for (let y = 0; y < h; y++) {
    const phaseY = TAU * freqX * (y / h);
    const dx = ampX * Math.sin(phaseY);
    for (let x = 0; x < w; x++) {
      const di = (y * w + x) * 4;
      const dy = ampY * Math.sin(TAU * freqY * (x / w));
      let sx = Math.round(x + dx);
      let sy = Math.round(y + dy);
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
