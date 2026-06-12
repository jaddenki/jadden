import { state } from './state.js';
import { renderGradientTo } from './mesh.js';
import { applyDisplacement } from './effects/displacement.js';
import { applyDistortion } from './effects/distortion.js';
import { applyColorama } from './effects/colorama.js';
import { applyNoise } from './effects/noise.js';

// Pipeline order: gradient → displacement → distortion → blur → noise → colorama.
export function renderPipeline(targetCtx, w, h) {
  const work = document.createElement('canvas');
  work.width = w;
  work.height = h;
  const wctx = work.getContext('2d');

  renderGradientTo(wctx, w, h);
  let data = wctx.getImageData(0, 0, w, h);
  data = applyDisplacement(data, w, h);
  data = applyDistortion(data, w, h);
  wctx.putImageData(data, 0, 0);

  targetCtx.clearRect(0, 0, w, h);
  if (state.blur.on && state.blur.radius > 0) {
    targetCtx.filter = `blur(${state.blur.radius}px)`;
    targetCtx.drawImage(work, 0, 0);
    targetCtx.filter = 'none';
  } else {
    targetCtx.drawImage(work, 0, 0);
  }

  let final = targetCtx.getImageData(0, 0, w, h);
  final = applyNoise(final);
  final = applyColorama(final);
  targetCtx.putImageData(final, 0, 0);
}
