import tgpu from 'typegpu';
import * as d from 'typegpu/data';
import { abs, pow, sign } from 'typegpu/std';

const hash = tgpu['~unstable'].fn([d.vec2f], d.f32)(
  /* wgsl */ `(p: vec2i) -> f32 {
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
  /* wgsl */ `(t: vec2f) -> vec2f {
    return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
  }`,
);
const grad = tgpu['~unstable'].fn([d.f32], d.f32)(
  /* wgsl */ `(p: vec2i) -> vec2f {
    let h = hash(p) * 4.0;
    let angle = 6.2831853 * fract(h); // 2π * hash
    return vec2f(cos(angle), sin(angle));
  }`,
).$uses({ hash });
export const noise = tgpu['~unstable'].fn([d.vec2f], d.f32)(
  /* wgsl */ `(p: vec2f) -> f32 {
    let pi = vec2i(p);
    let pf = fract(p);
    let w = fade(pf);

    let a = grad(pi + vec2i(0, 0));
    let b = grad(pi + vec2i(1, 0));
    let c = grad(pi + vec2i(0, 1));
    let d = grad(pi + vec2i(1, 1));

    let va = dot(a, pf - vec2f(0, 0));
    let vb = dot(b, pf - vec2f(1, 0));
    let vc = dot(c, pf - vec2f(0, 1));
    let vd = dot(d, pf - vec2f(1, 1));

    let x1 = lerp(va, vb, w.x);
    let x2 = lerp(vc, vd, w.x);
    return lerp(x1, x2, w.y);
  }`,
).$uses({ hash, lerp, fade, grad });

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
