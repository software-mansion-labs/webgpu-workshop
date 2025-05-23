import * as THREE from 'three';
import { WebGPURenderer } from 'three/webgpu';
import { MODEL } from './utils/model/model';

export function init() {
  const width = window.innerWidth;
  const height = window.innerHeight;

  const canvas = document.getElementById('gpu-canvas') as HTMLCanvasElement;
  const renderer = new WebGPURenderer({ canvas });
  renderer.setSize(width, height);
  
  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
  camera.position.set(0, 0, 5);

  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(0, 0.1, 1);
  scene.add(light);

  const loader = new THREE.BufferGeometryLoader();
  const geometry = loader.parse(MODEL);

  const material = new THREE.MeshStandardMaterial({ 
    color: 'rgb(207, 40, 57)', 
    flatShading: true, 
    metalness: 0.5, 
    roughness: 0.5
  });
  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  function animate() {
    mesh.rotation.x += 0.01;
    mesh.rotation.y += 0.01;
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }
  animate();
}
