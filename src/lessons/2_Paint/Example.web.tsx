import React, { useEffect, useMemo, useState } from "react";
import styles from "./utils/page.module.css";
import { init } from './paint.web'
import { changeBrushSize, setBrushColor, setBrushStyle } from './utils/tools'

function Item(
  { active, name, onClick }:
  { active: string, name: string, onClick: () => void }
) {
  return (
    <div
      className={[styles.item, active == name ? styles.active : null].join(" ")}
      onClick={() => onClick()}
    >
      {name}
    </div>
  );
}

function Canva() {
  return (
    <canvas id="gpu-canvas" className={styles.canvas}></canvas>
  );
}

export default function PaintCanva() {
  const [active, setActive] = useState('Circle');
  const canva = useMemo(() => <Canva />, []);
  
  useEffect(() => {
    requestAnimationFrame(async () => {
      await init()
    });
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.toolBar}>
        <Item 
          active={active} 
          name='Circle' 
          onClick={() => {
            setBrushStyle('circle');
            setActive('Circle')
          }}
        />
        <Item 
          active={active} 
          name='Rainbow' 
          onClick={() => {
            setBrushStyle('rainbow');
            setActive('Rainbow')
          }}
        />
        <Item 
          active={active} 
          name='Spray' 
          onClick={() => {
            setBrushStyle('spray');
            setActive('Spray')
          }}
        />
        <div className={styles.item} onClick={() => changeBrushSize(5)}>➕</div>
        <div className={styles.item} onClick={() => changeBrushSize(-5)}>➖</div>
        <div
          className={styles.color}
          style={{backgroundColor: 'rgb(0, 0, 0)'}} 
          onClick={() => setBrushColor([0, 0, 0, 255])}></div>
        <div
          className={styles.color}
          style={{backgroundColor: 'rgb(255, 0, 0)'}} 
          onClick={() => setBrushColor([255, 0, 0, 255])}></div>
        <div
          className={styles.color}
          style={{backgroundColor: 'rgb(0, 255, 0)'}} 
          onClick={() => setBrushColor([0, 255, 0, 255])}></div>
        <div
          className={styles.color}
          style={{backgroundColor: 'rgb(0, 0, 255)'}} 
          onClick={() => setBrushColor([0, 0, 255, 255])}></div>
      </div>
      { canva }
    </div>
  );
}
