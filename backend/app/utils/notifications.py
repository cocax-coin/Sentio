"""
Notification utilities for Sentio
Handles birthday/anniversary reminders and event notifications
"""
import os
from datetime import datetime, timedelta
from typing import List, Dict
from sqlalchemy.orm import Session


def check_upcoming_events(db: Session, user_id: int, days_ahead: int = 7) -> List[Dict]:
    """Check for upcoming important events for a user"""
    from ..models import ImportantEvent

    now = datetime.utcnow()
    upcoming = []

    events = db.query(ImportantEvent).filter(
        ImportantEvent.user_id == user_id
    ).all()

    for event in events:
        # Calculate next occurrence
        event_date = event.event_date
        if event.is_recurring:
            # Set to this year
            try:
                next_occurrence = event_date.replace(year=now.year)
                if next_occurrence < now:
                    next_occurrence = next_occurrence.replace(year=now.year + 1)
            except ValueError:
                continue
        else:
            next_occurrence = event_date

        days_until = (next_occurrence.date() - now.date()).days

        if 0 <= days_until <= days_ahead:
            upcoming.append({
                "event_id": event.id,
                "title": event.title,
                "event_type": event.event_type,
                "days_until": days_until,
                "event_date": next_occurrence.isoformat(),
                "contact_id": event.contact_id,
                "suggested_message": event.suggested_message or generate_event_message(event.title, event.event_type, days_until)
            })

    return upcoming


def generate_event_message(title: str, event_type: str, days_until: int) -> str:
    """Generate a suggested message for an upcoming event"""
    if days_until == 0:
        if event_type == "birthday":
            return f"🎂 Happy Birthday! Wishing you an amazing day filled with joy and celebrations! 🎉"
        elif event_type == "anniversary":
            return f"💕 Happy Anniversary! Here's to many more beautiful years together! 🌹"
        else:
            return f"🎊 Today is {title}! Hope it's a wonderful day!"
    else:
        if event_type == "birthday":
            return f"🎁 {title} is coming up in {days_until} day(s)! Don't forget to wish them!"
        elif event_type == "anniversary":
            return f"💝 Anniversary in {days_until} day(s)! Plan something special!"
        else:
            return f"📅 {title} is in {days_until} day(s)! Be prepared!"


def send_push_notification(user_id: int, title: str, body: str, data: Dict = None):
    """Send push notification via Firebase"""
    firebase_app = None
    try:
        import firebase_admin
        from firebase_admin import messaging

        # Initialize Firebase if not already done
        if not firebase_admin._apps:
            firebase_cred_path = os.getenv("FIREBASE_CREDENTIALS_PATH")
            if firebase_cred_path:
                import firebase_admin
                from firebase_admin import credentials
                cred = credentials.Certificate(firebase_cred_path)
                firebase_admin.initialize_app(cred)
            else:
                print("[DEV] Firebase not configured - notification skipped")
                return

        # Get user FCM token from database
        # (In production, this would query the database for the user's FCM token)
        print(f"[DEV] Would send notification to user {user_id}: {title} - {body}")

    except Exception as e:
        print(f"Push notification error: {e}")


def schedule_birthday_reminder(db: Session, user_id: int, contact_id: int, birthday: datetime):
    """Schedule a birthday reminder for a contact"""
    from ..models import ImportantEvent

    existing = db.query(ImportantEvent).filter(
        ImportantEvent.user_id == user_id,
        ImportantEvent.contact_id == contact_id,
        ImportantEvent.event_type == "birthday"
    ).first()

    if not existing:
        event = ImportantEvent(
            user_id=user_id,
            contact_id=contact_id,
            title="Birthday",
            event_type="birthday",
            event_date=birthday,
            reminder_days_before=1,
            is_recurring=True
        )
        db.add(event)
        db.commit()
        return event
    return existing
