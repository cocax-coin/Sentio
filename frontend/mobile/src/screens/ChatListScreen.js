/**
 * Chat List Screen - WhatsApp-like chat list
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  TextInput, Image, RefreshControl, ActivityIndicator
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getChatList } from '../utils/api';

function formatTime(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diff = now - date;
  if (diff < 86400000) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (diff < 604800000) {
    return ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][date.getDay()];
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function ChatItem({ chat, onPress }) {
  const hasUnread = chat.unread_count > 0;
  const initial = (chat.name || '?')[0].toUpperCase();

  return (
    <TouchableOpacity style={styles.chatItem} onPress={() => onPress(chat)}>
      <View style={styles.avatar}>
        {chat.picture ? (
          <Image source={{ uri: chat.picture }} style={styles.avatarImage} />
        ) : (
          <Text style={styles.avatarText}>{initial}</Text>
        )}
        <View style={styles.onlineIndicator} />
      </View>
      <View style={styles.chatInfo}>
        <View style={styles.chatHeader}>
          <Text style={[styles.chatName, hasUnread && styles.chatNameBold]} numberOfLines={1}>
            {chat.name || 'Unknown'}
          </Text>
          <Text style={[styles.chatTime, hasUnread && styles.chatTimeUnread]}>
            {formatTime(chat.last_message?.created_at)}
          </Text>
        </View>
        <View style={styles.chatPreview}>
          <Text style={[styles.lastMessage, hasUnread && styles.lastMessageBold]} numberOfLines={1}>
            {chat.last_message?.content || 'No messages yet'}
          </Text>
          {hasUnread && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadCount}>
                {chat.unread_count > 99 ? '99+' : chat.unread_count}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function ChatListScreen({ navigation }) {
  const [chats, setChats] = useState([]);
  const [filteredChats, setFilteredChats] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadChats = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      const data = await getChatList(token);
      setChats(data.chats || []);
      setFilteredChats(data.chats || []);
    } catch (err) {
      console.error('Failed to load chats:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadChats();
    const interval = setInterval(loadChats, 10000);
    return () => clearInterval(interval);
  }, [loadChats]);

  useEffect(() => {
    if (searchQuery) {
      setFilteredChats(chats.filter(c =>
        c.name?.toLowerCase().includes(searchQuery.toLowerCase())
      ));
    } else {
      setFilteredChats(chats);
    }
  }, [searchQuery, chats]);

  const handleChatPress = (chat) => {
    navigation.navigate('Chat', { chatId: chat.chat_id, chatName: chat.name });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6C63FF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="🔍 Search chats..."
          placeholderTextColor="#aaa"
        />
      </View>

      <FlatList
        data={filteredChats}
        keyExtractor={(item) => String(item.chat_id)}
        renderItem={({ item }) => <ChatItem chat={item} onPress={handleChatPress} />}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadChats(); }} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>💬</Text>
            <Text style={styles.emptyTitle}>No chats yet</Text>
            <Text style={styles.emptySubtitle}>Start a conversation!</Text>
          </View>
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('Contacts')}
      >
        <Text style={styles.fabText}>✏️</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  searchContainer: { padding: 10, backgroundColor: '#f8f8f8' },
  searchInput: {
    backgroundColor: '#fff', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8,
    fontSize: 16, borderWidth: 1, borderColor: '#eee',
  },
  chatItem: { flexDirection: 'row', padding: 16, alignItems: 'center' },
  avatar: { position: 'relative' },
  avatarImage: { width: 55, height: 55, borderRadius: 27.5 },
  avatarText: {
    width: 55, height: 55, borderRadius: 27.5,
    backgroundColor: '#6C63FF', textAlign: 'center', lineHeight: 55,
    fontSize: 22, fontWeight: 'bold', color: '#fff',
  },
  onlineIndicator: {
    position: 'absolute', bottom: 2, right: 2,
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: '#25D366', borderWidth: 2, borderColor: '#fff',
  },
  chatInfo: { flex: 1, marginLeft: 12 },
  chatHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  chatName: { fontSize: 16, color: '#333', flex: 1, marginRight: 8 },
  chatNameBold: { fontWeight: 'bold' },
  chatTime: { fontSize: 12, color: '#999' },
  chatTimeUnread: { color: '#6C63FF', fontWeight: '600' },
  chatPreview: { flexDirection: 'row', alignItems: 'center' },
  lastMessage: { fontSize: 14, color: '#999', flex: 1 },
  lastMessageBold: { color: '#333', fontWeight: '500' },
  unreadBadge: {
    backgroundColor: '#6C63FF', borderRadius: 12, minWidth: 22, height: 22,
    justifyContent: 'center', alignItems: 'center', paddingHorizontal: 6,
  },
  unreadCount: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  separator: { height: 1, backgroundColor: '#f0f0f0', marginLeft: 83 },
  emptyContainer: { padding: 60, alignItems: 'center' },
  emptyText: { fontSize: 64 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginTop: 16 },
  emptySubtitle: { fontSize: 14, color: '#999', marginTop: 8 },
  fab: {
    position: 'absolute', bottom: 20, right: 20,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#6C63FF', justifyContent: 'center', alignItems: 'center',
    shadowColor: '#6C63FF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 8,
  },
  fabText: { fontSize: 22 },
});
