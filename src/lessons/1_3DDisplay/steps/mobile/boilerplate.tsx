import * as THREE from "three";
import { View } from "react-native";
import { Canvas, useGPUContext } from "react-native-wgpu";
import { useEffect } from "react";
import { makeWebGPURenderer, useModel } from "./WebGPUMocks";

export function Preview() {

  return (
    <View style={{ flex: 0.75, justifyContent: "center" }}>
      <Canvas
        transparent={true}
        style={{ flex: 1, maxHeight: 450 }}
      />
    </View>
  );
}
