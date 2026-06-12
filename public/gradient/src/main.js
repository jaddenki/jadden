import { images } from './state.js';
import { initGrid } from './mesh.js';
import { initRenderer, scheduleRender } from './render.js';
import { initInteraction } from './interaction.js';
import { initSections } from './ui/sections.js';
import { initRamp } from './ui/ramp.js';
import { initControls } from './ui/controls.js';
import { initExport } from './export.js';
import { pixelFill } from './ui/pixel-fill.js';
import { DEFAULT_DISPLACEMENT_URL } from './displacement-default.js';

const DEFAULT_COLS = 2;
const DEFAULT_ROWS = 4;

function loadDefaultDisplacement() {
  const img = new Image();
  img.onload = () => {
    images.displacement = img;
    const thumb = document.getElementById('dispThumb');
    if (thumb) thumb.src = img.src;
    scheduleRender();
  };
  img.onerror = () => scheduleRender();
  img.src = DEFAULT_DISPLACEMENT_URL;
}

function main() {
  initRenderer({
    outputCanvas: document.getElementById('output'),
    interactionCanvas: document.getElementById('interaction'),
  });
  initInteraction({
    interactionCanvas: document.getElementById('interaction'),
    colorPicker: document.getElementById('hiddenColor'),
  });
  initSections();
  initRamp({
    container: document.getElementById('ramp'),
    addStopButton: document.getElementById('addStop'),
  });
  initControls();
  initExport();
  pixelFill(document.getElementById('exportBtn'));

  initGrid(DEFAULT_COLS, DEFAULT_ROWS);
  loadDefaultDisplacement();
  scheduleRender();
}

main();
