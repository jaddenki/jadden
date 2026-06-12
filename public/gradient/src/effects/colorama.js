import { state } from '../state.js';
import { hexToRgb } from '../color.js';

export function applyColorama(imageData) {
  if (!state.colorama.on || state.colorama.stops.length < 2) return imageData;

  const stops = [...state.colorama.stops]
    .sort((a, b) => a.t - b.t)
    .map((s) => ({ t: s.t, rgb: hexToRgb(s.color) }));

  const d = imageData.data;
  for (let i = 0; i < d.length; i += 4) {
    const lum = (d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114) / 255;
    let a = stops[0];
    let b = stops[stops.length - 1];
    for (let k = 0; k < stops.length - 1; k++) {
      if (lum >= stops[k].t && lum <= stops[k + 1].t) {
        a = stops[k];
        b = stops[k + 1];
        break;
      }
    }
    const span = b.t - a.t || 1;
    const t = Math.max(0, Math.min(1, (lum - a.t) / span));
    d[i] = a.rgb[0] + (b.rgb[0] - a.rgb[0]) * t;
    d[i + 1] = a.rgb[1] + (b.rgb[1] - a.rgb[1]) * t;
    d[i + 2] = a.rgb[2] + (b.rgb[2] - a.rgb[2]) * t;
  }
  return imageData;
}
