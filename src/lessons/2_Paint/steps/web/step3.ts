import { initGestures, config } from "./utils/tools";

export async function init() {
  if (!navigator.gpu) {
    alert("WebGPU not supported!");
    return;
  }

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

  const format = navigator.gpu.getPreferredCanvasFormat();
  context.configure({
    device,
    format,
    alphaMode: 'premultiplied'
  });

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

  const fragmentShaderCode = `
    @group(0) @binding(0) var mainSampler: sampler;
    @group(0) @binding(1) var mainTexture: texture_2d<f32>;

    @fragment
    fn main(@builtin(position) pos: vec4<f32>) -> @location(0) vec4<f32> {
      let uv = pos.xy / vec2<f32>(f32(${canvasWidth}), f32(${canvasHeight}));
      return textureSample(mainTexture, mainSampler, uv);
    }
  `;

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

  const canvasTexture = device.createTexture({
    size: [canvasWidth, canvasHeight, 1],
    format: 'rgba8unorm',
    usage: GPUTextureUsage.TEXTURE_BINDING |
            GPUTextureUsage.COPY_DST |
            GPUTextureUsage.RENDER_ATTACHMENT |
            GPUTextureUsage.STORAGE_BINDING
  });

  const blankPixels = new Uint8Array(canvasWidth * canvasHeight * 4).fill(0);
  device.queue.writeTexture(
    { texture: canvasTexture },
    blankPixels,
    { bytesPerRow: canvasWidth * 4 },
    [canvasWidth, canvasHeight]
  );

  const renderBindGroup = device.createBindGroup({
    layout: renderPipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: device.createSampler() },
      { binding: 1, resource: canvasTexture.createView() }
    ]
  });

  function frame() {
    const commandEncoder = device.createCommandEncoder();
    const renderPass = commandEncoder.beginRenderPass({
      colorAttachments: [{
        view: context.getCurrentTexture().createView(),
        clearValue: { r: 0, g: 0, b: 0, a: 1 },
        loadOp: 'clear',
        storeOp: 'store'
      }]
    });
    renderPass.setPipeline(renderPipeline);
    renderPass.setBindGroup(0, renderBindGroup);
    renderPass.draw(6, 1);
    renderPass.end();
    device.queue.submit([commandEncoder.finish()]);
    requestAnimationFrame(frame);
  }
  frame();

  const computeShaderCode = `
    @group(0) @binding(0) var canvasTex : texture_storage_2d<rgba8unorm, write>;
    @group(0) @binding(1) var<uniform> brushSize : f32;
    @group(0) @binding(2) var<uniform> brushStyle : f32;
    @group(0) @binding(3) var<uniform> brushColor : vec4<f32>;
    @group(0) @binding(4) var<uniform> startPos : vec2<f32>;
    @group(0) @binding(5) var<uniform> endPos : vec2<f32>;

    fn pointToSegmentDistance(p: vec2<f32>, v: vec2<f32>, w: vec2<f32>) -> f32 {
      let l2 = distance(v, w) * distance(v, w);
      if (l2 == 0.0) {
        return distance(p, v);
      }
      let t = max(0.0, min(1.0, dot(p - v, w - v) / l2));
      let projection = v + t * (w - v);
      return distance(p, projection);
    }

    fn rand(pos: vec2<f32>, seed: f32) -> f32 {
      return fract(sin(dot(pos, vec2(12.9898, 78.233)) + seed) * 43758.5453);
    }

    fn circleBrash(pos: vec2<f32>, distance: f32, radius: f32) {
      if (distance <= radius) {
        textureStore(canvasTex, vec2<i32>(i32(pos.x), i32(pos.y)), brushColor);
      }
    }
    
    fn sprayBrash(pos: vec2<f32>, distance: f32, radius: f32) {
      if (distance <= radius && rand(pos, startPos.x) < 0.1) {
        textureStore(canvasTex, vec2<i32>(i32(pos.x), i32(pos.y)), brushColor);
      }
    }

    fn rainbowBrash(pos: vec2<f32>, distance: f32, radius: f32) {
      if (distance <= radius) {
        let paintColor = vec4<f32>(1 - pos.x/${canvasWidth}, pos.y/${canvasHeight}, 1 - pos.y/${canvasHeight}, 1.0);
        textureStore(canvasTex, vec2<i32>(i32(pos.x), i32(pos.y)), paintColor);
      }
    }

    @compute @workgroup_size(8, 8)
    fn main(@builtin(global_invocation_id) global_id : vec3<u32>) {
      let x = global_id.x;
      let y = global_id.y;
      let pos = vec2<f32>(f32(x), f32(y));
      let distance = pointToSegmentDistance(pos, startPos, endPos);
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

  const bindGroupLayout = device.createBindGroupLayout({
		entries: [
			{ binding: 0, visibility: GPUShaderStage.COMPUTE, storageTexture: { access: 'write-only', format: 'rgba8unorm' } },
			{ binding: 1, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'uniform' } },
			{ binding: 2, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'uniform' } },
			{ binding: 3, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'uniform' } },
			{ binding: 4, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'uniform' } },
			{ binding: 5, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'uniform' } },
		]
	});

  const pipelineLayout = device.createPipelineLayout({
		bindGroupLayouts: [bindGroupLayout],
	});

  const computePipeline = device.createComputePipeline({
    layout: pipelineLayout,
    compute: {
      module: device.createShaderModule({ code: computeShaderCode }),
      entryPoint: "main"
    }
  });

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

  const posStartBuffer = device.createBuffer({
    size: 2 * 4,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
  });

  const posEndBuffer = device.createBuffer({
    size: 2 * 4,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
  });

  const computeBindGroup = device.createBindGroup({
    layout: computePipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: canvasTexture.createView({ dimension: '2d' }) },
      { binding: 1, resource: { buffer: brushSizeBuffer } },
      { binding: 2, resource: { buffer: brushStyleBuffer } },
      { binding: 3, resource: { buffer: brushColorBuffer } },
      { binding: 4, resource: { buffer: posStartBuffer } },
			{ binding: 5, resource: { buffer: posEndBuffer } },
    ]
  });

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

  let lastPosition: { x: number, y: number } | null = null;
  function paintAt(x: number, y: number) {
    const rect = canvas.getBoundingClientRect();
    const tx = (x - rect.left) / rect.width * canvasWidth;
    const ty = (y - rect.top) / rect.height * canvasHeight;
    if (tx < 0 || ty < 0 || tx >= canvasWidth || ty >= canvasHeight) return;

    if (lastPosition) {
      device.queue.writeBuffer(posStartBuffer, 0, new Float32Array([lastPosition.x, lastPosition.y]));
      device.queue.writeBuffer(posEndBuffer, 0, new Float32Array([tx, ty]));
      draw();
    }
    lastPosition = { x: tx, y: ty };
  }

  initGestures(
    paintAt, 
    canvas, 
    () => { lastPosition = null }
  );

  config.sync = () => {
    device.queue.writeBuffer(brushSizeBuffer, 0, new Float32Array([config.brushSize]));
    device.queue.writeBuffer(brushColorBuffer, 0, new Float32Array(config.brushColor));
    device.queue.writeBuffer(brushStyleBuffer, 0, new Float32Array([config.brushStyle]));
  }
  config.sync();
}
