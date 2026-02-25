"""
Authentication routes: OTP-based phone login/registration
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime, timedelta
import random
import string
import os
from jose import JWTError, jwt

from ..database import get_db
from ..models import User, OTPCode

router = APIRouter()

SECRET_KEY = os.getenv("SECRET_KEY", "sentio-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days


class PhoneRequest(BaseModel):
    phone_number: str


class OTPVerifyRequest(BaseModel):
    phone_number: str
    otp_code: str


class ProfileUpdateRequest(BaseModel):
    name: str = None
    mood: str = None
    bio: str = None
    ai_suggestions_enabled: bool = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user_id: int
    is_new_user: bool


def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def generate_otp(length: int = 6) -> str:
    return ''.join(random.choices(string.digits, k=length))


def send_otp_sms(phone_number: str, otp: str):
    """Send OTP via SMS (Twilio integration)"""
    twilio_sid = os.getenv("TWILIO_ACCOUNT_SID")
    twilio_token = os.getenv("TWILIO_AUTH_TOKEN")
    twilio_from = os.getenv("TWILIO_FROM_NUMBER")

    if twilio_sid and twilio_token and twilio_from:
        try:
            from twilio.rest import Client
            client = Client(twilio_sid, twilio_token)
            client.messages.create(
                body=f"Your Sentio OTP code is: {otp}. Valid for 10 minutes.",
                from_=twilio_from,
                to=phone_number
            )
        except Exception as e:
            print(f"SMS send error: {e}")
    else:
        # Development mode: print OTP to console
        print(f"[DEV MODE] OTP for {phone_number}: {otp}")


@router.post("/request-otp")
async def request_otp(request: PhoneRequest, db: Session = Depends(get_db)):
    """Request OTP for phone number authentication"""
    phone = request.phone_number.strip()

    # Generate OTP
    otp = generate_otp()
    expires_at = datetime.utcnow() + timedelta(minutes=10)

    # Store OTP in database
    otp_record = OTPCode(
        phone_number=phone,
        code=otp,
        expires_at=expires_at
    )
    db.add(otp_record)
    db.commit()

    # Send OTP
    send_otp_sms(phone, otp)

    return {
        "message": "OTP sent successfully",
        "phone_number": phone,
        "expires_in": 600
    }


@router.post("/verify-otp", response_model=TokenResponse)
async def verify_otp(request: OTPVerifyRequest, db: Session = Depends(get_db)):
    """Verify OTP and authenticate user"""
    phone = request.phone_number.strip()

    # Find valid OTP
    otp_record = db.query(OTPCode).filter(
        OTPCode.phone_number == phone,
        OTPCode.code == request.otp_code,
        OTPCode.is_used == False,
        OTPCode.expires_at > datetime.utcnow()
    ).order_by(OTPCode.created_at.desc()).first()

    if not otp_record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired OTP"
        )

    # Mark OTP as used
    otp_record.is_used = True
    db.commit()

    # Find or create user
    user = db.query(User).filter(User.phone_number == phone).first()
    is_new_user = False

    if not user:
        user = User(phone_number=phone)
        db.add(user)
        db.commit()
        db.refresh(user)
        is_new_user = True

    # Create access token
    access_token = create_access_token({"sub": str(user.id)})

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user_id=user.id,
        is_new_user=is_new_user
    )


@router.get("/me")
async def get_current_user_profile(
    token: str,
    db: Session = Depends(get_db)
):
    """Get current user profile"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = int(payload.get("sub"))
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return {
        "id": user.id,
        "phone_number": user.phone_number,
        "name": user.name,
        "profile_picture": user.profile_picture,
        "mood": user.mood,
        "bio": user.bio,
        "ai_suggestions_enabled": user.ai_suggestions_enabled,
        "personality_profile": user.personality_profile,
        "created_at": user.created_at
    }


@router.put("/profile")
async def update_profile(
    request: ProfileUpdateRequest,
    token: str,
    db: Session = Depends(get_db)
):
    """Update user profile"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = int(payload.get("sub"))
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if request.name is not None:
        user.name = request.name
    if request.mood is not None:
        user.mood = request.mood
    if request.bio is not None:
        user.bio = request.bio
    if request.ai_suggestions_enabled is not None:
        user.ai_suggestions_enabled = request.ai_suggestions_enabled

    db.commit()
    db.refresh(user)

    return {"message": "Profile updated successfully", "user_id": user.id}
