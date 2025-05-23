import * as THREE from 'three';
import { WebGPURenderer } from 'three/webgpu';

export function init() {
  const width = window.innerWidth;
  const height = window.innerHeight;

  const canvas = document.getElementById('gpu-canvas') as HTMLCanvasElement;
  const renderer = new WebGPURenderer({ canvas });
  renderer.setSize(width, height);

  const scene = new THREE.Scene();
  
  const camera = new THREE.PerspectiveCamera(70, width / height, 0.01, 10);
  camera.position.set(0, 0, 1);

  const ambientConfig = {
    color: 0xffffff,
    intensity: 0.5,
  };
  const ambientLight = new THREE.AmbientLight(ambientConfig.color, ambientConfig.intensity);
  scene.add(ambientLight);

  const pointConfig = {
    color: 0xffffff,
    intensity: 80,
  };
  const pointLight = new THREE.PointLight(pointConfig.color, pointConfig.intensity);
  pointLight.position.set(5, 5, 5);
  scene.add(pointLight);

  const boxGeometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
  const boxMaterial = new THREE.MeshStandardMaterial({
    color: 'rgb(229, 199, 51)',
    roughness: 0.5,
    metalness: 0.5
  });
  const boxMesh = new THREE.Mesh(boxGeometry, boxMaterial);
  scene.add(boxMesh);

  const torusGeometry = new THREE.TorusGeometry(0.2, 0.05, 16, 100);
  const torusMaterial = new THREE.MeshNormalMaterial();
  const torusMesh = new THREE.Mesh(torusGeometry, torusMaterial);
  scene.add(torusMesh);

  function animate() {
    boxMesh.rotation.x += 0.01;
    boxMesh.rotation.y += 0.01;

    torusMesh.rotation.x -= 0.01;
    torusMesh.rotation.y -= 0.01;
    torusMesh.position.x = Math.sin(torusMesh.rotation.y) * 0.4;
    torusMesh.position.y = Math.cos(torusMesh.rotation.y) * 0.4;

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }
  animate();
}
