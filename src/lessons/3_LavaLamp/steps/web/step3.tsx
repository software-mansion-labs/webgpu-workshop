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

  const timeUniform = root.createBuffer(d.f32, 0).$usage('uniform');
  const bindGroupLayout = tgpu.bindGroupLayout({
    time: { uniform: d.f32 },
  });
  const bindGroup = root.createBindGroup(bindGroupLayout, {
    time: timeUniform,
  });

  const mainFragment = tgpu['~unstable'].fragmentFn({
    in: { pos: d.builtin.position },
    out: d.vec4f,
  })((input) => {
    const uv = div(input.pos.xy, d.vec2f(width * 0.4, height * 0.4));
    const time = bindGroupLayout.$.time;
    const p = add(uv, div(d.vec2f(time, time), 3000));
    const n = noise(p);
    const color = mix(
      div(d.vec4f(153, 0, 105, 255), 255),
      div(d.vec4f(255, 140, 26, 255), 255),
      n * 0.5 + 0.5,
    );
    return color;
  }).$uses({ noise });

  const pipeline = root['~unstable']
    .withVertex(mainVertex, {})
    .withFragment(mainFragment, { format: presentationFormat })
    .createPipeline();

  function frame() {
    timeUniform.write(performance.now());
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
