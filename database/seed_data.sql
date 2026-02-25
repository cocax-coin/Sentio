-- Sentio Seed Data
-- Sample data for development/testing

-- Sample users
INSERT INTO users (phone_number, name, mood, bio, ai_suggestions_enabled) VALUES
('+1234567890', 'Alice Johnson', '😊 Happy', 'Love connecting with people!', true),
('+0987654321', 'Bob Smith', '💪 Motivated', 'Building great things daily.', true),
('+1122334455', 'Carol Williams', '😌 Calm', 'Mindful communicator.', true)
ON CONFLICT (phone_number) DO NOTHING;

-- Sample chat between Alice and Bob
INSERT INTO chats (is_group, created_by)
SELECT false, id FROM users WHERE phone_number = '+1234567890'
ON CONFLICT DO NOTHING;

-- Add members to chat
DO $$
DECLARE
    chat_id_val INTEGER;
    alice_id INTEGER;
    bob_id INTEGER;
BEGIN
    SELECT id INTO alice_id FROM users WHERE phone_number = '+1234567890';
    SELECT id INTO bob_id FROM users WHERE phone_number = '+0987654321';
    SELECT id INTO chat_id_val FROM chats WHERE created_by = alice_id LIMIT 1;

    IF chat_id_val IS NOT NULL THEN
        INSERT INTO chat_members (chat_id, user_id) VALUES
        (chat_id_val, alice_id),
        (chat_id_val, bob_id)
        ON CONFLICT (chat_id, user_id) DO NOTHING;

        -- Sample messages
        INSERT INTO messages (chat_id, sender_id, content, message_type, status, emotion, ai_analyzed) VALUES
        (chat_id_val, alice_id, 'Hey Bob! How are you doing? 😊', 'text', 'read', 'happy', true),
        (chat_id_val, bob_id, 'Hi Alice! I am great, thanks! Working on something exciting!', 'text', 'read', 'happy', true),
        (chat_id_val, alice_id, 'That sounds amazing! Tell me more 🤩', 'text', 'delivered', 'surprised', true),
        (chat_id_val, bob_id, 'It is an AI-powered app called Sentio. It makes conversations smarter!', 'text', 'sent', 'happy', true)
        ON CONFLICT DO NOTHING;
    END IF;
END $$;
