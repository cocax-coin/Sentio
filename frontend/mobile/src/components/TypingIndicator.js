/**
 * Animated typing indicator
 */
import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';

export default function TypingIndicator({ name }) {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = (dot, delay) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: -6, duration: 300, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 300, useNativeDriver: true }),
          Animated.delay(600),
        ])
      ).start();
    };
    animate(dot1, 0);
    animate(dot2, 150);
    animate(dot3, 300);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.bubble}>
        {name && <Text style={styles.name}>{name}</Text>}
        <View style={styles.dots}>
          {[dot1, dot2, dot3].map((dot, i) => (
            <Animated.View key={i} style={[styles.dot, { transform: [{ translateY: dot }] }]} />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignSelf: 'flex-start', margin: 8 },
  bubble: { backgroundColor: '#fff', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
  name: { fontSize: 11, color: '#6C63FF', marginBottom: 4 },
  dots: { flexDirection: 'row', alignItems: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#999', marginHorizontal: 2 },
});
