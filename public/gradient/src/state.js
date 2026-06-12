export const PREVIEW_W = 900;
export const PREVIEW_H = 600;

export const state = {
  points: [],
  falloff: 2.5,
  blur: { on: false, radius: 8 },
  distortion: { on: true, ampX: 20, ampY: 20, freqX: 1.5, freqY: 1.5 },
  disp: { on: true, strengthX: 40, strengthY: 40 },
  colorama: {
    on: true,
    stops: [
      { t: 0.43, color: '#0a0033' },
      { t: 0.53, color: '#5cdd1e' },
      { t: 0.68, color: '#f0f5a8' },
    ],
  },
  noise: { on: true, intensity: 13, blend: 'overlay', seed: Math.floor(Math.random() * 1e9) },
};

export const images = {
  displacement: null,
};
