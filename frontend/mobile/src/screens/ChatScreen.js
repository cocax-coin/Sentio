/**
 * Chat Screen - Real-time messaging interface
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getMessages, sendMessage, getSmartReplies } from '../utils/api';
import { API_BASE_URL } from '../utils/api';

const WS_URL = API_BASE_URL.replace('http', 'ws');

function ChatBubble({ message, isOwn }) {
  const getStatusIcon = (status) => {
    if (status === 'read') return '✓✓';
    if (status === 'delivered') return '✓✓';
    return '✓';
  };

  const getEmotionEmoji = (emotion) => {
    const map = { happy: '😊', sad: '😢', angry: '😠', fearful: '😰', surprised: '😲', neutral: '' };
    return map[emotion] || '';
  };

  return (
    <View style={[styles.bubbleContainer, isOwn ? styles.ownBubble : styles.otherBubble]}>
      {message.emotion && !isOwn && (
        <Text style={styles.emotionIndicator}>{getEmotionEmoji(message.emotion)}</Text>
      )}
      <View style={[styles.bubble, isOwn ? styles.ownBubbleContent : styles.otherBubbleContent]}>
        <Text style={[styles.messageText, isOwn && styles.ownMessageText]}>
          {message.content}
        </Text>
        <View style={styles.messageMeta}>
          <Text style={[styles.messageTime, isOwn && styles.ownMessageTime]}>
            {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
          {isOwn && (
            <Text style={[styles.statusIcon, message.status === 'read' && styles.readStatus]}>
              {getStatusIcon(message.status)}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}

function TypingIndicator() {
  return (
    <View style={styles.typingContainer}>
      <View style={styles.typingBubble}>
        <Text style={styles.typingText}>● ● ●</Text>
      </View>
    </View>
  );
}

export default function ChatScreen({ navigation, route }) {
  const { chatId, chatName } = route.params;
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [smartReplies, setSmartReplies] = useState([]);
  const [userId, setUserId] = useState(null);
  const flatListRef = useRef(null);
  const wsRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    navigation.setOptions({ title: chatName });
    initChat();
    return () => {
      if (wsRef.current) wsRef.current.close();
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [chatId]);

  const initChat = async () => {
    const uid = await AsyncStorage.getItem('user_id');
    const token = await AsyncStorage.getItem('auth_token');
    setUserId(parseInt(uid));
    await loadMessages(token);
    connectWebSocket(parseInt(uid));
  };

  const loadMessages = async (token) => {
    try {
      const data = await getMessages(chatId, token);
      setMessages(data.messages || []);
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const connectWebSocket = (uid) => {
    try {
      wsRef.current = new WebSocket(`${WS_URL}/api/chat/ws/${uid}`);
      wsRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'new_message' && data.chat_id === chatId) {
          setMessages((prev) => [...prev, data]);
          setIsTyping(false);
          loadSmartReplies(data.content);
        } else if (data.type === 'typing' && data.chat_id === chatId) {
          setIsTyping(data.is_typing);
        } else if (data.type === 'read_receipt') {
          setMessages((prev) =>
            prev.map((m) => m.id === data.message_id ? { ...m, status: 'read' } : m)
          );
        }
      };
    } catch (e) {
      console.error('WebSocket error:', e);
    }
  };

  const loadSmartReplies = async (lastMessage) => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      const data = await getSmartReplies(chatId, lastMessage, token);
      setSmartReplies(data.suggestions || []);
    } catch (e) {
      setSmartReplies([]);
    }
  };

  const handleSend = async (text) => {
    const content = (text || inputText).trim();
    if (!content) return;

    setSending(true);
    const token = await AsyncStorage.getItem('auth_token');
    const tempId = Date.now();

    // Optimistic update
    const tempMessage = {
      id: tempId,
      chat_id: chatId,
      sender_id: userId,
      content,
      message_type: 'text',
      status: 'sent',
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMessage]);
    setInputText('');
    setSmartReplies([]);

    try {
      const result = await sendMessage(chatId, content, token);
      setMessages((prev) =>
        prev.map((m) => m.id === tempId ? { ...m, id: result.message_id } : m)
      );
    } catch (err) {
      Alert.alert('Error', 'Failed to send message');
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    } finally {
      setSending(false);
    }
  };

  const handleTyping = (text) => {
    setInputText(text);
    if (wsRef.current?.readyState === 1) {
      wsRef.current.send(JSON.stringify({ type: 'typing', chat_id: chatId, is_typing: true }));
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        wsRef.current?.send(JSON.stringify({ type: 'typing', chat_id: chatId, is_typing: false }));
      }, 1500);
    }
  };

  if (loading) {
    return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#6C63FF" /></View>;
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <ChatBubble message={item} isOwn={item.sender_id === userId} />
        )}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        ListFooterComponent={isTyping ? <TypingIndicator /> : null}
        contentContainerStyle={styles.messageList}
      />

      {/* Smart Replies */}
      {smartReplies.length > 0 && (
        <View style={styles.smartRepliesContainer}>
          {smartReplies.map((reply, index) => (
            <TouchableOpacity
              key={index}
              style={styles.smartReply}
              onPress={() => handleSend(reply)}
            >
              <Text style={styles.smartReplyText}>{reply}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Input Bar */}
      <View style={styles.inputBar}>
        <TouchableOpacity style={styles.attachButton}>
          <Text style={styles.attachIcon}>📎</Text>
        </TouchableOpacity>
        <TextInput
          style={styles.textInput}
          value={inputText}
          onChangeText={handleTyping}
          placeholder="Type a message..."
          placeholderTextColor="#aaa"
          multiline
          maxHeight={100}
        />
        <TouchableOpacity style={styles.audioButton}>
          <Text style={styles.audioIcon}>{inputText ? '' : '🎤'}</Text>
        </TouchableOpacity>
        {inputText.length > 0 && (
          <TouchableOpacity
            style={[styles.sendButton, sending && styles.sendButtonDisabled]}
            onPress={() => handleSend()}
            disabled={sending}
          >
            {sending ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.sendIcon}>➤</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ECE5DD' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  messageList: { padding: 10 },
  bubbleContainer: { marginVertical: 2, maxWidth: '80%' },
  ownBubble: { alignSelf: 'flex-end' },
  otherBubble: { alignSelf: 'flex-start' },
  bubble: { borderRadius: 12, padding: 10, paddingBottom: 6 },
  ownBubbleContent: { backgroundColor: '#DCF8C6' },
  otherBubbleContent: { backgroundColor: '#fff' },
  messageText: { fontSize: 16, color: '#333' },
  ownMessageText: { color: '#333' },
  messageMeta: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginTop: 2 },
  messageTime: { fontSize: 11, color: '#999' },
  ownMessageTime: { color: '#555' },
  statusIcon: { fontSize: 12, color: '#999', marginLeft: 3 },
  readStatus: { color: '#4FC3F7' },
  emotionIndicator: { fontSize: 16, marginBottom: 2, marginLeft: 5 },
  typingContainer: { alignSelf: 'flex-start', marginLeft: 10, marginVertical: 5 },
  typingBubble: { backgroundColor: '#fff', borderRadius: 18, padding: 12 },
  typingText: { color: '#999', fontSize: 16, letterSpacing: 4 },
  smartRepliesContainer: {
    flexDirection: 'row', flexWrap: 'wrap', padding: 8,
    backgroundColor: '#fff', borderTopWidth: 1, borderColor: '#eee',
  },
  smartReply: {
    borderWidth: 1, borderColor: '#6C63FF', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 7, margin: 3,
  },
  smartReplyText: { color: '#6C63FF', fontSize: 13 },
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end',
    padding: 8, backgroundColor: '#fff', borderTopWidth: 1, borderColor: '#eee',
  },
  attachButton: { padding: 8 },
  attachIcon: { fontSize: 22 },
  textInput: {
    flex: 1, minHeight: 40, maxHeight: 100, borderRadius: 20,
    backgroundColor: '#f5f5f5', paddingHorizontal: 16, paddingVertical: 8,
    fontSize: 16, marginHorizontal: 5,
  },
  audioButton: { padding: 8 },
  audioIcon: { fontSize: 22 },
  sendButton: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#6C63FF', justifyContent: 'center', alignItems: 'center',
  },
  sendButtonDisabled: { opacity: 0.7 },
  sendIcon: { color: '#fff', fontSize: 16 },
});
