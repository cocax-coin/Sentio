"""
GPT Integration for Sentio
Advanced AI features using OpenAI GPT models
"""
import os
import json
from typing import List, Dict, Any, Optional

try:
    from openai import OpenAI
    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    GPT_AVAILABLE = bool(os.getenv("OPENAI_API_KEY"))
except ImportError:
    client = None
    GPT_AVAILABLE = False


def merge_personality_with_knowledge(
    user_personality: Dict,
    conversation_context: List[Dict],
    recipient_personality: Dict = None
) -> str:
    """
    Merges user's personality profile with contextual knowledge
    to generate the optimal communication approach.
    """
    if not GPT_AVAILABLE or not client:
        return _fallback_communication_advice(user_personality)

    try:
        user_style = user_personality.get("communication_style", "friendly")
        user_traits = user_personality.get("dominant_traits", [])
        recipient_style = recipient_personality.get("communication_style", "unknown") if recipient_personality else "unknown"

        context_summary = "\n".join([
            f"{'User' if m.get('is_me') else 'Contact'}: {m.get('content', '')}"
            for m in conversation_context[-5:]
        ])

        prompt = f"""
        User communication style: {user_style}
        User traits: {', '.join(user_traits)}
        Recipient communication style: {recipient_style}
        
        Recent conversation:
        {context_summary}
        
        Provide a brief communication strategy (2-3 sentences) for optimal impact.
        """

        response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {
                    "role": "system",
                    "content": "You are a communication psychology expert. Provide concise, actionable advice."
                },
                {"role": "user", "content": prompt}
            ],
            max_tokens=150,
            temperature=0.6
        )
        return response.choices[0].message.content.strip()

    except Exception as e:
        print(f"GPT merge error: {e}")
        return _fallback_communication_advice(user_personality)


def analyze_hidden_intents(messages: List[str]) -> Dict[str, Any]:
    """
    Analyze potential hidden intents or subtext in messages.
    """
    if not GPT_AVAILABLE or not client or not messages:
        return {"hidden_intent": "Unable to analyze", "confidence": 0}

    try:
        sample = messages[-10:]
        messages_text = "\n".join(f"- {m}" for m in sample)

        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "Analyze these messages for hidden intents or subtext. "
                        "Return JSON with: hidden_intent (string), emotional_subtext (string), "
                        "confidence (float 0-1), red_flags (list). Be respectful and ethical."
                    )
                },
                {"role": "user", "content": f"Analyze:\n{messages_text}"}
            ],
            max_tokens=200,
            temperature=0.4
        )
        return json.loads(response.choices[0].message.content)
    except Exception as e:
        print(f"Hidden intent analysis error: {e}")
        return {"hidden_intent": "Normal conversation", "confidence": 0.5}


def generate_event_message(event_type: str, contact_name: str, context: str = "") -> str:
    """
    Generate a personalized message for special events (birthdays, anniversaries).
    """
    if not GPT_AVAILABLE or not client:
        return _fallback_event_message(event_type, contact_name)

    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {
                    "role": "system",
                    "content": "Generate a warm, personalized message for a special occasion. Keep it under 50 words."
                },
                {
                    "role": "user",
                    "content": f"Write a {event_type} message for {contact_name}. Context: {context}"
                }
            ],
            max_tokens=100,
            temperature=0.8
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        print(f"Event message error: {e}")
        return _fallback_event_message(event_type, contact_name)


def _fallback_communication_advice(personality: Dict) -> str:
    style = personality.get("communication_style", "balanced")
    return f"Communicate with a {style} approach. Be clear, empathetic, and genuine in your responses."


def _fallback_event_message(event_type: str, name: str) -> str:
    messages = {
        "birthday": f"🎂 Happy Birthday, {name}! Wishing you joy, health, and wonderful moments today! 🎉",
        "anniversary": f"💕 Happy Anniversary, {name}! Celebrating your special day with warm wishes! 🌹",
        "default": f"🎊 Congratulations, {name}! Wishing you all the best on this special occasion!"
    }
    return messages.get(event_type, messages["default"])


if __name__ == "__main__":
    # Test the module
    print("Testing GPT Integration...")
    advice = merge_personality_with_knowledge(
        {"communication_style": "direct", "dominant_traits": ["analytical"]},
        [{"is_me": True, "content": "Hello!"}, {"is_me": False, "content": "Hi there!"}]
    )
    print(f"Communication advice: {advice}")
