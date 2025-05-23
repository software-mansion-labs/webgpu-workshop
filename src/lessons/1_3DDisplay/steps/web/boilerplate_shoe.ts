import * as THREE from 'three';
import { WebGPURenderer } from 'three/webgpu';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export function init() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const canvas = document.getElementById('gpu-canvas') as HTMLCanvasElement;
  // TODO: load model
}

function display(model: THREE.Group | null, canvas: HTMLCanvasElement, width: number, height: number) {
  if (!model) {
    return;
  }
  const renderer = new WebGPURenderer({ canvas });
  renderer.setSize(width, height);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
  camera.position.z = 0.5;

  const light = new THREE.DirectionalLight(0xffffff, 3);
  light.position.set(5, 5, 5);
  scene.add(light);

  // TODO: add model to scene

  function animate() {
    // TODO: rotate model
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }
  animate();
}
