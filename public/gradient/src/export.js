import { renderPipeline } from './pipeline.js';

const MIN = 64;
const MAX = 8192;

export function initExport() {
  const exportW = document.getElementById('exportW');
  const exportH = document.getElementById('exportH');

  document.getElementById('exportPreset').addEventListener('change', (e) => {
    if (!e.target.value) return;
    const [w, h] = e.target.value.split('x').map(Number);
    exportW.value = w;
    exportH.value = h;
  });

  document.getElementById('exportBtn').onclick = () => {
    const w = clamp(parseInt(exportW.value) || 1920, MIN, MAX);
    const h = clamp(parseInt(exportH.value) || 1080, MIN, MAX);
    const out = document.createElement('canvas');
    out.width = w;
    out.height = h;
    renderPipeline(out.getContext('2d'), w, h);
    const link = document.createElement('a');
    link.download = `mesh-gradient-${w}x${h}.png`;
    link.href = out.toDataURL('image/png');
    link.click();
  };
}

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}
