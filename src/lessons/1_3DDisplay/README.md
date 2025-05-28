# 3D Preview

Task: Create a 3D preview of different models using three.js and react-native-wgpu.

<details>
<summary>Three.js - Theoretical introduction</summary>

https://threejs.org/  
High-level framework for 3D graphics. Visit the docs and play with interactive examples.

Docs
- https://threejs.org/docs/

Interesting materials
- https://threejs.org/examples/
- https://threejs.org/editor/
- https://discoverthreejs.com/book/

## **Key Concepts**

- Scene - essentially a world. A 3D space where you can place objects and interact with them. It contains all objects, models, lights, cameras, and everything you want to display.
- Primitives [https://threejs.org/manual/#en/primitives] - basic 3D shapes, like cubes, cylinders, cones, toruses, etc.
- Camera [https://threejs.org/manual/#en/cameras] - your point of view in the scene. The camera defines what and how you see objects in a scene. The view space of a camera is called a *frustum* (more details in the docs).
- Light [https://threejs.org/manual/#en/lights] - to see something in a scene via the camera, you need to illuminate objects. You can add many different sources of light to achieve your desired effect.
- Geometry - the geometrical description of an object. It contains the recipe for constructing the desired object from triangles.
- Model - a file that contains the description of the geometry of the desired object.
- Material [https://threejs.org/manual/#en/materials] - a property of an object, describing how the object interacts with light.
- Texture - the skin of an object. Most often, it is the image that will be applied to the geometry.
- Mesh - the physical object, a combination of Geometry and Material.
- Renderer - the backend of Three.js that physically displays something on a screen. Three.js supports two different backends: WebGL and WebGPU.

</details>

## Web

### Cube

Task: Use `steps/web/boilerplate_cube.ts` file as a starting point. Setup the Three.js renderer, scene, camera and light. Add a cube and a torus to the scene and animate them.

Result:  
<video src="https://github.com/user-attachments/assets/7b802d09-df96-4ad6-b271-9c89af6845f9" height="400" controls></video>

1.1 Setup a renderer.  
📁 `display.ts`
```ts
const renderer = new WebGPURenderer({ canvas });
renderer.setSize(width, height);
```

1.2 Setup a scene.  
📁 `display.ts`
```ts
const scene = new THREE.Scene();
```

1.3 Setup a camera.  
📁 `display.ts`
```ts
const camera = new THREE.PerspectiveCamera(70, width / height, 0.01, 10);
  camera.position.set(0, 0, 1);
```

1.3 Add a ambient source of light to the scene.  
📁 `display.ts`
```ts
const ambientConfig = {
  color: 0xffffff,
  intensity: 0.5,
};
const ambientLight = new THREE.AmbientLight(ambientConfig.color, ambientConfig.intensity);
scene.add(ambientLight);
```

1.5 Add a point source of light to the scene.  
📁 `display.ts`
```ts
const pointConfig = {
  color: 0xffffff,
  intensity: 80,
};
const pointLight = new THREE.PointLight(pointConfig.color, pointConfig.intensity);
pointLight.position.set(5, 5, 5);
scene.add(pointLight);
```

1.6 Add a metallic cube to the scene.  
📁 `display.ts`
```ts
const boxGeometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
const boxMaterial = new THREE.MeshStandardMaterial({
  color: 'rgb(229, 199, 51)',
  roughness: 0.5,
  metalness: 0.5
});
const boxMesh = new THREE.Mesh(boxGeometry, boxMaterial);
scene.add(boxMesh);
```

1.7 Add a torus to the scene.  
📁 `display.ts`
```ts
const torusGeometry = new THREE.TorusGeometry(0.2, 0.05, 16, 100);
const torusMaterial = new THREE.MeshNormalMaterial();
const torusMesh = new THREE.Mesh(torusGeometry, torusMaterial);
scene.add(torusMesh);
```

1.8 Render the scene in an animation loop.  
📁 `display.ts`
```ts
function animate() {
  // ...
  renderer.render(scene, camera);
  // ...
```

1.9 Add a rotation animation for the cube.  
📁 `display.ts`
```ts
function animate() {
  // ...
  boxMesh.rotation.x += 0.01;
  boxMesh.rotation.y += 0.01;
  // ...
```

1.10 Add rotation and position animations for the torus.  
📁 `display.ts`
```ts
function animate() {
  // ...
  torusMesh.rotation.x -= 0.01;
  torusMesh.rotation.y -= 0.01;
  torusMesh.position.x = Math.sin(torusMesh.rotation.y) * 0.4;
  torusMesh.position.y = Math.cos(torusMesh.rotation.y) * 0.4;
  // ...
```

Checkpoint: 📁 `steps/web/display_cube.ts`

### Monkey model

Task: Use `steps/web/boilerplate_monkey.ts` file as a starting point. The scene and lighting is already set up. You need to load the monkey model and add it to the scene. The model is in the `utils/model` folder. You can use the `BufferGeometryLoader` to load the model.

Result:  
<video src="https://github.com/user-attachments/assets/b2fe14de-76f0-4720-9c14-9d32cdba37cc
" height="400" controls></video>

2.1 Load monkey model.  
📁 `display.ts`
```ts
import { MODEL } from './utils/model/model';
// ...
const loader = new THREE.BufferGeometryLoader();
const geometry = loader.parse(MODEL);
```

2.2 Setup the mesh's material and add the mesh to the scene.  
📁 `display.ts`
```ts
const material = new THREE.MeshStandardMaterial({ 
  color: 'rgb(207, 40, 57)', 
  flatShading: true, 
  metalness: 0.5, 
  roughness: 0.5
});
const mesh = new THREE.Mesh(geometry, material);
scene.add(mesh);
```

2.3 Add a rotation animation for the model.  
📁 `display.ts`
```ts
function animate() {
  // ...
  mesh.rotation.x += 0.01;
  mesh.rotation.y += 0.01;
  // ...
```

Checkpoint: 📁 `steps/web/display_monkey.ts`

### Shoe model

Task: Use `steps/web/boilerplate_shoe.ts` file as a starting point. The scene and lighting is already set up. You need to load the shoe model and add it to the scene. The model is in the `utils/shoe` folder. You can use the `GLTFLoader` to load the model.

Result:  
<video src="https://github.com/user-attachments/assets/b5d583cc-edc1-4aa2-b50c-1c8c447c8bf2" height="400" controls></video>

3.1 Load the shoe model.  
📁 `display.ts`
```ts
export function init() {
  // ...
  const loader = new GLTFLoader();
  loader.load("./shoe.gltf", (model) => {
    display(model.scene, canvas, width, height);
  });
```

3.2 Add model to the scene  
📁 `display.ts`
```ts
export function display() {
  // ...
  scene.add(model);
```

3.3 Add a rotation animation for the model.  
📁 `display.ts`
```ts
function animate() {
  model!.rotation.x += 0.01;
  model!.rotation.y += 0.01;
  // ...
}
```

Checkpoint: 📁 `steps/web/display_cube.ts`

## Mobile

### Shoe model

Task: Use `steps/mobile/boilerplate.tsx` file as a starting point. You need to load the shoe model and add it to the scene. The model is in the `utils/shoe` folder. You can use the `GLTFLoader` to load the model.

Result:
<video src="https://github.com/user-attachments/assets/9f4abe1b-db67-4f32-97ec-7ceb010099fc" height="400" controls></video>

4.1 Load the shoe model.  
📁 `3DPreview.tsx`
```ts
import { useModel } from "./WebGPUMocks";
// ...
export function Preview() {
  const model = useModel(require("./utils/shoe/shoe.gltf"))!;
  // ...
```
Look at the implementation of `useModel` methods in `WebGPUMocks.tsx` file. It uses `GLTFLoader` to load the model.

4.2 Get ref to the canvas and context.  
📁 `3DPreview.tsx`
```ts
import { Canvas, useGPUContext } from "react-native-wgpu";
// ...
const { ref, context } = useGPUContext();
// ...
<Canvas
  ref={ref}
// ...
```

4.3 Setup a renderer.
📁 `3DPreview.tsx`
```ts
useEffect(() => {
  if (!model || !context) {
    return;
  }
  const renderer = makeWebGPURenderer(context);

}, [model, context]);
```

4.4 Setup a scene.  
📁 `3DPreview.tsx`
```ts
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
camera.position.z = 0.3;

const light = new THREE.DirectionalLight(0xffffff, 3);
light.position.set(5, 5, 5);
scene.add(light);

scene.add(model);
```

4.5 Run animation loop.  
📁 `3DPreview.tsx`
```ts
useEffect(() => {
  // ...
  async function animate() {
    model.rotation.x += 0.01;
    model.rotation.y += 0.01;
    await renderer.renderAsync(scene, camera);
    context!.present();
    requestAnimationFrame(animate);
  }
  animate();
  // ...
```

Checkpoint: 📁 `steps/mobile/step1.ts`

### Gesture

Task: You need to add gesture support to the shoe model. Let's use `react-native-gesture-handler` library to handle gestures. You can use `Gesture.Pan` to handle rotation - [docs](https://docs.swmansion.com/react-native-gesture-handler/docs/gestures/pan-gesture/).

Result:
<video src="https://github.com/user-attachments/assets/44caef7d-a5e7-417e-9fba-6f7ada790877" height="400" controls></video>

5.1 Add gesture handler to the canvas.
📁 `3DPreview.tsx`
```ts
import { Gesture, GestureDetector } from "react-native-gesture-handler";
// ...
const panGesture = Gesture.Pan();
// ...
<GestureDetector onGestureEvent={panGesture}>
  <Canvas
    // ...
  />
</GestureDetector>
```

5.2 Add rotation to the model.
📁 `3DPreview.tsx`
```ts
const panGesture = Gesture.Pan()
  .runOnJS(true)
  .onChange((e) => {
    model.rotation.y += e.changeX / 100;
    model.rotation.x += e.changeY / 100;
  });
```

Checkpoint: 📁 `steps/mobile/step2.ts`

## Links
- Three.js docs - https://threejs.org/docs/
- Gesture handler docs - https://docs.swmansion.com/react-native-gesture-handler/docs/
- Reanimated docs - https://docs.swmansion.com/react-native-reanimated/docs/