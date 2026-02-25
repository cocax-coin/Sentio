/**
 * Reusable ChatBubble component
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function ChatBubble({ message, isOwn, showEmotion = true }) {
  return (
    <View style={[styles.container, isOwn ? styles.ownContainer : styles.otherContainer]}>
      <View style={[styles.bubble, isOwn ? styles.ownBubble : styles.otherBubble]}>
        {showEmotion && message.emotion && !isOwn && (
          <Text style={styles.emotion}>
            {({ happy: '😊', sad: '😢', angry: '😠', fearful: '😰', surprised: '😲' })[message.emotion] || ''}
          </Text>
        )}
        <Text style={[styles.text, isOwn && styles.ownText]}>{message.content}</Text>
        <Text style={[styles.time, isOwn && styles.ownTime]}>
          {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          {isOwn && ` ${message.status === 'read' ? '✓✓' : '✓'}`}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginVertical: 2, maxWidth: '80%' },
  ownContainer: { alignSelf: 'flex-end' },
  otherContainer: { alignSelf: 'flex-start' },
  bubble: { borderRadius: 12, padding: 10 },
  ownBubble: { backgroundColor: '#DCF8C6' },
  otherBubble: { backgroundColor: '#fff' },
  text: { fontSize: 16, color: '#333' },
  ownText: { color: '#333' },
  time: { fontSize: 11, color: '#999', textAlign: 'right', marginTop: 3 },
  ownTime: { color: '#555' },
  emotion: { fontSize: 14, marginBottom: 2 },
});
