"""
Chat routes: messaging, WebSocket connections, chat management
"""
from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, UploadFile, File
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import datetime
import json
import os
import aiofiles
from jose import JWTError, jwt

from ..database import get_db
from ..models import User, Chat, ChatMember, Message, MessageStatus, MessageType, Contact

router = APIRouter()

SECRET_KEY = os.getenv("SECRET_KEY", "sentio-secret-key-change-in-production")
ALGORITHM = "HS256"

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[int, WebSocket] = {}

    async def connect(self, websocket: WebSocket, user_id: int):
        await websocket.accept()
        self.active_connections[user_id] = websocket

    def disconnect(self, user_id: int):
        if user_id in self.active_connections:
            del self.active_connections[user_id]

    async def send_personal_message(self, message: dict, user_id: int):
        if user_id in self.active_connections:
            try:
                await self.active_connections[user_id].send_text(json.dumps(message))
            except Exception:
                self.disconnect(user_id)

    async def broadcast_to_chat(self, message: dict, user_ids: List[int]):
        for user_id in user_ids:
            await self.send_personal_message(message, user_id)


manager = ConnectionManager()


class CreateChatRequest(BaseModel):
    participant_id: int
    initial_message: Optional[str] = None


class CreateGroupRequest(BaseModel):
    name: str
    participant_ids: List[int]


class SendMessageRequest(BaseModel):
    chat_id: int
    content: str
    message_type: str = "text"
    reply_to_id: Optional[int] = None


def get_user_from_token(token: str, db: Session) -> User:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = int(payload.get("sub"))
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: int, db: Session = Depends(get_db)):
    """WebSocket endpoint for real-time messaging"""
    await manager.connect(websocket, user_id)
    try:
        while True:
            data = await websocket.receive_text()
            message_data = json.loads(data)

            msg_type = message_data.get("type")

            if msg_type == "message":
                # Save message to database
                new_message = Message(
                    chat_id=message_data["chat_id"],
                    sender_id=user_id,
                    content=message_data.get("content", ""),
                    message_type=message_data.get("message_type", "text"),
                    reply_to_id=message_data.get("reply_to_id")
                )
                db.add(new_message)
                db.commit()
                db.refresh(new_message)

                # Get chat members
                members = db.query(ChatMember).filter(ChatMember.chat_id == message_data["chat_id"]).all()
                member_ids = [m.user_id for m in members]

                # Broadcast to all members
                broadcast_data = {
                    "type": "new_message",
                    "message_id": new_message.id,
                    "chat_id": new_message.chat_id,
                    "sender_id": user_id,
                    "content": new_message.content,
                    "message_type": new_message.message_type.value,
                    "created_at": new_message.created_at.isoformat(),
                    "status": "sent"
                }
                await manager.broadcast_to_chat(broadcast_data, member_ids)

            elif msg_type == "typing":
                # Broadcast typing indicator
                members = db.query(ChatMember).filter(ChatMember.chat_id == message_data["chat_id"]).all()
                member_ids = [m.user_id for m in members if m.user_id != user_id]
                typing_data = {
                    "type": "typing",
                    "chat_id": message_data["chat_id"],
                    "user_id": user_id,
                    "is_typing": message_data.get("is_typing", False)
                }
                await manager.broadcast_to_chat(typing_data, member_ids)

            elif msg_type == "read_receipt":
                # Update message status
                msg_id = message_data.get("message_id")
                if msg_id:
                    msg = db.query(Message).filter(Message.id == msg_id).first()
                    if msg:
                        msg.status = MessageStatus.READ
                        db.commit()

                    # Notify sender
                    receipt_data = {
                        "type": "read_receipt",
                        "message_id": msg_id,
                        "read_by": user_id
                    }
                    if msg:
                        await manager.send_personal_message(receipt_data, msg.sender_id)

    except WebSocketDisconnect:
        manager.disconnect(user_id)
        # Notify contacts that user went offline
        await manager.broadcast_to_chat(
            {"type": "user_offline", "user_id": user_id},
            list(manager.active_connections.keys())
        )


@router.post("/create")
async def create_chat(request: CreateChatRequest, token: str, db: Session = Depends(get_db)):
    """Create a new 1:1 chat"""
    user = get_user_from_token(token, db)

    # Check if chat already exists
    existing_chat = None
    user_chats = db.query(ChatMember).filter(ChatMember.user_id == user.id).all()
    for uc in user_chats:
        other_member = db.query(ChatMember).filter(
            ChatMember.chat_id == uc.chat_id,
            ChatMember.user_id == request.participant_id
        ).first()
        if other_member:
            chat_obj = db.query(Chat).filter(Chat.id == uc.chat_id, Chat.is_group == False).first()
            if chat_obj:
                existing_chat = chat_obj
                break

    if existing_chat:
        return {"chat_id": existing_chat.id, "message": "Chat already exists"}

    # Create new chat
    chat = Chat(is_group=False, created_by=user.id)
    db.add(chat)
    db.commit()
    db.refresh(chat)

    # Add members
    for uid in [user.id, request.participant_id]:
        member = ChatMember(chat_id=chat.id, user_id=uid)
        db.add(member)
    db.commit()

    # Send initial message if provided
    if request.initial_message:
        msg = Message(
            chat_id=chat.id,
            sender_id=user.id,
            content=request.initial_message,
            message_type=MessageType.TEXT
        )
        db.add(msg)
        db.commit()

    return {"chat_id": chat.id, "message": "Chat created successfully"}


@router.post("/group/create")
async def create_group(request: CreateGroupRequest, token: str, db: Session = Depends(get_db)):
    """Create a group chat"""
    user = get_user_from_token(token, db)

    chat = Chat(name=request.name, is_group=True, created_by=user.id)
    db.add(chat)
    db.commit()
    db.refresh(chat)

    # Add creator as admin
    creator_member = ChatMember(chat_id=chat.id, user_id=user.id, is_admin=True)
    db.add(creator_member)

    # Add other participants
    for uid in request.participant_ids:
        member = ChatMember(chat_id=chat.id, user_id=uid)
        db.add(member)

    db.commit()
    return {"chat_id": chat.id, "name": request.name, "message": "Group created successfully"}


@router.get("/list")
async def get_chat_list(token: str, db: Session = Depends(get_db)):
    """Get all chats for current user"""
    user = get_user_from_token(token, db)

    chat_members = db.query(ChatMember).filter(ChatMember.user_id == user.id).all()
    chat_list = []

    for cm in chat_members:
        chat = db.query(Chat).filter(Chat.id == cm.chat_id).first()
        if not chat:
            continue

        # Get last message
        last_message = db.query(Message).filter(
            Message.chat_id == chat.id,
            Message.is_deleted == False
        ).order_by(Message.created_at.desc()).first()

        # Count unread messages
        unread_count = db.query(Message).filter(
            Message.chat_id == chat.id,
            Message.sender_id != user.id,
            Message.status != MessageStatus.READ
        ).count()

        # Get other members info (for 1:1 chats)
        chat_name = chat.name
        chat_picture = chat.group_picture

        if not chat.is_group:
            other_members = db.query(ChatMember).filter(
                ChatMember.chat_id == chat.id,
                ChatMember.user_id != user.id
            ).all()
            if other_members:
                other_user = db.query(User).filter(User.id == other_members[0].user_id).first()
                if other_user:
                    chat_name = other_user.name or other_user.phone_number
                    chat_picture = other_user.profile_picture

        chat_list.append({
            "chat_id": chat.id,
            "name": chat_name,
            "picture": chat_picture,
            "is_group": chat.is_group,
            "last_message": {
                "content": last_message.content if last_message else None,
                "type": last_message.message_type.value if last_message else None,
                "created_at": last_message.created_at.isoformat() if last_message else None,
                "sender_id": last_message.sender_id if last_message else None
            } if last_message else None,
            "unread_count": unread_count,
            "updated_at": chat.updated_at.isoformat() if chat.updated_at else None
        })

    # Sort by last message time
    chat_list.sort(
        key=lambda x: x["last_message"]["created_at"] if x["last_message"] else "",
        reverse=True
    )

    return {"chats": chat_list}


@router.get("/messages/{chat_id}")
async def get_messages(
    chat_id: int,
    token: str,
    page: int = 1,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """Get paginated messages for a chat"""
    user = get_user_from_token(token, db)

    # Check if user is member of chat
    member = db.query(ChatMember).filter(
        ChatMember.chat_id == chat_id,
        ChatMember.user_id == user.id
    ).first()
    if not member:
        raise HTTPException(status_code=403, detail="Not a member of this chat")

    offset = (page - 1) * limit
    messages = db.query(Message).filter(
        Message.chat_id == chat_id,
        Message.is_deleted == False
    ).order_by(Message.created_at.desc()).offset(offset).limit(limit).all()

    # Mark messages as read
    unread = db.query(Message).filter(
        Message.chat_id == chat_id,
        Message.sender_id != user.id,
        Message.status != MessageStatus.READ
    ).all()
    for msg in unread:
        msg.status = MessageStatus.READ
    db.commit()

    return {
        "messages": [
            {
                "id": m.id,
                "chat_id": m.chat_id,
                "sender_id": m.sender_id,
                "content": m.content,
                "message_type": m.message_type.value,
                "media_url": m.media_url,
                "status": m.status.value,
                "reply_to_id": m.reply_to_id,
                "sentiment_score": m.sentiment_score,
                "emotion": m.emotion,
                "created_at": m.created_at.isoformat()
            }
            for m in reversed(messages)
        ],
        "page": page,
        "limit": limit
    }


@router.post("/send")
async def send_message(request: SendMessageRequest, token: str, db: Session = Depends(get_db)):
    """Send a text message via REST API"""
    user = get_user_from_token(token, db)

    # Verify membership
    member = db.query(ChatMember).filter(
        ChatMember.chat_id == request.chat_id,
        ChatMember.user_id == user.id
    ).first()
    if not member:
        raise HTTPException(status_code=403, detail="Not a member of this chat")

    message = Message(
        chat_id=request.chat_id,
        sender_id=user.id,
        content=request.content,
        message_type=request.message_type,
        reply_to_id=request.reply_to_id
    )
    db.add(message)
    db.commit()
    db.refresh(message)

    # Notify via WebSocket
    members = db.query(ChatMember).filter(ChatMember.chat_id == request.chat_id).all()
    member_ids = [m.user_id for m in members]
    await manager.broadcast_to_chat(
        {
            "type": "new_message",
            "message_id": message.id,
            "chat_id": message.chat_id,
            "sender_id": user.id,
            "content": message.content,
            "message_type": message.message_type.value,
            "created_at": message.created_at.isoformat()
        },
        member_ids
    )

    return {
        "message_id": message.id,
        "status": "sent",
        "created_at": message.created_at.isoformat()
    }


@router.post("/upload-media")
async def upload_media(
    file: UploadFile = File(...),
    token: str = None,
    db: Session = Depends(get_db)
):
    """Upload media file (image, audio, video)"""
    user = get_user_from_token(token, db)

    # Create upload directory
    upload_dir = "uploads"
    os.makedirs(upload_dir, exist_ok=True)

    # Save file
    file_path = f"{upload_dir}/{user.id}_{datetime.utcnow().timestamp()}_{file.filename}"
    async with aiofiles.open(file_path, "wb") as f:
        content = await file.read()
        await f.write(content)

    return {"media_url": f"/{file_path}", "filename": file.filename}


@router.delete("/message/{message_id}")
async def delete_message(message_id: int, token: str, db: Session = Depends(get_db)):
    """Soft delete a message"""
    user = get_user_from_token(token, db)

    message = db.query(Message).filter(Message.id == message_id).first()
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")

    if message.sender_id != user.id:
        raise HTTPException(status_code=403, detail="Can only delete your own messages")

    message.is_deleted = True
    db.commit()

    return {"message": "Message deleted successfully"}
