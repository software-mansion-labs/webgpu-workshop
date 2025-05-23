import { CanvasRef } from 'react-native-wgpu';
import { runOnUI } from 'react-native-reanimated';
import { requireUI, runOnBackground } from 'react-native-webgpu-worklets';
import tgpu from 'typegpu';
import * as d from 'typegpu/data';
import { add, div, mix } from 'typegpu/std';

export async function init(ref: React.RefObject<CanvasRef>) {

  const width = window.innerWidth;
  const height = window.innerHeight;
  const canvas = document.querySelector('canvas') as HTMLCanvasElement;
  const context = canvas.getContext('webgpu') as GPUCanvasContext;
  canvas.width = width;
  canvas.height = height;
  const adapter = await navigator.gpu.requestAdapter();
  const device = await adapter?.requestDevice()!;

  const presentationFormat = navigator.gpu.getPreferredCanvasFormat();
  tgpu.initFromDevice({ device });
  const root = tgpu.initFromDevice({ device })
  context.configure({
    device: root.device,
    format: presentationFormat,
    alphaMode: 'premultiplied',
  });
  const hash = tgpu['~unstable'].fn([d.vec2f], d.f32)(
    /* wgsl */ `(p: vec2<i32>) -> f32 {
      let n = p.x + p.y * 57;
      let f = f32((n << 13) ^ n);
      return fract(sin(f) * 43758.5453);
    }`,
  );
  const lerp = tgpu['~unstable'].fn([d.f32, d.f32, d.f32], d.f32)(
    /* wgsl */ `(a: f32, b: f32, t: f32) -> f32 {
      return a + t * (b - a);
    }`,
  );
  const fade = tgpu['~unstable'].fn([d.f32], d.f32)(
    /* wgsl */ `(t: vec2<f32>) -> vec2<f32> {
      return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
    }`,
  );
  const grad = tgpu['~unstable'].fn([d.f32], d.f32)(
    /* wgsl */ `(p: vec2<i32>) -> vec2<f32> {
      let h = hash(p) * 4.0;
      let angle = 6.2831853 * fract(h); // 2π * hash
      return vec2<f32>(cos(angle), sin(angle));
    }`,
  ).$uses({ hash });
  const noise = tgpu['~unstable'].fn([d.vec2f], d.f32)(
    /* wgsl */ `(p: vec2<f32>) -> f32 {
      let pi = vec2<i32>(floor(p));
      let pf = fract(p);
      let w = fade(pf);

      let a = grad(pi + vec2<i32>(0, 0));
      let b = grad(pi + vec2<i32>(1, 0));
      let c = grad(pi + vec2<i32>(0, 1));
      let d = grad(pi + vec2<i32>(1, 1));

      let va = dot(a, pf - vec2(0.0, 0.0));
      let vb = dot(b, pf - vec2(1.0, 0.0));
      let vc = dot(c, pf - vec2(0.0, 1.0));
      let vd = dot(d, pf - vec2(1.0, 1.0));

      let x1 = lerp(va, vb, w.x);
      let x2 = lerp(vc, vd, w.x);
      return lerp(x1, x2, w.y);
    }`,
  ).$uses({ hash, lerp, fade, grad });
  
  const mainVertex = tgpu['~unstable'].vertexFn({
    in: { vertexIndex: d.builtin.vertexIndex },
    out: { outPos: d.builtin.position },
  })((input) => {
    'kernel';
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

  const mainFragment = tgpu['~unstable'].fragmentFn({
    in: { pos: d.builtin.position },
    out: d.vec4f,
  })((input) => {
    'kernel';
    const time = bindGroupLayout.$.time;
    const uv = div(input.pos.xy, d.vec2f(width * 0.2, height * 0.1));
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

  const bindGroup = root.createBindGroup(bindGroupLayout, {
    time: timeUniform,
  });

  function frame() {
    timeUniform.write(performance.now() % 15000);
    pipeline
      .withColorAttachment({
        view: context.getCurrentTexture().createView(),
        clearValue: [0, 0, 0, 0],
        loadOp: 'clear',
        storeOp: 'store',
      })
      .with(bindGroupLayout, bindGroup)
      .draw(6);
    context.present();
    requestAnimationFrame(frame);
  }
  frame();
}
