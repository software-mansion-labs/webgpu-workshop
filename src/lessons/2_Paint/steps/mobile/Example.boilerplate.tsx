import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { enableGPUForWorklets, useSharedContext } from 'react-native-webgpu-worklets';
import { Canvas, useCanvasEffect } from 'react-native-wgpu';
import { GUI } from './utils/GUI';
import { init, SharedContext } from './paint';

export default function PaintCanva() {

  const ref = useCanvasEffect(async () => {
    // TODO
  });

  const canva = useMemo(() => 
    <Canvas ref={ref} style={{ flex: 1 }} />
  , []);

  return (
    <View style={styles.container}>
      { canva }
      <GUI />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
