import { useEffect, useState } from "react";
import { GLTFLoader, type GLTF } from "three/addons/loaders/GLTFLoader";
import * as THREE from "three";
import { Image } from "react-native";
import type { NativeCanvas } from "react-native-wgpu";

const resolveAsset = (mod: ReturnType<typeof require>) => {
  // @ts-ignore
  return Image.resolveAssetSource(mod).uri;
};

function flipTexture(mesh: THREE.Mesh) {
  const mapsToFlip = [
    // typescript ignore next 4 lines please
    // @ts-ignore
    mesh.material.map, // Diffuse map
    // @ts-ignore
    mesh.material.normalMap, // Normal map
    // @ts-ignore
    mesh.material.roughnessMap, // Roughness map
    // @ts-ignore
    mesh.material.metalnessMap, // Metalness map
    // @ts-ignore
    mesh.material.aoMap, // Ambient occlusion map
  ];

  mapsToFlip.forEach((map) => {
    if (map) {
      map.wrapS = THREE.RepeatWrapping;
      // flip vertically
      map.repeat.y = -1;
      map.needsUpdate = true;
    }
  });
}

export function useModel(asset: ReturnType<typeof require>) {
  const [model, setModel] = useState<GLTF["scene"]>();
  useEffect(() => {
    const loader = new GLTFLoader();
    const url = resolveAsset(asset);
    loader.load(url, (model: GLTF) => {
      model.scene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          flipTexture(child);
        }
      });
      setModel(model.scene);
    });
  }, [asset]);
  return model;
};

export class ReactNativeCanvas {
  constructor(private canvas: NativeCanvas) {}
  get width() {
    return this.canvas.width;
  }
  get height() {
    return this.canvas.height;
  }
  set width(width: number) {
    this.canvas.width = width;
  }
  set height(height: number) {
    this.canvas.height = height;
  }
  get clientWidth() {
    return this.canvas.width;
  }
  get clientHeight() {
    return this.canvas.height;
  }
  set clientWidth(width: number) {
    this.canvas.width = width;
  }
  set clientHeight(height: number) {
    this.canvas.height = height;
  }
  addEventListener(_type: string, _listener: EventListener) {}
  removeEventListener(_type: string, _listener: EventListener) {}
  dispatchEvent(_event: Event) {}
  setPointerCapture() {}
  releasePointerCapture() {}
}

export const makeWebGPURenderer = (
  context: GPUCanvasContext,
  { antialias = true }: { antialias?: boolean } = {},
) => {
  return new THREE.WebGPURenderer({
    antialias,
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    canvas: new ReactNativeCanvas(context.canvas),
    context,
  });
};
