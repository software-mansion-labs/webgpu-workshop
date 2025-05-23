import tgpu from 'typegpu';
import * as d from 'typegpu/data';
import { div, add, mix } from 'typegpu/std';
import { getWebGPUContext, noise } from './utils/utils';

export async function init() {
  const { root, context, presentationFormat, width, height } = await getWebGPUContext();

  const mainVertex = tgpu['~unstable'].vertexFn({
    in: { vertexIndex: d.builtin.vertexIndex },
    out: { outPos: d.builtin.position },
  })((input) => {
    const pos = [
      d.vec2f(-1.0, -1.0),
      d.vec2f(1.0, -1.0),
      d.vec2f(-1.0, 1.0),
      d.vec2f(-1.0, 1.0),
      d.vec2f(1.0, -1.0),
      d.vec2f(1.0, 1.0),
    ];
    return {
      outPos: d.vec4f(pos[input.vertexIndex], 0.0, 1.0),
    };
  });

  const mainFragment = tgpu['~unstable'].fragmentFn({
    in: { pos: d.builtin.position },
    out: d.vec4f,
  })((input) => {
    const uv = div(input.pos.xy, d.vec2f(width, height));
    const n = uv.x;
    return d.vec4f(n, n, n, 1);
  });

  const pipeline = root['~unstable']
    .withVertex(mainVertex, {})
    .withFragment(mainFragment, { format: presentationFormat })
    .createPipeline();

  const bindGroupLayout = tgpu.bindGroupLayout({});
  const bindGroup = root.createBindGroup(bindGroupLayout, {});

  function frame() {
    pipeline
      .withColorAttachment({
        view: context.getCurrentTexture().createView(),
        clearValue: [0, 0, 0, 0],
        loadOp: 'clear',
        storeOp: 'store',
      })
      .with(bindGroupLayout, bindGroup)
      .draw(6);

    requestAnimationFrame(frame);
  }
  frame();
}
