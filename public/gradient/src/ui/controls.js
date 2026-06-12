import { state, images } from '../state.js';
import { initGrid } from '../mesh.js';
import { randomVividHex, hslToHex } from '../color.js';
import { scheduleRender } from '../render.js';
import { bindRange, bindCheck } from './bindings.js';

export function initControls() {
  // Mesh
  document.getElementById('applyGrid').onclick = () => {
    const cols = clamp(parseInt(document.getElementById('gridCols').value) || 4, 2, 10);
    const rows = clamp(parseInt(document.getElementById('gridRows').value) || 4, 2, 10);
    initGrid(cols, rows);
    scheduleRender();
  };
  document.getElementById('randomizeColors').onclick = () => {
    state.points.forEach((p) => { p.color = randomVividHex(); });
    scheduleRender();
  };
  document.getElementById('addPoint').onclick = () => {
    state.points.push({ x: 0.5, y: 0.5, color: hslToHex(Math.random() * 360, 70, 55) });
    scheduleRender();
  };
  bindRange('falloff', 'falloffVal', state, 'falloff');

  // Blur
  bindCheck('blurOn', state.blur, 'on');
  bindRange('blurRadius', 'blurRadiusVal', state.blur, 'radius', parseInt);

  // Distortion
  bindCheck('distOn', state.distortion, 'on');
  bindRange('distAmpX', 'distAmpXVal', state.distortion, 'ampX', parseInt);
  bindRange('distAmpY', 'distAmpYVal', state.distortion, 'ampY', parseInt);
  bindRange('distFreqX', 'distFreqXVal', state.distortion, 'freqX');
  bindRange('distFreqY', 'distFreqYVal', state.distortion, 'freqY');

  // Displacement
  bindCheck('dispOn', state.disp, 'on');
  bindRange('dispStrengthX', 'dispStrengthXVal', state.disp, 'strengthX', parseInt);
  bindRange('dispStrengthY', 'dispStrengthYVal', state.disp, 'strengthY', parseInt);
  document.getElementById('dispFile').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      images.displacement = img;
      document.getElementById('dispThumb').src = url;
      scheduleRender();
    };
    img.src = url;
  });

  // Colorama
  bindCheck('coloramaOn', state.colorama, 'on');

  // Noise
  bindCheck('noiseOn', state.noise, 'on');
  bindRange('noiseIntensity', 'noiseIntensityVal', state.noise, 'intensity', parseInt);
  document.getElementById('noiseBlend').addEventListener('change', (e) => {
    state.noise.blend = e.target.value;
    scheduleRender();
  });
  document.getElementById('reseedNoise').onclick = () => {
    state.noise.seed = Math.floor(Math.random() * 1e9);
    scheduleRender();
  };
}

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}
