# Lava Lamp

Task: Create a lava lamp effect using the `TypeGPU` library.

Result:  
<video src="https://github.com/user-attachments/assets/f596e533-68f1-43f4-bff0-e42ba82cb273
" height="400" controls></video>

## Web

Result:  
<video src="https://github.com/user-attachments/assets/5f96a333-ede6-469c-8162-afd89d118aab" height="400" controls></video>

Task: Use `steps/web/boilerplate.ts` file as a starting point. Setup TypeGPU renderer and display a simple gradient in shader. Look at implementation `getWebGPUContext` method because contains necessery boilerplate code to run TypeGPU on web.

1.1 Setup a vertex shader. We want to simple cover the whole screen with a gradient.  
📁 `lamp.web.ts`
```ts
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
```

1.2 Setup memory layout and bindings.  
📁 `lamp.web.ts`
```ts
const bindGroupLayout = tgpu.bindGroupLayout({});
const bindGroup = root.createBindGroup(bindGroupLayout, {});
```

1.3 Setup a fragment shader. We want to simple cover the whole screen with a gradient based on x coordinate.  
📁 `lamp.web.ts`
```ts
const mainFragment = tgpu['~unstable'].fragmentFn({
  in: { pos: d.builtin.position },
  out: d.vec4f,
})((input) => {
  const uv = div(input.pos.xy, d.vec2f(width, height));
  const n = uv.x;
  return d.vec4f(n, n, n, 1);
});
```

1.4 Setup a rendering pipeline.  
📁 `lamp.web.ts`
```ts
const pipeline = root['~unstable']
  .withVertex(mainVertex, {})
  .withFragment(mainFragment, { format: presentationFormat })
  .createPipeline();
```

1.5 Run pipeline in render loop.  
📁 `lamp.web.ts`
```ts
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
  // ...
```

### Display Perlin Noise effect

Task: Display a perlin noise using fragment shader. You can use `perlin` function from utility file.

Result:  
<video src="https://github.com/user-attachments/assets/4de59648-f75c-4113-a4a6-fe6f426a3c34" height="400" controls></video>

2.1 Import `perlin` function from utility file.   
📁 `lamp.web.ts`
```diff
const mainFragment = tgpu['~unstable'].fragmentFn({
  // ...
  return color;
-});
+}).$uses({ noise });
```

2.2 Display perlin noise.  
📁 `lamp.web.ts`
```ts
const mainFragment = tgpu['~unstable'].fragmentFn({
  in: { pos: d.builtin.position },
  out: d.vec4f,
})((input) => {
  const uv = div(input.pos.xy, d.vec2f(width * 0.4, height * 0.4));
  const n = noise(uv);
  return d.vec4f(n, n, n, 1);
}).$uses({ noise });
```

2.3 Colorize perlin noise. You can use mix method to blend color based on `n` parameter.  
📁 `lamp.web.ts`
```ts
const mainFragment = tgpu['~unstable'].fragmentFn({
  in: { pos: d.builtin.position },
  out: d.vec4f,
})((input) => {
  const uv = div(input.pos.xy, d.vec2f(width * 0.4, height * 0.4));
  const n = noise(uv);
  const color = mix(
    div(d.vec4f(153, 0, 105, 255), 255),
    div(d.vec4f(255, 140, 26, 255), 255),
    n * 0.5 + 0.5,
  );
  return color;
}).$uses({ noise });
```

Checkpoint: 📁 `steps/step1.ts`

### Animate perlin noise

Task: Add time uniform to fragment shader. Use `time` uniform to animate perlin noise.

Result:  
<video src="https://github.com/user-attachments/assets/eff16c95-3754-4d05-a49d-434cccb3d426" height="400" controls></video>

3.1 Add `time` uniform to fragment shader, update memory layout and bindings.   
📁 `lamp.web.ts`
```ts
const timeUniform = root.createBuffer(d.f32, 0).$usage('uniform');
const bindGroupLayout = tgpu.bindGroupLayout({
  time: { uniform: d.f32 },
});
const bindGroup = root.createBindGroup(bindGroupLayout, {
  time: timeUniform,
});
```

3.2 Use `time` uniform in fragment shader.  
📁 `lamp.web.ts`
```diff
const mainFragment = tgpu['~unstable'].fragmentFn({
  in: { pos: d.builtin.position },
  out: d.vec4f,
})((input) => {
  const uv = div(input.pos.xy, d.vec2f(width * 0.4, height * 0.4));
+  const time = bindGroupLayout.$.time;
+  const p = add(uv, div(d.vec2f(time, time), 3000));
-  const n = noise(uv);
+  const n = noise(p);
  const color = mix(
    div(d.vec4f(153, 0, 105, 255), 255),
    div(d.vec4f(255, 140, 26, 255), 255),
    n * 0.5 + 0.5,
  );
  return color;
}).$uses({ noise });
```

3.3 Update `time` uniform in render loop.  
📁 `lamp.web.ts`
```ts
function frame() {
  timeUniform.write(performance.now());
```

## Mobile

### TypeGPU on mobile

Task: Use `steps/mobile/boilerplate.ts` file as a starting point. Add necessery modification to allow `TypeGPU` to run on mobile. And finally allow to run TypeGPU on UI thread.

Result:  
<video src="https://github.com/user-attachments/assets/bde15c12-43b0-4290-9e8f-ef1b08f2fd01" height="500" controls></video>

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

Checkpoint: 📁 `steps/step1.ts`

### Run TypeGPU on UI thread

Result:  
<video src="https://github.com/user-attachments/assets/a9513153-8ce7-4a54-b0f8-7cc67bee2475" height="500" controls></video>

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
-import { add, div, mix } from 'typegpu/std';
+import { requireUI } from 'react-native-webgpu-worklets';
// ...
runOnUI(() => {
  'worklet';
+  const tgpu = requireUI('typegpu').default;
+  const { div, add, mix } = requireUI('typegpu/std');
+  const d = requireUI('typegpu/data');
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