CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- --------------------------------------------------------------------------------
-- 1. Table Definitions
-- --------------------------------------------------------------------------------

-- Create the chat_rooms table
CREATE TABLE chat_rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create the room_members table
CREATE TABLE room_members (
  room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  PRIMARY KEY (room_id, user_id)
);

-- Create the messages table
CREATE TABLE messages (
  id BIGSERIAL PRIMARY KEY,
  room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create an index for efficient message retrieval
CREATE INDEX idx_messages_room_id_created_at ON messages (room_id, created_at DESC);

-- Enable Row Level Security (RLS) on the tables
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Allow users to see rooms they are a member of
CREATE POLICY "Allow members to see their rooms"
ON chat_rooms FOR SELECT
USING (
  id IN (
    SELECT room_id FROM room_members WHERE user_id = auth.uid()
  )
);

-- RLS Policy: Allow anyone to see the public support room (optional, but easier for joining)
CREATE POLICY "Allow authenticated to see Support room"
ON chat_rooms FOR SELECT
USING ( auth.role() = 'authenticated' AND name = 'Support Team' );

-- RLS Policy: Allow users to join a room
CREATE POLICY "Allow users to join rooms"
ON room_members FOR INSERT
WITH CHECK (
  auth.uid() = user_id
);

-- RLS Policy: Allow users to see members of rooms they are in
CREATE POLICY "Allow members to see other members"
ON room_members FOR SELECT
USING (
  room_id IN (
    SELECT room_id FROM room_members WHERE user_id = auth.uid()
  )
);

-- RLS Policy (Read): Allow users to read messages in rooms they are a member of
CREATE POLICY "Allow members to read messages in their rooms"
ON messages FOR SELECT
USING (
  room_id IN (
    SELECT room_id FROM room_members WHERE user_id = auth.uid()
  )
);

-- RLS Policy (Write): Allow authenticated members to send messages
CREATE POLICY "Allow members to send messages in their rooms"
ON messages FOR INSERT
WITH CHECK (
  auth.role() = 'authenticated' AND
  room_id IN (
    SELECT room_id FROM room_members WHERE user_id = auth.uid()
  )
);
