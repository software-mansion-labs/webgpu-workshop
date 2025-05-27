import tgpu from 'typegpu';
import * as d from 'typegpu/data';
import { div, min, mix } from 'typegpu/std';
import { perlin3d } from '@typegpu/noise';
import { getWebGPUContext, sharpen } from './utils/utils';

export async function init() {
  const { root, context, presentationFormat, width, height } = await getWebGPUContext();

  const fullScreenTriangle = tgpu['~unstable'].vertexFn({
    in: { idx: d.builtin.vertexIndex },
    out: { pos: d.builtin.position },
  })((input) => {
    const pos = [d.vec2f(-1, -1), d.vec2f(3, -1), d.vec2f(-1, 3)];

    return {
      pos: d.vec4f(pos[input.idx], 0, 1),
    };
  });

  const mainFragment = tgpu['~unstable'].fragmentFn({
    in: { pos: d.builtin.position },
    out: d.vec4f,
  })((input) => {
    const minDim = d.f32(min(width, height));
    const uv = div(input.pos.xy, minDim * 0.2);
    const n = uv.x;
    return d.vec4f(n, n, n, 1);
  });

  const pipeline = root['~unstable']
    .withVertex(fullScreenTriangle, {})
    .withFragment(mainFragment, { format: presentationFormat })
    .createPipeline();

  function frame() {
    pipeline
      .withColorAttachment({
        view: context.getCurrentTexture().createView(),
        loadOp: 'clear',
        storeOp: 'store',
      })
      .draw(3);

    requestAnimationFrame(frame);
  }
  frame();
}
