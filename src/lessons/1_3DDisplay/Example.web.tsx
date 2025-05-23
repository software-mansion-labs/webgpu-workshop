'use client';
import React, { useEffect } from "react";
import { init } from './display'

export default function Display() {
  
  useEffect(() => {
    init()
  });

  return (
    <div>
      <canvas 
        style={{ 
          display: 'block',
          width: '100wh',
          height: '100vh',
        }}
        id="gpu-canvas"
      ></canvas>
    </div>
  );
}
