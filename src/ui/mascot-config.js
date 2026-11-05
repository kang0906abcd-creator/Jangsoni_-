import walkSource from '../../assets/mascot/runtime/walk.webp';

export const mascotAtlas = {
  src: walkSource,
  stand: [0, 0, 512, 512],
  walk: [1, 2, 3, 4, 5].map(cell => [(cell % 3) * 512, Math.floor(cell / 3) * 512, 512, 512])
};
