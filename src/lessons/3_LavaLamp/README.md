# Lava Lamp

Task: Create a lava lamp effect using the `TypeGPU` library.

Result:  
<video src="https://github.com/user-attachments/assets/2c78f770-8be0-45bc-bbe1-d9e2e62ac0c2" height="400" controls></video>

## Web

Result:  
<video src="https://github.com/user-attachments/assets/a7317dec-ee82-4319-8917-367bbc8df139" height="400" controls></video>

Task: Use `steps/web/boilerplate.ts` file as a starting point. Setup TypeGPU renderer and display a simple gradient in shader. Look at implementation `getWebGPUContext` method because contains necessery boilerplate code to run TypeGPU on web.

1.1 Setup a vertex shader. We want to simply cover the whole screen with a gradient.  
📁 `lamp.web.ts`
```ts
const fullScreenTriangle = tgpu['~unstable'].vertexFn({
  in: { idx: d.builtin.vertexIndex },
  out: { pos: d.builtin.position },
})((input) => {
  const pos = [d.vec2f(-1, -1), d.vec2f(3, -1), d.vec2f(-1, 3)];

  return {
    pos: d.vec4f(pos[input.idx], 0, 1),
  };
});
```

1.2 Setup a fragment shader. We want to cover the whole screen with a gradient based on the *x* coordinate.  
📁 `lamp.web.ts`
```ts
const mainFragment = tgpu['~unstable'].fragmentFn({
  in: { pos: d.builtin.position },
  out: d.vec4f,
})((input) => {
  const n = input.pos.x / width;
  return d.vec4f(n, n, n, 1);
});
```

1.3 Setup a rendering pipeline.  
📁 `lamp.web.ts`
```ts
const pipeline = root['~unstable']
  .withVertex(fullScreenTriangle, {})
  .withFragment(mainFragment, { format: presentationFormat })
  .createPipeline();
```

1.4 Run the pipeline in a render loop.  
📁 `lamp.web.ts`
```ts
function frame() {
  pipeline
    .withColorAttachment({
      view: context.getCurrentTexture().createView(),
      loadOp: 'clear',
      storeOp: 'store',
    })
    .draw(3);
  requestAnimationFrame(frame);
  // ...
```

### Display Perlin Noise effect

Task: Display *perlin noise* using the fragment shader. You can use the `perlin3d` API, imported from `@typegpu/noise`.

Result:  
<video src="https://github.com/user-attachments/assets/3339b73f-7f15-411b-8b7d-6b21a400fa7f" height="400" controls></video>

2.1 Use `perlin3d.sample` function and display its return value.  
📁 `lamp.web.ts`
```ts

const mainFragment = tgpu['~unstable'].fragmentFn({
  in: { pos: d.builtin.position },
  out: d.vec4f,
})((input) => {
  const minDim = d.f32(min(width, height));
  const uv = div(input.pos.xy, minDim * 0.2);
  const n = perlin3d.sample(d.vec3f(uv, 0));
  return d.vec4f(n, n, n, 1);
});
```

2.2 Colorize the perlin noise. You can use the `mix` method to blend color based on `n` parameter.  
📁 `lamp.web.ts`
```diff
const mainFragment = tgpu['~unstable'].fragmentFn({
  in: { pos: d.builtin.position },
  out: d.vec4f,
})((input) => {
  const minDim = d.f32(min(width, height));
  const uv = div(input.pos.xy, minDim * 0.2);
  const n = perlin3d.sample(d.vec3f(uv, 0));
-  return d.vec4f(n, n, n, 1);
+  const color = mix(
+    div(d.vec4f(153, 0, 105, 255), 255),
+    div(d.vec4f(255, 140, 26, 255), 255),
+    n * 0.5 + 0.5,
+  );
+  return color;
});
```

2.3 Increase contrast of perlin noise to gain a more lava-like effect. Use `sharpen` function from utility file.  
📁 `lamp.web.ts`
```diff
const mainFragment = tgpu['~unstable'].fragmentFn({
// ...
const minDim = d.f32(min(width, height));
const uv = div(input.pos.xy, minDim * 0.2);
-const n = perlin3d.sample(d.vec3f(uv, 0));
+const n = sharpen(perlin3d.sample(d.vec3f(uv, 0)));
const color = mix(
// ...
```

Checkpoint: 📁 `steps/step1.ts`

### Animate perlin noise

Task: Give the shader access to the current time via a *uniform*. Use the `time` uniform to animate perlin noise.

Result:  
<video src="https://github.com/user-attachments/assets/5a9da699-8855-4844-85eb-59d7ce68e695" height="400" controls></video>

3.1 Create `timeUniform`.   
📁 `lamp.web.ts`
```diff
+ const timeUniform = root['~unstable'].createUniform(d.f32, 0);
// ...
const mainFragment = tgpu['~unstable'].fragmentFn({
```

3.2 Use `timeUniform` in the fragment shader.  
📁 `lamp.web.ts`
```diff
const mainFragment = tgpu['~unstable'].fragmentFn({
  in: { pos: d.builtin.position },
  out: d.vec4f,
})((input) => {
  const minDim = d.f32(min(width, height));
  const uv = div(input.pos.xy, minDim * 0.2);
-  const n = sharpen(perlin3d.sample(d.vec3f(uv, 0)));
+  const time = timeUniform.value;
+  const n = sharpen(perlin3d.sample(d.vec3f(uv, time)));
// ...
```

3.3 Update `timeUniform` in the render loop.  
📁 `lamp.web.ts`
```ts
function frame() {
  timeUniform.write(performance.now() * 0.0002 % 10);
  // ...
```

## Mobile

### TypeGPU on mobile

Task: Use `steps/mobile/boilerplate.ts` file as a starting point. Add necessery modification to allow `TypeGPU` to run on mobile. Finally, allow to run TypeGPU on UI thread.

Result:  
<video src="https://github.com/user-attachments/assets/731a1dfa-b977-4cef-be93-2baf7831c333" height="400" controls></video>

4.1 Replace web specific code with mobile specific code.  
📁 `lamp.ts`
```diff
-const width = window.innerWidth;
-const height = window.innerHeight;
-const canvas = document.querySelector('canvas') as HTMLCanvasElement;
-const context = canvas.getContext('webgpu') as GPUCanvasContext;
+const context = ref.current!.getContext("webgpu")!;
+const canvas = context.canvas as HTMLCanvasElement;
+const width = canvas.clientWidth;
+const height = canvas.clientHeight;
```

4.2 Add flushing context to screen.  
📁 `lamp.ts`
```diff
function frame() {
  // ...
+  context.present();
  requestAnimationFrame(frame);
}
```

Checkpoint: 📁 `steps/step1.ts`

### Run TypeGPU on UI thread

Result:  
<video src="https://github.com/user-attachments/assets/b4a28340-46f3-43c7-8f9a-ce0b50a87f04" height="400" controls></video>

5.1 Wrap code in `runOnUI`.  
📁 `lamp.ts`
```diff
+runOnUI(() => {
+  'worklet';
  const presentationFormat = navigator.gpu.getPreferredCanvasFormat();
  tgpu.initFromDevice({ device });
// ...
  frame();
-};
+})();
}
```

5.2 Update imports - use `react-native-webgpu-worklets` library.  
📁 `lamp.ts`
```diff
-import * as d from 'typegpu/data';
-import { abs, add, div, mix, pow, sign } from 'typegpu/std';
+import { requireUI } from 'react-native-webgpu-worklets';
// ...
runOnUI(() => {
  'worklet';
+  const tgpu = requireUI('typegpu').default;
+  const { abs, div, min, mix, pow, sign } = requireUI('typegpu/std');
+  const d = requireUI('typegpu/data');
+  const { perlin3d } = requireUI('typegpu/noise');
// ...
```

5.3 Add lamp mask.  
📁 `Example.tsx`
```diff
<View style={{ flex: 1 }}>
-  {/* <Image
+  <Image
    style={styles.lamp}
    source={require('./utils/lamp.png')}
-  /> */}
+  />
  <Canvas ref={ref} style={styles.container} />
```

Checkpoint: 📁 `steps/step2.ts`

## Links
- [TypeGPU](https://docs.swmansion.com/TypeGPU/)