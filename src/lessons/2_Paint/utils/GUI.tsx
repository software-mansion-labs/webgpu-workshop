import { useState } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';
import { changeBrushSize, setBrushColor, setBrushStyle } from './tools';

function Item(
  { active, name, emoji, onClick }:
  { active: string, name: string, emoji: string, onClick: () => void }
) {
  return (
    <Pressable
      style={[styles.item, active == name ? styles.active : null]}
      onPress={() => onClick()}
    >
      <Text>{emoji}</Text>
    </Pressable>
  );
}

export function GUI() {
  const [active, setActive] = useState('Circle');

  return (
    <View style={styles.toolBar}>
      <Item 
        active={active} 
        name='Circle'
        emoji='🖌️'
        onClick={() => {
          setBrushStyle('circle');
          setActive('Circle')
        }}
      />
      <Item 
        active={active} 
        name='Rainbow'
        emoji='🌈'
        onClick={() => {
          setBrushStyle('rainbow');
          setActive('Rainbow')
        }}
      />
      <Item 
        active={active} 
        name='Spray'
        emoji='🧯'
        onClick={() => {
          setBrushStyle('spray');
          setActive('Spray')
        }}
      />
      <Pressable 
        style={styles.item} 
        onPress={() => changeBrushSize(5)}>
        <Text>➕</Text>
      </Pressable>
      <Pressable
        style={styles.item}
        onPress={() => changeBrushSize(-5)}>
        <Text>➖</Text>
      </Pressable>
      <Pressable 
        onPress={() => setBrushColor([0, 0, 0, 255])} 
        style={[styles.color, styles.black]} />
      <Pressable 
        onPress={() => setBrushColor([255, 0, 0, 255])} 
        style={[styles.color, {backgroundColor: 'rgb(255, 0, 0)'}]} />
      <Pressable
        onPress={() => setBrushColor([0, 255, 0, 255])}
        style={[styles.color, {backgroundColor: 'rgb(0, 255, 0)'}]} />
      <Pressable
        onPress={() => setBrushColor([0, 0, 255, 255])}
        style={[styles.color, {backgroundColor: 'rgb(0, 0, 255)'}]} />
    </View>
  );
}

const styles = StyleSheet.create({
  toolBar: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: 'black',
    padding: 10,
    paddingTop: 10,
    paddingBottom: 25,
    position: 'absolute',
    bottom: 0,
    boxShadow: '0px 0px 5px rgba(0, 0, 0, 0.3)',
  },
  item: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: 'black',
  },
  active: {
    backgroundColor: 'rgb(200, 200, 200)',
  },
  color: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'black',
  },
  black: {
    backgroundColor: 'rgb(0, 0, 0)',
  }
});
