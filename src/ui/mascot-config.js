import walkSource from '../../assets/mascot/runtime/walk.webp';

// Local nose positions measured in the six rendered tiles of walk.webp.
const noseX = [332, 322, 321, 333, 323, 322];
const cellSize = 512;
const frames = noseX.map((x, cell) => [
  (cell % 3) * cellSize + x - noseX[0],
  Math.floor(cell / 3) * cellSize,
  cellSize,
  cellSize,
]);

export const mascotAtlas = {
  src: walkSource,
  stand: frames[0],
  walk: frames.slice(1),
};
