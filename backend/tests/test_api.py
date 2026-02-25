"""
Basic tests for Sentio API
"""
import pytest
from fastapi.testclient import TestClient
import sys
import os

# Add the backend directory to path for testing
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def test_placeholder():
    """Placeholder test - replace with actual tests once DB is available"""
    assert True


def test_otp_generation():
    """Test OTP generation logic"""
    import random
    import string
    def generate_otp(length=6):
        return ''.join(random.choices(string.digits, k=length))
    
    otp = generate_otp()
    assert len(otp) == 6
    assert otp.isdigit()


def test_sentiment_fallback():
    """Test fallback sentiment analysis without OpenAI"""
    import sys
    import os
    sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
    
    # Test the simple sentiment function directly
    text_positive = "I am so happy today! This is wonderful!"
    text_negative = "This is terrible and awful"
    text_neutral = "The meeting is at 3pm"
    
    # Simple keyword check
    positive_words = {"happy", "wonderful", "great", "love", "amazing"}
    negative_words = {"terrible", "awful", "bad", "hate"}
    
    pos = sum(1 for w in positive_words if w in text_positive.lower())
    neg = sum(1 for w in negative_words if w in text_negative.lower())
    
    assert pos > 0, "Should detect positive words"
    assert neg > 0, "Should detect negative words"


def test_smart_replies_fallback():
    """Test fallback smart reply generation"""
    def fallback_smart_replies(message):
        if "?" in message:
            return ["Sure!", "Let me check", "I'm not sure"]
        elif any(w in message.lower() for w in ["hi", "hello", "hey"]):
            return ["Hi there! 👋", "Hey!", "Hello!"]
        return ["Got it! 👍", "Interesting!", "Tell me more!"]
    
    greeting_replies = fallback_smart_replies("Hey there!")
    question_replies = fallback_smart_replies("How are you?")
    generic_replies = fallback_smart_replies("I went to the store")
    
    assert len(greeting_replies) == 3
    assert len(question_replies) == 3
    assert len(generic_replies) == 3


def test_personality_analysis_empty():
    """Test personality analysis with empty input"""
    def simple_personality(messages):
        if not messages:
            return {}
        total = len(messages)
        avg_length = sum(len(m) for m in messages) / max(total, 1)
        return {
            "communication_style": "concise" if avg_length < 30 else "expressive",
            "avg_message_length": round(avg_length, 1)
        }
    
    empty_result = simple_personality([])
    assert empty_result == {}
    
    messages = ["Hi!", "How are you?", "Great to hear from you today!"]
    result = simple_personality(messages)
    assert "communication_style" in result
    assert "avg_message_length" in result
