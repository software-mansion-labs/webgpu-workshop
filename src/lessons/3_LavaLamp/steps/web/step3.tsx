import tgpu from 'typegpu';
import * as d from 'typegpu/data';
import { div, mix, mul } from 'typegpu/std';
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

  const timeUniform = root['~unstable'].createUniform(d.f32, 0);

  const mainFragment = tgpu['~unstable'].fragmentFn({
    in: { pos: d.builtin.position },
    out: d.vec4f,
  })((input) => {
    const uv = div(input.pos.xy, mul(d.vec2f(width, height), 0.2));
    const time = timeUniform.value;
    const n = sharpen(perlin3d.sample(d.vec3f(uv, time)));
    const color = mix(
      div(d.vec4f(153, 0, 105, 255), 255),
      div(d.vec4f(255, 140, 26, 255), 255),
      n * 0.5 + 0.5,
    );
    return color;
  });

  const pipeline = root['~unstable']
    .withVertex(fullScreenTriangle, {})
    .withFragment(mainFragment, { format: presentationFormat })
    .createPipeline();

  function frame() {
    timeUniform.write(performance.now() * 0.0002 % 10);
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
