--
-- SEED DATA FOR CHAT
--

-- 1. Create a chat room
-- This uses the same UUID that is hardcoded in `static/js/message_init.js`
INSERT INTO public.chat_rooms (id, name)
VALUES ('f8f9e3b4-c6a6-4f4b-8f3a-6b4dcf2b07e1', 'Support Team')
ON CONFLICT (id) DO NOTHING;

-- 2. Add a user as a member of this room
-- IMPORTANT: Replace 'YOUR_USER_ID_HERE' with your actual user ID from the `auth.users` table in Supabase.
-- You can find this in your Supabase project dashboard under "Authentication".
INSERT INTO public.room_members (room_id, user_id)
VALUES ('f8f9e3b4-c6a6-4f4b-8f3a-6b4dcf2b07e1', 'YOUR_USER_ID_HERE')
ON CONFLICT (room_id, user_id) DO NOTHING;

-- You can add more members or a welcome message below if you like.
-- For example, to add a welcome message from another user:
--
-- INSERT INTO public.messages (room_id, user_id, content)
-- VALUES ('f8f9e3b4-c6a6-4f4b-8f3a-6b4dcf2b07e1', 'ID_OF_ANOTHER_USER', 'Welcome to the support chat!');
