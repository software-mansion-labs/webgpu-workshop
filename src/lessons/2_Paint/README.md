# 3D Preview

## Web

Task: Make a paint-like application using WebGPU.

Result:  
<video src="https://github.com/user-attachments/assets/e594db59-5c7f-408d-b348-78ea87c45d42" height="400" controls></video>


### Setup render pipeline

Task: Use `steps/web/boilerplate.ts` file as a starting point. Setup WebGPU render pipeline according to the following steps.

Result:  
<video src="https://github.com/user-attachments/assets/a2c0818c-9a07-429c-8b37-25d882e67db2" height="400" controls></video>

1.1 Get access to canva, device and context. Make sure that canva has correct size.  
📁 `paint.web.ts`
```ts
const canvas = document.getElementById('gpu-canvas') as HTMLCanvasElement;
const { width: canvasWidth, height: canvasHeight } = canvas?.getBoundingClientRect() ?? { width: 0, height: 0 };
canvas.width = canvasWidth;
canvas.height = canvasHeight;
const adapter = await navigator.gpu.requestAdapter();
const device = await adapter?.requestDevice()!;
const context = canvas?.getContext('webgpu')!;
if (!context || !device) {
  alert("WebGPU context not supported!");
  return;
}
```

1.2 Configure the context.  
📁 `paint.web.ts`
```ts
const format = navigator.gpu.getPreferredCanvasFormat();
context.configure({
  device,
  format,
  alphaMode: 'premultiplied'
});
```

1.3 Write a vertex shader. We'll draw a two triangles (compined in square) to cover the whole canvas.  
📁 `paint.web.ts`
```ts
const vertexShaderCode = `
  @vertex
  fn main(@builtin(vertex_index) vertexIndex: u32)
    -> @builtin(position) vec4<f32> {
    var pos = array<vec2<f32>, 6>(
      vec2<f32>(-1.0, -1.0),
      vec2<f32>(1.0, -1.0),
      vec2<f32>(-1.0, 1.0),
      vec2<f32>(-1.0, 1.0),
      vec2<f32>(1.0, -1.0),
      vec2<f32>(1.0, 1.0)
    );
    return vec4<f32>(pos[vertexIndex], 0.0, 1.0);
  }
`;
```

1.4 Write a fragment shader. It'll read a color already computed in compute shader and just display them.  
📁 `paint.web.ts`
```ts
const fragmentShaderCode = `
  @group(0) @binding(0) var mainSampler: sampler;
  @group(0) @binding(1) var mainTexture: texture_2d<f32>;

  @fragment
  fn main(@builtin(position) pos: vec4<f32>) -> @location(0) vec4<f32> {
    let uv = pos.xy / vec2<f32>(f32(${canvasWidth}), f32(${canvasHeight}));
    return textureSample(mainTexture, mainSampler, uv);
  }
`;
```

1.5 Setup the render pipeline. Define the vertex and fragment shaders.  
📁 `paint.web.ts`
```ts
const renderPipeline = device.createRenderPipeline({
  layout: "auto",
  vertex: {
    module: device.createShaderModule({ code: vertexShaderCode }),
    entryPoint: "main"
  },
  fragment: {
    module: device.createShaderModule({ code: fragmentShaderCode }),
    entryPoint: "main",
    targets: [{ format }]
  },
  primitive: { topology: 'triangle-list' }
});
```

1.6 Create a texture. This texture will be a shared memory between compute and fragment shader.  
📁 `paint.web.ts`
```ts
const canvasTexture = device.createTexture({
  size: [canvasWidth, canvasHeight, 1],
  format: 'rgba8unorm',
  usage: GPUTextureUsage.TEXTURE_BINDING |
          GPUTextureUsage.COPY_DST |
          GPUTextureUsage.RENDER_ATTACHMENT |
          GPUTextureUsage.STORAGE_BINDING
});
```

1.7 Fill the texture with blank pixels.  
📁 `paint.web.ts`
```ts
const blankPixels = new Uint8Array(canvasWidth * canvasHeight * 4).fill(0);
device.queue.writeTexture(
  { texture: canvasTexture },
  blankPixels,
  { bytesPerRow: canvasWidth * 4 },
  [canvasWidth, canvasHeight]
);
```

1.8 Bind texture and texture sampler with render pipeline.  
📁 `paint.web.ts`
```ts
const renderBindGroup = device.createBindGroup({
  layout: renderPipeline.getBindGroupLayout(0),
  entries: [
    { binding: 0, resource: device.createSampler() },
    { binding: 1, resource: canvasTexture.createView() }
  ]
});
```

1.9 Setup animation loop.  
📁 `paint.web.ts`
```ts
function frame() {
  
  requestAnimationFrame(frame);
}
frame();
```

1.10 Create a command encoder.  
📁 `paint.web.ts`
```ts
function frame() {
  const commandEncoder = device.createCommandEncoder();
  // ...
```

1.11 Create a render pass and specify which view needs to be an target output for your render pipeline.  
📁 `paint.web.ts`
```ts
function frame() {
  // ...
  const renderPass = commandEncoder.beginRenderPass({
    colorAttachments: [{
      view: context.getCurrentTexture().createView(),
      clearValue: { r: 0, g: 0, b: 0, a: 1 },
      loadOp: 'clear',
      storeOp: 'store'
    }]
  });
  // ...
```

1.12 Set the render pipeline and bind group.  
📁 `paint.web.ts`
```ts
function frame() {
  // ...
  renderPass.setPipeline(renderPipeline);
  renderPass.setBindGroup(0, renderBindGroup);
  // ...
```

1.13 Draw the triangles - 6 points one time.  
📁 `paint.web.ts`
```ts
function frame() {
  // ...
  renderPass.draw(6, 1);
  // ...
```

1.14 Submit task to GPU.  
📁 `paint.web.ts`
```ts
function frame() {
  // ...
  renderPass.end();
  device.queue.submit([commandEncoder.finish()]);
  // ...
```

### Setup compute pipeline

2.1 Create a compute shader.  
📁 `paint.web.ts`
```ts
const computeShaderCode = `
  @group(0) @binding(0) var canvasTex : texture_storage_2d<rgba8unorm, write>;
  @group(0) @binding(1) var<uniform> brushSize : f32;
  @group(0) @binding(2) var<uniform> brushStyle : f32;
  @group(0) @binding(3) var<uniform> brushColor : vec4<f32>;
  @group(0) @binding(4) var<uniform> brushPos : vec2<f32>;

  fn circleBrash(pos: vec2<f32>, distance: f32, radius: f32) {
    if (distance <= radius) {
      textureStore(canvasTex, vec2<i32>(i32(pos.x), i32(pos.y)), brushColor);
    }
  }
  
  fn sprayBrash(pos: vec2<f32>, distance: f32, radius: f32) {
    // TODO
  }

  fn rainbowBrash(pos: vec2<f32>, distance: f32, radius: f32) {
    // TODO
  }

  @compute @workgroup_size(8, 8)
  fn main(@builtin(global_invocation_id) global_id : vec3<u32>) {
    let x = global_id.x;
    let y = global_id.y;
    let pos = vec2<f32>(f32(x), f32(y));
    let distance = distance(pos, brushPos);
    let radius = brushSize / 2.0;

    if (i32(brushStyle) == 0) {
      circleBrash(pos, distance, radius);
    } else if (i32(brushStyle) == 1) {
      sprayBrash(pos, distance, radius);
    } else if (i32(brushStyle) == 2) {
      rainbowBrash(pos, distance, radius);
    }
  }
`;
```

2.2 Describe memory layout for compute shader.  
📁 `paint.web.ts`
```ts
const bindGroupLayout = device.createBindGroupLayout({
  entries: [
    { binding: 0, visibility: GPUShaderStage.COMPUTE, storageTexture: { access: 'write-only', format: 'rgba8unorm' } },
    { binding: 1, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'uniform' } },
    { binding: 2, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'uniform' } },
    { binding: 3, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'uniform' } },
    { binding: 4, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'uniform' } },
  ]
});

const pipelineLayout = device.createPipelineLayout({
  bindGroupLayouts: [bindGroupLayout],
});
```

2.3 Create compute pipeline with memory layout.  
📁 `paint.web.ts`
```ts
const computePipeline = device.createComputePipeline({
  layout: pipelineLayout,
  compute: {
    module: device.createShaderModule({ code: computeShaderCode }),
    entryPoint: "main"
  }
});
```

2.4 Create buffers for uniforms to compute shader. Those buffers will be sent from JS to GPU.  
📁 `paint.web.ts`
```ts
const brushSizeBuffer = device.createBuffer({
  size: 4,
  usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
});

const brushStyleBuffer = device.createBuffer({
  size: 4,
  usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
});

const brushColorBuffer = device.createBuffer({
  size: 4 * 4,
  usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
});

const brushPosBuffer = device.createBuffer({
  size: 2 * 4,
  usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
});
```

2.5 Create bind group for compute pipeline. Bind all buffers and texture with the layout.  
📁 `paint.web.ts`
```ts
const computeBindGroup = device.createBindGroup({
  layout: computePipeline.getBindGroupLayout(0),
  entries: [
    { binding: 0, resource: canvasTexture.createView({ dimension: '2d' }) },
    { binding: 1, resource: { buffer: brushSizeBuffer } },
    { binding: 2, resource: { buffer: brushStyleBuffer } },
    { binding: 3, resource: { buffer: brushColorBuffer } },
    { binding: 4, resource: { buffer: brushPosBuffer } },
  ]
});
```

2.6 Create a command encoder and queue compute pass to GPU.  
📁 `paint.web.ts`
```ts
function draw() {
  const commandEncoder = device.createCommandEncoder();
  const pass = commandEncoder.beginComputePass();
  pass.setPipeline(computePipeline);
  pass.setBindGroup(0, computeBindGroup);
  pass.dispatchWorkgroups(
    Math.ceil(canvasWidth / 8),
    Math.ceil(canvasHeight / 8)
  );
  pass.end();
  device.queue.submit([commandEncoder.finish()]);
}
```

2.7 Send information about cursor position to compute shader and schedule the compute pass.  
📁 `paint.web.ts`
```ts
let lastPosition: { x: number, y: number } | null = null;
function paintAt(x: number, y: number) {
  const rect = canvas.getBoundingClientRect();
  const tx = (x - rect.left) / rect.width * canvasWidth;
  const ty = (y - rect.top) / rect.height * canvasHeight;
  if (tx < 0 || ty < 0 || tx >= canvasWidth || ty >= canvasHeight) return;

  device.queue.writeBuffer(brushPosBuffer, 0, new Float32Array([tx, ty]));
  draw();
}
```

2.8 Add gestures handling. The initGestures method comes from utility file and implements simple gesture handling for web.
📁 `paint.web.ts`
```ts
initGestures(
  paintAt, 
  canvas, 
  () => { lastPosition = null }
);
```

2.9 Implement changing brush configuration. The `config.sync` method is called every time when brush configuration changes - when you tap on item in the toolbar. 
📁 `paint.web.ts`
```ts
config.sync = () => {
  device.queue.writeBuffer(brushSizeBuffer, 0, new Float32Array([config.brushSize]));
  device.queue.writeBuffer(brushStyleBuffer, 0, new Float32Array([config.brushStyle]));
  device.queue.writeBuffer(brushColorBuffer, 0, new Float32Array(config.brushColor));
}
config.sync();
```

Checkpoint: 📁 `steps/step1.ts`

### Filling gaps

Task: You can see that current brush driaving a circles instead of lines. Implement a line drawing algorithm. You can base your algorithm on [linear interpolation](https://en.wikipedia.org/wiki/Linear_interpolation). Do it in compute shader.

Result:  
<video src="https://github.com/user-attachments/assets/77c718c7-cfc1-4dcd-b116-03de30a97789" height="400" controls></video>

3.1 Pass to the compute shader the last position of the cursor too. It require a few steps. Youn need to add a new uniform. Create a JS buffor for data, bind them with compute pipeline and send dat thada to GPU. First let's update a uniform layout. 
📁 `paint.web.ts`
```diff
const bindGroupLayout = device.createBindGroupLayout({
  entries: [
    { binding: 0, visibility: GPUShaderStage.COMPUTE, storageTexture: { access: 'write-only', format: 'rgba8unorm' } },
    { binding: 1, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'uniform' } },
    { binding: 2, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'uniform' } },
    { binding: 3, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'uniform' } },
    { binding: 4, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'uniform' } },
+    { binding: 5, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'uniform' } },
  ]
});
```

3.2 Create a new buffer for the last position of the cursor.  
📁 `paint.web.ts`
```diff
-const brushPosBuffer = device.createBuffer({
-const posStartBuffer = device.createBuffer({
  size: 2 * 4,
  usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
});

+const posEndBuffer = device.createBuffer({
+  size: 2 * 4,
+  usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
+});
```

3.4 Update the bind group layout.  
📁 `paint.web.ts`
```diff
const computeBindGroup = device.createBindGroup({
  layout: computePipeline.getBindGroupLayout(0),
  entries: [
    { binding: 0, resource: canvasTexture.createView({ dimension: '2d' }) },
    { binding: 1, resource: { buffer: brushSizeBuffer } },
    { binding: 2, resource: { buffer: brushStyleBuffer } },
    { binding: 3, resource: { buffer: brushColorBuffer } },
-    { binding: 4, resource: { buffer: brushPosBuffer } },
+    { binding: 4, resource: { buffer: posStartBuffer } },
+    { binding: 5, resource: { buffer: posEndBuffer } },
  ]
});
```

3.5 Send the last position of the cursor to GPU.  
📁 `paint.web.ts`
```diff
let lastPosition: { x: number, y: number } | null = null;
function paintAt(x: number, y: number) {
  const rect = canvas.getBoundingClientRect();
  const tx = (x - rect.left) / rect.width * canvasWidth;
  const ty = (y - rect.top) / rect.height * canvasHeight;
  if (tx < 0 || ty < 0 || tx >= canvasWidth || ty >= canvasHeight) return;

-  device.queue.writeBuffer(brushPosBuffer, 0, new Float32Array([tx, ty]));
-  draw();
+  if (lastPosition) {
+    device.queue.writeBuffer(posStartBuffer, 0, new Float32Array([lastPosition.x, lastPosition.y]));
+    device.queue.writeBuffer(posEndBuffer, 0, new Float32Array([tx, ty]));
+    draw();
+  }
+  lastPosition = { x: tx, y: ty };
}
```

3.6 Update the compute shader.  
📁 `paint.web.ts`
```diff
const computeShaderCode = `
  @group(0) @binding(0) var canvasTex : texture_storage_2d<rgba8unorm, write>;
  @group(0) @binding(1) var<uniform> brushSize : f32;
  @group(0) @binding(2) var<uniform> brushStyle : f32;
  @group(0) @binding(3) var<uniform> brushColor : vec4<f32>;
-  @group(0) @binding(4) var<uniform> brushPos : vec2<f32>;
+  @group(0) @binding(4) var<uniform> startPos : vec2<f32>;
+  @group(0) @binding(5) var<uniform> endPos : vec2<f32>;

+  fn pointToSegmentDistance(p: vec2<f32>, v: vec2<f32>, w: vec2<f32>) -> f32 {
+    let l2 = distance(v, w) * distance(v, w);
+    if (l2 == 0.0) {
+      return distance(p, v);
+    }
+    let t = max(0.0, min(1.0, dot(p - v, w - v) / l2));
+    let projection = v + t * (w - v);
+    return distance(p, projection);
+  }
// ...
  @compute @workgroup_size(8, 8)
  fn main(@builtin(global_invocation_id) global_id : vec3<u32>) {
    let x = global_id.x;
    let y = global_id.y;
    let pos = vec2<f32>(f32(x), f32(y));
-    let distance = distance(pos, brushPos);
+    let distance = pointToSegmentDistance(pos, startPos, endPos);
```

Checkpoint: 📁 `steps/step2.ts`

### Implement brush styles

Task: Implement rainbow and spray brush styles in compute shader.

Result:  
<video src="https://github.com/user-attachments/assets/8c9bf4a6-2f6a-4594-a33b-670071238e35" height="400" controls></video>

4.1 Implement rainbow brush. Compute color based on brush position instead of using solid color from uniform.  
📁 `paint.web.ts`
```ts
fn rainbowBrash(pos: vec2<f32>, distance: f32, radius: f32) {
  if (distance <= radius) {
    let paintColor = vec4<f32>(1 - pos.x/${canvasWidth}, pos.y/${canvasHeight}, 1 - pos.y/${canvasHeight}, 1.0);
    textureStore(canvasTex, vec2<i32>(i32(pos.x), i32(pos.y)), paintColor);
  }
}
```

4.2 Implement spray brush.
📁 `paint.web.ts`
```ts
fn rand(pos: vec2<f32>, seed: f32) -> f32 {
  return fract(sin(dot(pos, vec2(12.9898, 78.233)) + seed) * 43758.5453);
}

fn sprayBrash(pos: vec2<f32>, distance: f32, radius: f32) {
  if (distance <= radius && rand(pos, startPos.x) < 0.1) {
    textureStore(canvasTex, vec2<i32>(i32(pos.x), i32(pos.y)), brushColor);
  }
}
```

Checkpoint: 📁 `steps/step3.ts`

## Mobile

Task: Use `steps/mobile/Example.boilerplate.ts` and `steps/mobile/paint.boilerplate.ts` files as a starting point. Add gesture handling and move render loop to UI thread. Note that `steps/mobile/paint.boilerplate.ts` is a copy of final version of `paint.web.ts` file - you'll ned to update it a bit later.

Result:  
<video src="https://github.com/user-attachments/assets/8656fd2b-b79a-48f5-b714-a764ef5134ef" height="500" controls></video>

### Setup WebGPU for mobile.

5.1 Add gestures handling.  
📁 `paint.ts`
```diff
+const panGesture = Gesture.Pan();

<View style={styles.container}>
+  <GestureDetector gesture={panGesture}>
    { canva }
+  </GestureDetector>
  <GUI />
</View>
```

5.2 Create context to share data between Hesture handler and WebGPU render loop on UI thread.  
📁 `paint.ts`
```ts
export default function PaintCanva() {
// ...
const sharedContext = useSharedContext<SharedContext>({
  lastPosition: null,
  gestureCallback: (_x: number, _y: number) => {
    'worklet';
  },
});
```

5.3 Enable WebGPU for worklets on UI Thread - that functionality comes from `react-native-webgpu-worklets`. And initialize WebGPU renderer.  
📁 `paint.ts`
```ts
const ref = useCanvasEffect(async () => {
  enableGPUForWorklets();
  await init(ref, sharedContext);
});
```

5.4 Implement gesture callbacks.  
📁 `paint.ts`
```ts
const panGesture = Gesture.Pan()
  .onBegin((e) => {
    sharedContext.value.gestureCallback(e.x, e.y);
  })
  .onUpdate((e) => {
    sharedContext.value.gestureCallback(e.x, e.y);
  })
  .onEnd((_e) => {
    sharedContext.value.lastPosition = null;
  });
```

Checkpoint: 📁 `steps/mobile/Example.step1.ts`

### Move render loop to UI thread

6.1 Get access to the canvas and context.  
📁 `paint.ts`
```diff
-const canvas = document.getElementById('gpu-canvas') as HTMLCanvasElement;
-const { width: canvasWidth, height: canvasHeight } = canvas?.getBoundingClientRect() ?? { width: 0, height: 0 };
-const context = canvas?.getContext('webgpu')!;
+const context = ref.current!.getContext("webgpu")!;
+const canvas = context.canvas as HTMLCanvasElement;
+const canvasWidth = canvas.clientWidth;
+const canvasHeight = canvas.clientHeight;
```

6.2 Start render loop on UI.  
📁 `paint.ts`
```diff
function frame() {
+  'worklet';
  // ...
}
-frame();
+runOnUI(frame)();
```

6.3 Call context.present() - this is necessary to display the content on mobile.  
📁 `paint.ts`
```diff
function frame() {
  'worklet';
  // ...
  device.queue.submit([commandEncoder.finish()]);
+  context.present();
  requestAnimationFrame(frame);
}
```

6.4 Shared context contains information about the last position of the brush and gesture callback. Let's assign necessery data.  
📁 `paint.ts`
```ts
function paintAt(x: number, y: number) {
  // ...
}
runOnUI(() => {
  sharedContext.value.gestureCallback = paintAt;
})();
```

6.5 Workletize `paintAt` and `draw` methods to allow them to be called from UI thread.  
📁 `paint.ts`
```diff
function draw() {
+  'worklet';
  // ...
function paintAt(x: number, y: number) {
+  'worklet';
  // ..
```

6.7 Update `paintAt` to useshared context, and replace call of `getBoundingClientRect()`.  
📁 `paint.ts`
```diff
-let lastPosition: { x: number, y: number } | null = null;
function paintAt(x: number, y: number) {
  'worklet';
-  const rect = canvas.getBoundingClientRect();
+  const lastPosition = sharedContext.value.lastPosition;
+  const rect = {left: 0, top: 0, width: canvasWidth, height: canvasHeight};
  const tx = (x - rect.left) / rect.width * canvasWidth;
  const ty = (y - rect.top) / rect.height * canvasHeight;
  if (tx < 0 || ty < 0 || tx >= canvasWidth || ty >= canvasHeight) return;

  if (lastPosition) {
    device.queue.writeBuffer(posStartBuffer, 0, new Float32Array([lastPosition.x, lastPosition.y]));
    device.queue.writeBuffer(posEndBuffer, 0, new Float32Array([tx, ty]));
    draw();
  }
-  lastPosition = { x: tx, y: ty };
+  sharedContext.value.lastPosition = { x: tx, y: ty };
}
```

Checkpoint: 📁 `steps/mobile/paint.step1.ts`

## Links
- Solid WebGPU tutorial with great deep explonation - https://webgpufundamentals.org/webgpu/lessons/webgpu-fundamentals.html
