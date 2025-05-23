export const config = {
  brushSize: 10,
  brushStyle: 0,
  brushColor: [255, 0, 0, 255],
  sync: () => {},
}

export function setBrushStyle(style: string) {
  switch (style) {
    case 'circle':
      config.brushStyle = 0;
      break;
    case 'spray':
      config.brushStyle = 1;
      break;
    case 'rainbow':
      config.brushStyle = 2;
      break;
    default:
      config.brushStyle = 0;
      break;
  }
  config.sync();
}

export function setBrushColor(color: Array<number>) {
  config.brushColor = [color[0] / 255, color[1] / 255, color[2] / 255, color[3] / 255];
  config.sync();
}

export function changeBrushSize(size: number) {
  config.brushSize = Math.max(config.brushSize + size, 0);
  config.sync();
}

export function initGestures(
  callback: (x: number, y: number) => void, 
  canvas: HTMLCanvasElement,
  onEnd?: () => void
) {
  let isDrawing = false;
  canvas.addEventListener('mousedown', (e) => {
    isDrawing = true;
    callback(e.clientX, e.clientY);
  });

  canvas.addEventListener('mousemove', (e) => {
    if (isDrawing) {
      callback(e.clientX, e.clientY);
    }
  });

  canvas.addEventListener('mouseup', () => {
    isDrawing = false;
    if (onEnd) {
      onEnd();
    }
  });
}