import { StyleSheet, View, Image } from 'react-native';
import { enableGPUForWorklets } from 'react-native-webgpu-worklets';
import { Canvas, useCanvasEffect } from 'react-native-wgpu';
import { init } from './lamp';

export default function LavaLamp() {

  const ref = useCanvasEffect(async () => {
    enableGPUForWorklets();
    await init(ref);
  });

  return (
    <View style={{ flex: 1 }}>
      {/* <Image
        style={styles.lamp}
        source={require('./utils/lamp.png')}
      /> */}
      <Canvas ref={ref} style={styles.container} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  lamp: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: 1,
    transform: [
      { scale: 1.2 },
    ]
  }
});
