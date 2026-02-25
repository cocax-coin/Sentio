# 🤖 Sentio - AI-Powered Chat Application

<div align="center">
  <h3>Smart conversations powered by artificial intelligence</h3>
  
  ![Version](https://img.shields.io/badge/version-1.0.0-blue)
  ![License](https://img.shields.io/badge/license-MIT-green)
  ![Python](https://img.shields.io/badge/python-3.11-blue)
  ![React Native](https://img.shields.io/badge/React_Native-0.73-61DAFB)
  ![FastAPI](https://img.shields.io/badge/FastAPI-0.104-009688)
</div>

---

## ✨ Features

- 📱 **WhatsApp-like UI** - Familiar chat interface with bubbles, typing indicators, and read receipts
- 🔐 **Phone OTP Authentication** - Secure login via SMS verification
- 🤖 **AI-Powered Smart Replies** - Context-aware reply suggestions based on your personality
- 😊 **Emotion & Sentiment Analysis** - Real-time analysis of message emotions
- 🧠 **Personality Profiling** - Deep analysis of communication styles
- 📊 **Dashboard & Insights** - Visual analytics on your communication patterns
- 🎂 **Smart Reminders** - Birthday/anniversary reminders with AI-generated messages
- 🔒 **End-to-End Encryption** - All messages encrypted for privacy
- ⚡ **Real-time WebSockets** - Instant message delivery
- 🌐 **Multi-platform** - React Native mobile app + REST API

---

## ��️ Architecture

```
Sentio/
├── backend/              # FastAPI Python backend
│   ├── app/
│   │   ├── main.py       # App entry point
│   │   ├── models.py     # Database models
│   │   ├── routes/       # API endpoints
│   │   │   ├── auth.py   # OTP authentication
│   │   │   ├── chat.py   # Messaging + WebSockets
│   │   │   └── ai.py     # AI features
│   │   └── utils/        # Utilities
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   └── mobile/           # React Native app (Expo)
│       ├── src/
│       │   ├── screens/  # App screens
│       │   ├── components/ # Reusable components
│       │   └── utils/    # API client
│       └── App.js
├── database/
│   ├── schema.sql        # PostgreSQL schema
│   └── seed_data.sql     # Sample data
├── ai_models/            # AI model integrations
│   ├── gpt_integration.py
│   ├── sentiment_model/
│   └── personality_model/
├── config/
│   ├── .env.example      # Environment template
│   ├── docker-compose.yml
│   └── nginx.conf
└── scripts/
    └── setup.sh          # Automated setup
```

---

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- Docker & Docker Compose
- PostgreSQL 15+ (or use Docker)

### Option 1: Automated Setup (Recommended)
```bash
git clone https://github.com/cocax-coin/Sentio.git
cd Sentio
chmod +x scripts/setup.sh
./scripts/setup.sh
```

### Option 2: Manual Setup

#### 1. Configure Environment
```bash
cp config/.env.example config/.env
# Edit config/.env with your API keys
```

#### 2. Start Infrastructure (Docker)
```bash
docker-compose -f config/docker-compose.yml up -d postgres redis
```

#### 3. Start Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

#### 4. Start Frontend
```bash
cd frontend/mobile
npm install
npx expo start
```

#### 5. Full Stack with Docker
```bash
docker-compose -f config/docker-compose.yml up
```

---

## 🔧 Configuration

### Required Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | ✅ |
| `SECRET_KEY` | JWT signing secret | ✅ |
| `OPENAI_API_KEY` | OpenAI API key for AI features | ⭐ Recommended |
| `TWILIO_ACCOUNT_SID` | Twilio SID for SMS OTP | 📱 For production |
| `TWILIO_AUTH_TOKEN` | Twilio Auth Token | 📱 For production |
| `TWILIO_FROM_NUMBER` | Twilio phone number | 📱 For production |

> **Development Note**: Without Twilio configured, OTP codes are printed to the backend console. Without OpenAI configured, fallback keyword-based AI is used.

---

## 📡 API Reference

### Authentication
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/request-otp` | POST | Request OTP for phone number |
| `/api/auth/verify-otp` | POST | Verify OTP and get JWT token |
| `/api/auth/me` | GET | Get current user profile |
| `/api/auth/profile` | PUT | Update user profile |

### Chat
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/chat/ws/{user_id}` | WebSocket | Real-time messaging |
| `/api/chat/list` | GET | Get all chats |
| `/api/chat/create` | POST | Create new 1:1 chat |
| `/api/chat/group/create` | POST | Create group chat |
| `/api/chat/messages/{chat_id}` | GET | Get chat messages (paginated) |
| `/api/chat/send` | POST | Send message |
| `/api/chat/upload-media` | POST | Upload media file |

### AI Features
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/ai/analyze-sentiment` | POST | Analyze message sentiment/emotion |
| `/api/ai/smart-replies` | POST | Get smart reply suggestions |
| `/api/ai/personality-analysis` | POST | Analyze user personality |
| `/api/ai/mood-trends/{user_id}` | GET | Get mood trend data |
| `/api/ai/auto-reply` | POST | Generate auto-reply |
| `/api/ai/dashboard/{user_id}` | GET | Get dashboard insights |

### Interactive API Docs
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

---

## 🤖 AI Features

### Sentiment Analysis
Analyzes incoming messages to detect emotions: happy, sad, angry, fearful, surprised, or neutral.

```json
POST /api/ai/analyze-sentiment
{
  "text": "I'm so excited about this!"
}
// Response: {"sentiment_score": 0.9, "emotion": "happy", "confidence": 0.92}
```

### Smart Replies
Generates 3 contextual reply suggestions based on:
- Full chat history
- User's personality profile
- Detected emotion of the last message

### Personality Analysis
Analyzes 100+ messages to build a personality profile including:
- Communication style (direct, expressive, analytical)
- Dominant traits
- Emotional tendencies
- Hidden intent detection

### Dashboard Insights
- Emotion distribution charts
- Top contacts by interaction
- Best times to communicate
- Response effectiveness metrics

---

## 🔌 WebSocket Protocol

Connect to `ws://localhost:8000/api/chat/ws/{user_id}`

**Send messages:**
```json
// New message
{"type": "message", "chat_id": 1, "content": "Hello!", "message_type": "text"}

// Typing indicator
{"type": "typing", "chat_id": 1, "is_typing": true}

// Read receipt
{"type": "read_receipt", "message_id": 42}
```

**Receive events:**
```json
// New message
{"type": "new_message", "message_id": 42, "chat_id": 1, "content": "Hello!"}

// Typing indicator  
{"type": "typing", "chat_id": 1, "user_id": 5, "is_typing": true}

// Read receipt
{"type": "read_receipt", "message_id": 42, "read_by": 5}
```

---

## 🚢 Deployment

### Deploy with Docker Compose
```bash
# Production deployment
docker-compose -f config/docker-compose.yml up -d
```

### Deploy Backend to Railway/Heroku
```bash
# Set environment variables in your platform
# Deploy with Git push or Docker image
```

### Deploy to AWS
```bash
# Build and push Docker image
docker build -t sentio-backend ./backend
docker tag sentio-backend:latest {aws_account}.dkr.ecr.{region}.amazonaws.com/sentio:latest
docker push {aws_account}.dkr.ecr.{region}.amazonaws.com/sentio:latest
```

### Deploy Frontend (Expo)
```bash
cd frontend/mobile
# For web
npx expo export:web
# For app stores
eas build --platform all
```

---

## 🗄️ Database Schema

Key tables:
- **users** - User accounts with personality profiles
- **chats** - Conversations (1:1 and groups)
- **chat_members** - Chat participants
- **messages** - All messages with AI analysis fields
- **contacts** - Contact relationships
- **important_events** - Birthdays/anniversaries
- **ai_insights** - Stored AI analysis data

---

## 🔒 Security

- **JWT Authentication** - Secure token-based auth
- **OTP Verification** - Phone number verification
- **End-to-End Encryption** - Messages encrypted in transit (HTTPS/WSS)
- **Rate Limiting** - API rate limits to prevent abuse
- **SQL Injection Prevention** - SQLAlchemy ORM with parameterized queries
- **CORS** - Configured for specified origins only

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📄 License

MIT License - see LICENSE file for details.

---

<div align="center">
Built with ❤️ by the Sentio Team
</div>
