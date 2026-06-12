import { state } from '../state.js';

function blendPixel(mode, base, blend) {
  const b = base / 255;
  const n = blend / 255;
  let r;
  switch (mode) {
    case 'overlay':
      r = b < 0.5 ? 2 * b * n : 1 - 2 * (1 - b) * (1 - n);
      break;
    case 'screen':
      r = 1 - (1 - b) * (1 - n);
      break;
    case 'multiply':
      r = b * n;
      break;
    case 'soft-light':
      r = b < 0.5
        ? 2 * b * n + b * b * (1 - 2 * n)
        : 2 * b * (1 - n) + Math.sqrt(b) * (2 * n - 1);
      break;
    default:
      r = n;
  }
  return Math.max(0, Math.min(255, r * 255));
}

export function applyNoise(imageData) {
  if (!state.noise.on) return imageData;
  const d = imageData.data;
  let s = state.noise.seed;
  const rng = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
  const intensity = state.noise.intensity / 100;
  const mode = state.noise.blend;
  for (let i = 0; i < d.length; i += 4) {
    const grain = (rng() * 256) | 0;
    d[i] = blendPixel(mode, d[i], grain) * intensity + d[i] * (1 - intensity);
    d[i + 1] = blendPixel(mode, d[i + 1], grain) * intensity + d[i + 1] * (1 - intensity);
    d[i + 2] = blendPixel(mode, d[i + 2], grain) * intensity + d[i + 2] * (1 - intensity);
  }
  return imageData;
}
