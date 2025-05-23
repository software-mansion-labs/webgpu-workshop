import * as THREE from "three";
import { View } from "react-native";
import { Canvas, useGPUContext } from "react-native-wgpu";
import { useEffect } from "react";
import { makeWebGPURenderer, useModel } from "./WebGPUMocks";
import { Gesture, GestureDetector } from "react-native-gesture-handler";

export function Preview() {
  
  const model = useModel(require("./shoe.gltf"))!;
  const { ref, context } = useGPUContext();

  useEffect(() => {
    if (!model || !context) {
      return;
    }
    const { width, height } = context.canvas;
    
    const renderer = makeWebGPURenderer(context);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 0.3;

    const light = new THREE.DirectionalLight(0xffffff, 3);
    light.position.set(5, 5, 5);
    scene.add(light);

    scene.add(model);

    async function animate() {
      await renderer.renderAsync(scene, camera);
      context!.present();
      requestAnimationFrame(animate);
    }
    animate();

  }, [model, context]);

  const panGesture = Gesture.Pan()
    .runOnJS(true)
    .onChange((e) => {
      model.rotation.y += e.changeX / 100;
      model.rotation.x += e.changeY / 100;
    });

  return (
    <View style={{ flex: 0.75, justifyContent: "center" }}>
      <GestureDetector gesture={panGesture}>
        <Canvas
          ref={ref}
          transparent={true}
          style={{ flex: 1, maxHeight: 450 }}
        />
      </GestureDetector>
    </View>
  );
}

