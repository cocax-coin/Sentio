"""
AI utility functions for Sentio
Handles sentiment analysis, smart replies, personality analysis
"""
import os
from typing import List, Dict, Any, Optional
import json

# Try to import OpenAI
try:
    from openai import OpenAI
    openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    OPENAI_AVAILABLE = True
except Exception:
    OPENAI_AVAILABLE = False
    openai_client = None


def analyze_sentiment(text: str) -> Dict[str, Any]:
    """
    Analyze sentiment and emotion of text.
    Uses OpenAI if available, otherwise uses a simple heuristic.
    """
    if OPENAI_AVAILABLE and os.getenv("OPENAI_API_KEY"):
        try:
            response = openai_client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "You are an emotion analyzer. Analyze the given text and return JSON with: "
                            "sentiment_score (float -1 to 1), emotion (string: happy/sad/angry/fearful/"
                            "surprised/disgusted/neutral), confidence (float 0-1). Return only valid JSON."
                        )
                    },
                    {"role": "user", "content": f"Analyze: {text}"}
                ],
                max_tokens=100,
                temperature=0.3
            )
            result = json.loads(response.choices[0].message.content)
            return result
        except Exception as e:
            print(f"OpenAI sentiment error: {e}")

    # Fallback: simple keyword-based sentiment
    return _simple_sentiment(text)


def _simple_sentiment(text: str) -> Dict[str, Any]:
    """Simple heuristic sentiment analysis"""
    text_lower = text.lower()

    positive_words = {"happy", "great", "love", "wonderful", "amazing", "good", "nice", "thanks", "awesome", "excellent", "😊", "❤️", "😍", "🎉", "👍"}
    negative_words = {"sad", "bad", "hate", "terrible", "awful", "horrible", "angry", "upset", "disappointed", "😢", "😡", "💔"}
    angry_words = {"angry", "furious", "rage", "hate", "kill", "damn", "stupid"}

    pos_count = sum(1 for word in positive_words if word in text_lower)
    neg_count = sum(1 for word in negative_words if word in text_lower)
    ang_count = sum(1 for word in angry_words if word in text_lower)

    if ang_count > 0:
        return {"sentiment_score": -0.8, "emotion": "angry", "confidence": 0.6}
    elif pos_count > neg_count:
        score = min(0.9, 0.3 + pos_count * 0.2)
        return {"sentiment_score": score, "emotion": "happy", "confidence": 0.5}
    elif neg_count > pos_count:
        score = max(-0.9, -0.3 - neg_count * 0.2)
        return {"sentiment_score": score, "emotion": "sad", "confidence": 0.5}
    else:
        return {"sentiment_score": 0.0, "emotion": "neutral", "confidence": 0.7}


def generate_smart_replies(
    last_message: str,
    chat_history: List[Dict],
    user_personality: Dict
) -> List[str]:
    """
    Generate smart reply suggestions based on context and personality.
    """
    if OPENAI_AVAILABLE and os.getenv("OPENAI_API_KEY"):
        try:
            # Build context string
            context = "\n".join([
                f"{'Me' if m['is_me'] else 'Them'}: {m['content']}"
                for m in chat_history[-5:]
            ])

            personality_desc = ""
            if user_personality:
                style = user_personality.get("communication_style", "")
                if style:
                    personality_desc = f"My communication style: {style}."

            response = openai_client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {
                        "role": "system",
                        "content": (
                            f"You are a smart reply assistant. {personality_desc} "
                            "Generate 3 short, natural reply suggestions for the last message. "
                            "Return as JSON array of strings. Keep replies under 20 words each."
                        )
                    },
                    {
                        "role": "user",
                        "content": f"Chat history:\n{context}\n\nGenerate 3 smart replies for: '{last_message}'"
                    }
                ],
                max_tokens=200,
                temperature=0.7
            )
            suggestions = json.loads(response.choices[0].message.content)
            if isinstance(suggestions, list):
                return suggestions[:3]
        except Exception as e:
            print(f"OpenAI smart reply error: {e}")

    # Fallback responses
    return _fallback_smart_replies(last_message)


def _fallback_smart_replies(message: str) -> List[str]:
    """Provide fallback smart replies"""
    msg_lower = message.lower()

    if "?" in message:
        return ["Sure, let me think about that", "Yes, absolutely!", "I'm not sure, can we discuss?"]
    elif any(word in msg_lower for word in ["hi", "hello", "hey"]):
        return ["Hi there! 👋", "Hey! How are you?", "Hello! Great to hear from you!"]
    elif any(word in msg_lower for word in ["thanks", "thank"]):
        return ["You're welcome! 😊", "Anytime!", "Happy to help!"]
    elif any(word in msg_lower for word in ["ok", "okay", "sure"]):
        return ["Great! 👍", "Perfect!", "Sounds good!"]
    else:
        return ["Got it! 👍", "That's interesting!", "Tell me more!"]


def analyze_personality(messages: List[str]) -> Dict[str, Any]:
    """
    Analyze communication personality from message history.
    """
    if not messages:
        return {}

    if OPENAI_AVAILABLE and os.getenv("OPENAI_API_KEY"):
        try:
            sample = messages[:20]  # Use first 20 messages
            messages_text = "\n".join(f"- {m}" for m in sample)

            response = openai_client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "Analyze these messages and return personality insights as JSON with: "
                            "communication_style (string), dominant_traits (list), "
                            "emotional_tendency (string), preferred_topics (list), "
                            "hidden_intents (string), response_style (string). Return only valid JSON."
                        )
                    },
                    {
                        "role": "user",
                        "content": f"Analyze personality from these messages:\n{messages_text}"
                    }
                ],
                max_tokens=300,
                temperature=0.5
            )
            return json.loads(response.choices[0].message.content)
        except Exception as e:
            print(f"OpenAI personality error: {e}")

    # Fallback analysis
    return _simple_personality_analysis(messages)


def _simple_personality_analysis(messages: List[str]) -> Dict[str, Any]:
    """Simple personality analysis from message patterns"""
    if not messages:
        return {}

    total = len(messages)
    avg_length = sum(len(m) for m in messages) / max(total, 1)
    question_ratio = sum(1 for m in messages if "?" in m) / max(total, 1)

    style = "concise" if avg_length < 30 else "expressive"
    tends_to_ask = question_ratio > 0.3

    return {
        "communication_style": style,
        "dominant_traits": ["curious" if tends_to_ask else "direct"],
        "emotional_tendency": "balanced",
        "preferred_topics": ["general"],
        "hidden_intents": "unclear",
        "response_style": "conversational",
        "avg_message_length": round(avg_length, 1),
        "question_frequency": round(question_ratio, 2)
    }


def get_mood_trends(messages: list) -> Dict[str, Any]:
    """Calculate mood trends from analyzed messages"""
    if not messages:
        return {"trend": "neutral", "data_points": [], "summary": "No data available"}

    emotions = {}
    sentiment_over_time = []

    for msg in messages:
        if msg.emotion:
            emotions[msg.emotion] = emotions.get(msg.emotion, 0) + 1
        if msg.sentiment_score is not None:
            sentiment_over_time.append({
                "date": msg.created_at.date().isoformat() if msg.created_at else None,
                "score": msg.sentiment_score,
                "emotion": msg.emotion
            })

    dominant_emotion = max(emotions, key=emotions.get) if emotions else "neutral"
    avg_sentiment = sum(s["score"] for s in sentiment_over_time) / max(len(sentiment_over_time), 1)

    trend = "positive" if avg_sentiment > 0.2 else "negative" if avg_sentiment < -0.2 else "neutral"

    return {
        "trend": trend,
        "dominant_emotion": dominant_emotion,
        "emotion_distribution": emotions,
        "average_sentiment": round(avg_sentiment, 3),
        "data_points": sentiment_over_time[-30:],  # Last 30 points
        "summary": f"Your communication has been mostly {dominant_emotion} lately."
    }


def generate_auto_reply(
    message: str,
    context: List[Dict],
    user_personality: Dict
) -> str:
    """Generate an automated reply suggestion"""
    if OPENAI_AVAILABLE and os.getenv("OPENAI_API_KEY"):
        try:
            context_text = "\n".join([
                f"{'Me' if c['is_me'] else 'Them'}: {c['content']}"
                for c in context
            ])

            style = user_personality.get("communication_style", "friendly")

            response = openai_client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {
                        "role": "system",
                        "content": (
                            f"You are writing an auto-reply in a {style} communication style. "
                            "Keep the reply brief, natural, and appropriate to the context."
                        )
                    },
                    {
                        "role": "user",
                        "content": f"Context:\n{context_text}\n\nGenerate auto-reply for: '{message}'"
                    }
                ],
                max_tokens=100,
                temperature=0.7
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            print(f"OpenAI auto-reply error: {e}")

    # Fallback
    return "Thanks for your message! I'll get back to you soon. 😊"
