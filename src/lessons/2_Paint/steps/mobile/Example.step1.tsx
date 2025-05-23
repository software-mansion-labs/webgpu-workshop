import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { enableGPUForWorklets, useSharedContext } from 'react-native-webgpu-worklets';
import { Canvas, useCanvasEffect } from 'react-native-wgpu';
import { GUI } from './utils/GUI';
import { init, SharedContext } from './paint';

export default function PaintCanva() {

  const sharedContext = useSharedContext<SharedContext>({
    lastPosition: null,
    gestureCallback: (_x: number, _y: number) => {
      'worklet';
    },
  });

  const ref = useCanvasEffect(async () => {
    enableGPUForWorklets();
    await init(ref, sharedContext);
  });

  const canva = useMemo(() => 
    <Canvas ref={ref} style={{ flex: 1 }} />
  , []);

  const panGesture = Gesture.Pan()
    .onBegin((e) => {
      sharedContext.value.gestureCallback(e.x, e.y);
    })
    .onUpdate((e) => {
      sharedContext.value.gestureCallback(e.x, e.y);
    })
    .onEnd((_e) => {
      sharedContext.value.lastPosition = null;
    });

  return (
    <View style={styles.container}>
      <GestureDetector gesture={panGesture}>
        { canva }
      </GestureDetector>
      <GUI />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
