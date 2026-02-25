/**
 * API utilities for Sentio
 * Handles all HTTP requests to the backend
 */
import axios from 'axios';

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Auth
export const requestOTP = async (phoneNumber) => {
  const { data } = await api.post('/api/auth/request-otp', { phone_number: phoneNumber });
  return data;
};

export const verifyOTP = async (phoneNumber, otpCode) => {
  const { data } = await api.post('/api/auth/verify-otp', {
    phone_number: phoneNumber,
    otp_code: otpCode,
  });
  return data;
};

export const getProfile = async (token) => {
  const { data } = await api.get(`/api/auth/me?token=${token}`);
  return data;
};

export const updateProfile = async (profileData, token) => {
  const { data } = await api.put(`/api/auth/profile?token=${token}`, profileData);
  return data;
};

// Chat
export const getChatList = async (token) => {
  const { data } = await api.get(`/api/chat/list?token=${token}`);
  return data;
};

export const createChat = async (participantId, token) => {
  const { data } = await api.post(`/api/chat/create?token=${token}`, {
    participant_id: participantId,
  });
  return data;
};

export const getMessages = async (chatId, token, page = 1) => {
  const { data } = await api.get(
    `/api/chat/messages/${chatId}?token=${token}&page=${page}&limit=50`
  );
  return data;
};

export const sendMessage = async (chatId, content, token, messageType = 'text') => {
  const { data } = await api.post(`/api/chat/send?token=${token}`, {
    chat_id: chatId,
    content,
    message_type: messageType,
  });
  return data;
};

// AI
export const analyzeSentiment = async (text, token) => {
  const { data } = await api.post(`/api/ai/analyze-sentiment?token=${token}`, { text });
  return data;
};

export const getSmartReplies = async (chatId, lastMessage, token) => {
  const { data } = await api.post(`/api/ai/smart-replies?token=${token}`, {
    chat_id: chatId,
    last_message: lastMessage,
  });
  return data;
};

export const getDashboard = async (userId, token) => {
  const { data } = await api.get(`/api/ai/dashboard/${userId}?token=${token}`);
  return data;
};

export const getPersonalityAnalysis = async (targetUserId, token) => {
  const { data } = await api.post(`/api/ai/personality-analysis?token=${token}`, {
    target_user_id: targetUserId,
  });
  return data;
};

export default api;
