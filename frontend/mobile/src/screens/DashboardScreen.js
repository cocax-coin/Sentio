/**
 * Dashboard Screen - AI Insights & Analytics
 */
import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDashboard } from '../utils/api';

function InsightCard({ title, value, icon, color }) {
  return (
    <View style={[styles.insightCard, { borderLeftColor: color }]}>
      <Text style={styles.insightIcon}>{icon}</Text>
      <View style={styles.insightData}>
        <Text style={styles.insightValue}>{value}</Text>
        <Text style={styles.insightTitle}>{title}</Text>
      </View>
    </View>
  );
}

function EmotionBar({ emotion, count, total }) {
  const percentage = total > 0 ? (count / total) * 100 : 0;
  const emotionColors = {
    happy: '#FFD700', sad: '#4FC3F7', angry: '#FF6B6B',
    fearful: '#9C27B0', surprised: '#FF9800', neutral: '#90A4AE'
  };
  const emotionEmojis = {
    happy: '😊', sad: '😢', angry: '😠', fearful: '😰', surprised: '😲', neutral: '😐'
  };

  return (
    <View style={styles.emotionRow}>
      <Text style={styles.emotionEmoji}>{emotionEmojis[emotion] || '😐'}</Text>
      <Text style={styles.emotionLabel}>{emotion}</Text>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${percentage}%`, backgroundColor: emotionColors[emotion] || '#90A4AE' }]} />
      </View>
      <Text style={styles.emotionCount}>{count}</Text>
    </View>
  );
}

export default function DashboardScreen() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      const userId = await AsyncStorage.getItem('user_id');
      const result = await getDashboard(userId, token);
      setData(result);
    } catch (err) {
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#6C63FF" /></View>;
  }

  const totalEmotions = data?.emotion_distribution
    ? Object.values(data.emotion_distribution).reduce((a, b) => a + b, 0)
    : 0;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your Insights</Text>
        <Text style={styles.headerSubtitle}>AI-powered communication analytics</Text>
      </View>

      {/* Summary Cards */}
      <View style={styles.cardsGrid}>
        <InsightCard
          title="Messages Sent"
          value={data?.total_messages_sent || 0}
          icon="💬"
          color="#6C63FF"
        />
        <InsightCard
          title="Active Chats"
          value={data?.total_chats || 0}
          icon="🗨️"
          color="#25D366"
        />
        <InsightCard
          title="Response Rate"
          value={data?.response_rate || 'N/A'}
          icon="⚡"
          color="#FF9800"
        />
      </View>

      {/* Emotion Distribution */}
      {data?.emotion_distribution && Object.keys(data.emotion_distribution).length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💭 Emotion Distribution</Text>
          {Object.entries(data.emotion_distribution).map(([emotion, count]) => (
            <EmotionBar key={emotion} emotion={emotion} count={count} total={totalEmotions} />
          ))}
        </View>
      )}

      {/* Top Contacts */}
      {data?.top_contacts && data.top_contacts.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⭐ Top Contacts</Text>
          {data.top_contacts.map((contact, i) => (
            <View key={contact.user_id} style={styles.contactRow}>
              <Text style={styles.contactRank}>#{i + 1}</Text>
              <View style={styles.contactAvatar}>
                <Text style={styles.contactAvatarText}>{(contact.name || '?')[0].toUpperCase()}</Text>
              </View>
              <Text style={styles.contactName}>{contact.name}</Text>
              <Text style={styles.contactCount}>{contact.message_count} msgs</Text>
            </View>
          ))}
        </View>
      )}

      {/* Best Times */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🕐 Best Times to Communicate</Text>
        {(data?.best_communication_times || []).map((time, i) => (
          <View key={i} style={styles.timeRow}>
            <Text style={styles.timeText}>✅ {time}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { backgroundColor: '#6C63FF', padding: 25, paddingTop: 35 },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  headerSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 5 },
  cardsGrid: { padding: 16, gap: 10 },
  insightCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 12, padding: 16, borderLeftWidth: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  insightIcon: { fontSize: 28, marginRight: 12 },
  insightData: {},
  insightValue: { fontSize: 22, fontWeight: 'bold', color: '#333' },
  insightTitle: { fontSize: 13, color: '#999', marginTop: 2 },
  section: { backgroundColor: '#fff', margin: 16, marginTop: 0, borderRadius: 12, padding: 16 },
  sectionTitle: { fontSize: 17, fontWeight: 'bold', color: '#333', marginBottom: 14 },
  emotionRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  emotionEmoji: { fontSize: 18, width: 28 },
  emotionLabel: { width: 65, fontSize: 13, color: '#555', textTransform: 'capitalize' },
  barTrack: { flex: 1, height: 8, backgroundColor: '#f0f0f0', borderRadius: 4, marginHorizontal: 8 },
  barFill: { height: 8, borderRadius: 4 },
  emotionCount: { fontSize: 13, color: '#999', width: 25, textAlign: 'right' },
  contactRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  contactRank: { fontSize: 14, color: '#999', width: 25 },
  contactAvatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#6C63FF', justifyContent: 'center', alignItems: 'center', marginRight: 10,
  },
  contactAvatarText: { color: '#fff', fontWeight: 'bold' },
  contactName: { flex: 1, fontSize: 15, color: '#333' },
  contactCount: { fontSize: 13, color: '#999' },
  timeRow: { paddingVertical: 5 },
  timeText: { fontSize: 15, color: '#444' },
});
