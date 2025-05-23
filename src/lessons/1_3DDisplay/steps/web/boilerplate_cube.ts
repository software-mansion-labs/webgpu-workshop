export function init() {
  const width = window.innerWidth;
  const height = window.innerHeight;

  const canvas = document.getElementById('gpu-canvas');

  // TODO: scene setup
  
  function animate() {
    // TODO: animation loop
    requestAnimationFrame(animate);
  }
  animate();

}
