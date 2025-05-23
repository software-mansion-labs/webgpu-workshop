import tgpu from 'typegpu';
import * as d from 'typegpu/data';
import { div, add, mix } from 'typegpu/std';
import { getWebGPUContext, noise } from './utils/utils';

export async function init() {
  const { root, context, presentationFormat, width, height } = await getWebGPUContext();

  // TODO: implement

  function frame() {
    // TODO: render loop
    requestAnimationFrame(frame);
  }
  frame();
}
