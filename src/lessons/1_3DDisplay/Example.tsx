import { useRef, useState, type Component } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  Pressable,
  Dimensions,
} from "react-native";
import Animated, {
  useAnimatedRef,
  type AnimatedRef,
} from "react-native-reanimated";
import EvilIcons from "@expo/vector-icons/EvilIcons";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Preview } from "@/lessons/1_3DDisplay/3DPreview";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import Entypo from "@expo/vector-icons/Entypo";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function Header({
  counter,
  cartRef,
}: {
  counter: number;
  cartRef: AnimatedRef<Component>;
}) {
  const [isFocused, setFocus] = useState(false);
  const [headerHeight, setHeaderHeight] = useState<number | undefined>(
    undefined,
  );
  const inputRef = useRef<TextInput>(null);

  const handleCancel = () => {
    if (inputRef?.current) {
      inputRef.current.blur();
      inputRef.current.clear();
    }
  };

  return (
    <>
      <Animated.View
        style={[
          styles.header,
          {
            opacity: isFocused ? 0 : 1,
            marginTop: isFocused ? -headerHeight! : 0,
          },
        ]}
        onLayout={(event) => {
          if (headerHeight === undefined) {
            setHeaderHeight(event.nativeEvent.layout.height);
          }
        }}
      >
        <Text style={styles.headerText}>tienda</Text>
        <Animated.View style={styles.cart} ref={cartRef}>
          <FontAwesome name="shopping-cart" size={16} color="#450a0a" />

          {counter > 0 && (
            <Animated.View style={styles.counter}>
              <Text style={styles.counterText}>{counter}</Text>
            </Animated.View>
          )}
        </Animated.View>
      </Animated.View>
      <View style={styles.searchBarWrapper}>
        <View style={styles.searchBar}>
          <EvilIcons name="search" size={24} color="black" />
          <TextInput
            ref={inputRef}
            placeholder="Search"
            placeholderTextColor={"black"}
            onBlur={() => setFocus(false)}
            onFocus={() => setFocus(true)}
            style={styles.searchBarTextInput}
          />
        </View>
        <AnimatedPressable
          onPress={handleCancel}
          style={[
            styles.button,
            {
              width: isFocused ? 50 : 0,
              marginLeft: isFocused ? 8 : 0,
            },
          ]}
        >
          <Text
            style={styles.buttonText}
            numberOfLines={1}
            ellipsizeMode="clip"
          >
            Cancel
          </Text>
        </AnimatedPressable>
      </View>
    </>
  );
}

function Details() {
  return (
    <View style={styles.content}>
      <Text style={styles.price}>$220.99</Text>
      <View style={styles.row}>
        <Text style={styles.name}>Nike Roshe Run</Text>
        <View style={styles.priceRow}>
          {new Array(5).fill(null).map((_, i) => (
            <Animated.View key={i}>
              <Entypo name="star" size={14} color="#fbbf24" />
            </Animated.View>
          ))}
          <Animated.Text>4.97</Animated.Text>
        </View>
      </View>
      <View style={styles.shippingRow}>
        <MaterialIcons name="local-shipping" size={16} color="#15803d" />
        <Text style={styles.shipping}>Free shipping</Text>
      </View>
      <View style={styles.shippingTo}>
        <Text style={styles.shippingToText}>Shipping to Tenerife</Text>
      </View>
    </View>
  );
}

function BuyButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPressOut={() => {
        onPress();
      }}
    >
      <Animated.View style={styles.buyButton}>
        <Text style={styles.buyButtonText}>Buy</Text>
      </Animated.View>
      <Animated.View style={styles.buttonBackground} />
    </Pressable>
  );
}

export default function Display() {
  const cartRef = useAnimatedRef();
  const insets = useSafeAreaInsets();
  const [counter, setCounter] = useState(0);

  const incrementCart = () => {
    setCounter(counter + 1);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Header counter={counter} cartRef={cartRef} />
      <Preview />
      <Details />
      <View style={[styles.sheet, { paddingBottom: insets.bottom }]}>
        <BuyButton onPress={incrementCart} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fafafa",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 6,
    marginHorizontal: 8,
  },
  cart: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#f0f1f6",
    justifyContent: "center",
    alignItems: "center",
  },
  headerText: {
    fontSize: 36,
    fontWeight: "bold",
    fontFamily: "Menlo",
    color: "#7f1d1d",
  },
  searchBarWrapper: {
    flexDirection: "row",
    maxWidth: Dimensions.get("window").width,
    marginHorizontal: 8,
  },
  searchBar: {
    fontSize: 20,
    flexDirection: "row",
    alignItems: "center",
    color: "#64748b",
    backgroundColor: "#f0f1f6",
    height: 50,
    flex: 1,
    borderRadius: 12,
    paddingLeft: 4,
    gap: 10,
  },
  searchBarTextInput: {
    width: "100%",
    height: "100%",
  },
  button: {
    justifyContent: "center",
  },
  buttonText: {
    color: "#3b82f6",
    fontWeight: "bold",
  },
  skeleton: {
    margin: 8,
    width: Dimensions.get("window").width - 16,
    aspectRatio: 0.8,
    borderCurve: "continuous",
    borderRadius: 12,
    overflow: "hidden",
  },
  gradient: {
    flex: 1,
    width: "300%",
    marginHorizontal: "-100%",
    [process.env.EXPO_OS === "web"
      ? "backgroundImage"
      : "experimental_backgroundImage"]:
      "linear-gradient(100deg, #f0f1f6 46%, #fafafa 50%, #f0f1f6 54%)",
  },
  price: {
    fontSize: 22,
  },
  content: {
    marginHorizontal: 8,
    gap: 4,
  },
  sheet: {
    height: 100,
    width: "100%",
    backgroundColor: "#f0f1f6",
    position: "absolute",
    zIndex: 100,
    bottom: 0,
    paddingTop: 10,
    paddingHorizontal: 8,
  },
  buyButton: {
    backgroundColor: "rgb(208, 49, 49)",
    padding: 8,
    borderRadius: 8,
  },
  buttonBackground: {
    backgroundColor: "rgb(165, 41, 41)",
    borderRadius: 8,
    height: 40,
    transform: [{ translateY: -32 }],
    zIndex: -1,
  },
  buyButtonText: {
    color: "white",
    fontSize: 22,
    textAlign: "center",
    fontWeight: "bold",
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "rgb(208, 49, 49)",
    position: "absolute",
    zIndex: 5,
    left: "53%",
    bottom: 10,
  },
  counter: {
    position: "absolute",
    top: -8,
    left: -8,
    backgroundColor: "rgb(208, 49, 49)",
    borderRadius: 8,
    width: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  counterText: {
    color: "white",
    fontSize: 11,
    fontFamily: "Menlo",
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  name: {
    fontWeight: "bold",
  },
  shippingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  shipping: {
    fontSize: 16,
    color: "#15803d",
  },
  shippingTo: {
    borderRadius: 6,
    padding: 3,
    backgroundColor: "#ecfdf5",
  },
  shippingToText: {
    color: "#15803d",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
});
