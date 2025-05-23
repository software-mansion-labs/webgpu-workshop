import { initGestures, config } from "./utils/tools";

export async function init() {
  if (!navigator.gpu) {
    alert("WebGPU not supported!");
    return;
  }

  // TODO: Setup WebGPU pipeline

  function frame() {
    // TODO: Animation loop
    requestAnimationFrame(frame);
  }
  frame();
}
