import { runOnUI } from 'react-native-reanimated';
import { requireUI } from 'react-native-webgpu-worklets';
import { CanvasRef } from 'react-native-wgpu';
import tgpu from 'typegpu';
tgpu;

export async function init(ref: React.RefObject<CanvasRef>) {

  const context = ref.current!.getContext("webgpu")!;
  const canvas = context.canvas as any;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  canvas.width = width;
  canvas.height = height;
  const adapter = await navigator.gpu.requestAdapter();
  const device = await adapter?.requestDevice()!;

runOnUI(() => {
  'worklet';
  const tgpu = requireUI('typegpu').default;
  const { abs, div, min, mix, pow, sign } = requireUI('typegpu/std');
  const d = requireUI('typegpu/data');
  const { perlin3d } = requireUI('typegpu/noise');

  const presentationFormat = navigator.gpu.getPreferredCanvasFormat();
  tgpu.initFromDevice({ device });
  const root = tgpu.initFromDevice({ device })
  context.configure({
    device: root.device,
    format: presentationFormat,
    alphaMode: 'premultiplied',
  });

  const sharpen = tgpu['~unstable'].fn([d.f32], d.f32)((value) => {
    return sign(value) * pow(abs(value), 0.6);
  });

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
    const minDim = d.f32(min(width, height));
    const uv = div(input.pos.xy, minDim * 0.2);
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
    context.present();
    requestAnimationFrame(frame);
  }
  frame();
})();
}
