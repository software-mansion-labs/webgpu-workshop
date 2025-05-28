import tgpu from 'typegpu';
import * as d from 'typegpu/data';
import { abs, pow, sign } from 'typegpu/std';

export const sharpen = tgpu['~unstable'].fn([d.f32], d.f32)((value) => {
  return sign(value) * pow(abs(value), 0.6);
});

export async function getWebGPUContext() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const presentationFormat = navigator.gpu.getPreferredCanvasFormat();
  const canvas = document.querySelector('canvas') as HTMLCanvasElement;
  const context = canvas.getContext('webgpu') as GPUCanvasContext;
  canvas.width = width;
  canvas.height = height;

  const root = await tgpu.init();

  context.configure({
    device: root.device,
    format: presentationFormat,
    alphaMode: 'premultiplied',
  });

  return { root, context, presentationFormat, width, height };
}
