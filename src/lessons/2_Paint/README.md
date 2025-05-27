# 3D Preview

<details>
<summary>WebGPU - Theoretical introduction</summary>

### Official Docs

- https://www.w3.org/TR/webgpu/
- https://www.w3.org/TR/WGSL

### Interesting Materials

- https://github.com/mikbry/awesome-webgpu
- https://webgpufundamentals.org/
- https://eliemichel.github.io/LearnWebGPU/index.html
- https://codelabs.developers.google.com/your-first-webgpu-app#0
- https://webgpu.github.io/webgpu-samples/
- https://github.com/mikbry/awesome-webgpu
- https://www.webgpuexperts.com/blog
- https://compute.toys/

## Key Concepts

WebGPU is an implementation of a standard; there are a couple of implementations.

- https://github.com/google/dawn
- https://github.com/gfx-rs/wgpu

### Diagrams

Render Pipeline
![Image](https://github.com/user-attachments/assets/176ee89a-f8eb-40f7-951f-b357163bdc05)

Compute Pipeline
![Image](https://github.com/user-attachments/assets/df1c2187-01b5-4264-a16e-f8dc661049a2)

### GPU Access

- **Adapter** - Represents a physical GPU device on the system.
- **Device** - A logical representation of an adapter. It is created from a GPUAdapter and manages resource creation and ownership.
- **Pipeline** - A collection of shaders for one command of a compute pass.
- **Command Encoder** - Serializes your GPU job into a list of instructions that you can send from the CPU to the GPU and execute there.
- **Command Buffer** - A buffer that contains output from the encoder.
- **Render Pass** - Describes a GPU rendering task and provides information about memory layouts.
    - Example pipeline:
        
        ```jsx
        encoder = device.createCommandEncoder()
        
        pass = encoder.beginRenderPass()
        pass.setPipeline()
        pass.setVertexBuffer()
        pass.setIndexBuffer()
        pass.setBindGroup()
        pass.draw()
        pass.end()
        
        commandBuffer = encoder.finish();
        
        device.queue.submit([commandBuffer]);
        
        ```
        
- **device.queue.writeBuffer()** - Used to send some data from RAM to VRAM memory.
- **device.queue.submit()** - Used to send a job to the GPU scheduler.
- **Compute Pass** - Describes a GPU compute task and provides information about memory layouts.
    
    ```jsx
    const commandEncoder = device.createCommandEncoder();
    
    const pass = commandEncoder.beginComputePass();
    pass.setPipeline();
    pass.setBindGroup();
    pass.dispatchWorkgroups();
    pass.end();
    
    device.queue.submit([commandEncoder.finish()]);
    
    ```
    
- **Workgroup** - A group of threads that share local memory. This memory is faster than global memory. You can synchronize threads inside the workgroup.
- **@workgroup_size(x, y, z)** - Describes how many threads are in one workgroup. You can think of it like splitting a 3D cube into smaller cubes.
- **dispatchWorkgroups()** - Used to execute a certain amount of workgroups. It is important to dispatch the correct amount of workgroups to cover all data you want to process.
    - You need to fine-tune the dispatch amount and workgroup size. Every dispatch has some overhead, and different GPUs have limitations for workgroup size (threads per workgroup, memory limit, registers per workgroup). If you exceed the limit, your performance will decrease. A good default for workgroup size is 256, 512, or 1024.
- Indirect Draw - You can delegate the logic to the GPU to decide what and when to draw.
    
    ```jsx
    @group(0) @binding(0) var<storage, read_write> drawArgs : DrawArgs;
    
    @compute @workgroup_size(1)
    fn main() {
      drawArgs.vertexCount = 3;
      drawArgs.instanceCount = 10000;
      drawArgs.firstVertex = 0;
      drawArgs.firstInstance = 0;
    }
    
    // JS
    renderPass.drawIndirect(indirectBuffer, 0);
    
    ```
    

### Shaders

- **Vertex Shader** - Transforms vertex information into a position on the screen. It operates over normalized space [-1, 1]. It is useful because you can perform geometric computation without worrying about screen resolution. Vertex shaders usually work with triangles because you can approximate complex 3D objects from them.
- **Fragment Shader** - Computes color for every pixel based on information received from the Vertex Shader. It is performed on pixels that are inside triangles computed by the vertex shader.
    - Fragment shaders draw their output to a Color Attachment that provides access to the target texture, which is a “back frame buffer.”
    - In a fragment shader, 0,0 is the top left corner.
- **WGSL** - The language of shaders in WebGPU, compiled into native shaders for specific platforms like Metal/DirectX/Vulkan. It is a strongly-typed language.
    - WGSL syntax - https://webgpufundamentals.org/webgpu/lessons/webgpu-wgsl.html
    - WGSL Types - https://webgpufundamentals.org/webgpu/lessons/webgpu-memory-layout.html#vec-and-mat-types
- Built-in values - In shaders, you have access to a set of global variables that you don’t need to define. These variables describe, for example, the global ID of a shader or the x/y of the pixel you are currently working on.

### Memory Layout

Normally, in languages like C++, compilers compute memory layouts based on your code. However, with shaders, memory allocation and shader code are separate. You need to explicitly tell the shader compiler what the memory interpretation is and what the size of structures is.

- **Bind Group Layout** - Describes the type of data under each index of binding data, and how to interpret that memory field.
- **Bind Group** - Fill the group with references to physical buffers. You can rebuild a bind group without rebuilding the entire pipeline.

### Data Containers

- **Buffer** - A segment of GPU memory used as a basic container for binary data in the GPU pipeline. Buffers are created by the CPU in RAM, and then sent to GPU VRAM. In JS, we use ArrayBuffers and TypedArrays to allocate buffers, fill them with data, and then send them to the GPU. One buffer can contain many sub-buffers with different types.
    - You can specify the destination of a Buffer by setting flags.
    - Memory Layout - https://webgpufundamentals.org/webgpu/lessons/webgpu-memory-layout.html
    - ArrayBuffer - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer
    - TypedArray - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypedArray
    
    ```jsx
    const data = new ArrayBuffer(8);
    const subData1 = new Float32Array(data);
    const subData2 = new Uint32Array(data);
    
    ```
    
- **Uniform Buffer** - A buffer optimized to store a small amount of data (usually limited to 64kB).
- **Storage Buffer** - A general-purpose buffer that can store more data than a uniform buffer; you can read and write to this buffer from shaders.
- **Texture** - Think of it as an image containing information about pixels and capable of storing many layers.
- **TextureView** - Since a texture is a complex structure with lots of information, you can define how you want to access parts of it through a TextureView.
- **Sampler** - Describes the strategy for reading pixel data from a texture, such as blending pixels or clamping. It describes how to read data from a texture.
- **Vertex Buffer** - A vertex shader-specific data type containing vertex data like position, color, etc.
- **Index Buffer** - Some vertices are duplicated (on triangle connections). To save memory, you send each vertex once and refer to it by index.

### Others

- **Frame Buffer** - Contains a rasterized texture able to be displayed on the screen.
- **VSync** - The signal from the GPU that flushes the buffer.
- **Swap Chain** - A mechanism for swapping texture buffers.
- **Double Buffering** - The GPU contains at least two buffers: back and front frame buffers. The back frame is for computing, and the front frame is for displaying.
- **GPU Scheduler** - The GPU driver manages access to GPU hardware and runs tasks from the queue.

</details>

## Web

Task: Make a paint-like application using WebGPU.

Result:  
<video src="https://github.com/user-attachments/assets/dbc5821f-07a1-41cb-8a6c-df42b43a2f06" height="400" controls></video>


### Setup render pipeline

Task: Use `steps/web/boilerplate.ts` file as a starting point. Setup WebGPU render pipeline according to the following steps.

Result:  
<video src="https://github.com/user-attachments/assets/dabc72ff-6c79-46f9-9870-ff269c1bb74b" height="400" controls></video>

1.1 Get access to the canvas, device and context. Make sure that the canvas has a correct size.  
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

1.3 Write a vertex shader. We'll draw two triangles (a square sliced along its diagonal) to cover the whole canvas.  
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

1.4 Write a fragment shader. It'll read the color already computed by the compute shader and just display it.  
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

1.6 Create a texture. This texture will be a shared memory between compute and fragment shaders.  
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

1.11 Create a render pass and specify which view needs to be a target output for your render pipeline.  
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

1.13 Draw the triangles (3 vertices per triangle = 6 in total).  
📁 `paint.web.ts`
```ts
function frame() {
  // ...
  renderPass.draw(6);
  // ...
```

1.14 Submit all commands to the GPU.  
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

2.2 Describe the memory layout of our compute shader.  
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

2.3 Create a compute pipeline with that memory layout.  
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

2.4 Create buffers for storing *uniform* data, to be accessed by our compute shader. We can use them to send data from JS to the GPU.  
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

2.5 Create a bind group for the compute pipeline. Bind all buffers and texture with the layout.  
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

2.6 Create a command encoder and a compute pass.  
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

2.7 Send information about cursor position to the compute shader and schedule the compute pass.  
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

2.8 Add gesture handling. The `initGestures` method comes from utility file and implements simple gesture handling for web.
📁 `paint.web.ts`
```ts
initGestures(
  paintAt, 
  canvas, 
  () => { lastPosition = null }
);
```

2.9 Implement changing brush configuration. The `config.sync` method is called every time the brush configuration changes - when you tap on an item in the toolbar. 
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

Task: You can see that the current brush implementation draws a series of circles instead of lines. Implement a line drawing algorithm. You can base your algorithm on [linear interpolation](https://en.wikipedia.org/wiki/Linear_interpolation). Do it in the compute shader.

Result:  
<video src="https://github.com/user-attachments/assets/7d9cfa2c-5ecc-4786-9e17-8a5af541504d" height="400" controls></video>

3.1 Pass to the compute shader the last position of the cursor too. It require a few steps. You need to create a new uniform. Create a JS buffer to hold the data, bind it with the compute pipeline and send that data to the GPU. First let's update our uniform layout. 
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
+const posStartBuffer = device.createBuffer({
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

3.5 Send the last position of the cursor to the GPU.  
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
<video src="https://github.com/user-attachments/assets/06656fbf-e307-46b4-b4cc-a68e12af5f45" height="400" controls></video>

4.1 Implement rainbow brush. Compute color based on brush position instead of using the solid color from the uniform.  
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

Task: Use `steps/mobile/Example.boilerplate.ts` and `steps/mobile/paint.boilerplate.ts` files as a starting point. Add gesture handling and move render loop to the UI thread. Note that `steps/mobile/paint.boilerplate.ts` is a copy of the final version of `paint.web.ts` file - you'll ned to update it a bit later.

Result:  
<video src="https://github.com/user-attachments/assets/6300a60f-05b1-4d78-a1d5-3f637ba5f15d" height="400" controls></video>

### Setup WebGPU for mobile.

5.1 Add gesture handling.  
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

5.2 Create context to share data between Gesture Handler and WebGPU render loop on the UI thread.  
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

5.3 Enable WebGPU for worklets on the UI Thread - that functionality comes from `react-native-webgpu-worklets`. And initialize the WebGPU renderer.  
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

6.3 Call `context.present()` - this is necessary to display the content on mobile.  
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

6.4 Shared context contains information about the last position of the brush and gesture callback. Let's assign the necessary data.  
📁 `paint.ts`
```ts
function paintAt(x: number, y: number) {
  // ...
}
runOnUI(() => {
  sharedContext.value.gestureCallback = paintAt;
})();
```

6.5 Workletize `paintAt` and `draw` methods to allow them to be called from the UI thread.  
📁 `paint.ts`
```diff
function draw() {
+  'worklet';
  // ...
function paintAt(x: number, y: number) {
+  'worklet';
  // ..
```

6.7 Update `paintAt` to use shared context, and replace call of `getBoundingClientRect()`.  
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
