import React, { useEffect } from "react";
import { StyleSheet, Image } from 'react-native';
import { init } from './lamp.web'

export default function LavaLamp() {
  
  useEffect(() => {
    init()
  });

  return (
    <div>
      {/* <Image
        style={styles.lamp}
        source={require('./utils/lamp.png')}
      /> */}
      <canvas 
        style={{
          width: '100wh',
          height: '100vh',
        }}
        id="gpu-canvas"
      ></canvas>
    </div>
  );
}

const styles = StyleSheet.create({
  lamp: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: 1,
  }
});
