// Animated pixel-dither hover effect for a button.
export function pixelFill(btn, { color = '#dbf530', pixelSize = 8, stepMs = 10 } = {}) {
  const textSpan = document.createElement('span');
  textSpan.className = '__pf-text';
  textSpan.textContent = btn.textContent;
  btn.textContent = '';
  btn.appendChild(textSpan);

  const overlay = document.createElement('span');
  overlay.className = '__pf-overlay';
  btn.appendChild(overlay);

  let cells = [];
  let timers = [];
  let built = false;

  const build = () => {
    overlay.innerHTML = '';
    cells = [];
    const { width, height } = btn.getBoundingClientRect();
    const cols = Math.ceil(width / pixelSize);
    const rows = Math.ceil(height / pixelSize);
    overlay.style.cssText = 'position:absolute;inset:0;pointer-events:none;';
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cell = document.createElement('span');
        cell.style.cssText =
          `position:absolute;width:${pixelSize}px;height:${pixelSize}px;` +
          `left:${c * pixelSize}px;top:${r * pixelSize}px;background:${color};opacity:0;`;
        overlay.appendChild(cell);
        cells.push(cell);
      }
    }
    built = true;
  };

  const shuffle = (arr) => {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = (Math.random() * (i + 1)) | 0;
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  const clearTimers = () => {
    timers.forEach(clearTimeout);
    timers = [];
  };

  const animateTo = (opacity) => {
    clearTimers();
    const order = shuffle([...Array(cells.length).keys()]);
    order.forEach((idx, i) => {
      timers.push(setTimeout(() => { cells[idx].style.opacity = opacity; }, i * stepMs));
    });
  };

  btn.addEventListener('mouseenter', () => {
    if (!built) build();
    animateTo('1');
  });
  btn.addEventListener('mouseleave', () => animateTo('0'));

  const ro = new ResizeObserver(() => {
    built = false;
    build();
  });
  ro.observe(btn);
}
