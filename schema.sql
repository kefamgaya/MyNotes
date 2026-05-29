-- NoteFlow Database Schema for Supabase (Updated)
-- Clean up existing tables and objects to allow clean rebuilds
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user CASCADE;
DROP TABLE IF EXISTS public.notes CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP FUNCTION IF EXISTS public.handle_updated_at CASCADE;

-- ----------------------------------------------------
-- 1. Users Table
-- ----------------------------------------------------
-- Stores public user data, credentials metadata, and application settings.
CREATE TABLE public.users (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  theme_preference TEXT DEFAULT 'system'::TEXT NOT NULL,
  sort_preference TEXT DEFAULT 'recent'::TEXT NOT NULL,

  CONSTRAINT username_length CHECK (char_length(username) >= 3)
);

-- Enable RLS for Users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------
-- 2. Notes Table
-- ----------------------------------------------------
-- Stores the notes created by users.
CREATE TABLE public.notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT DEFAULT 'Untitled Note'::TEXT NOT NULL,
  body TEXT DEFAULT ''::TEXT NOT NULL,
  pinned BOOLEAN DEFAULT FALSE NOT NULL,
  "order" INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for Notes
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------
-- 3. Indexes
-- ----------------------------------------------------
-- Optimize query performance for notes retrieval and sorting.
CREATE INDEX idx_notes_user_id ON public.notes(user_id);
CREATE INDEX idx_notes_user_id_order ON public.notes(user_id, "order");
CREATE INDEX idx_notes_user_id_updated_at ON public.notes(user_id, updated_at DESC);

-- ----------------------------------------------------
-- 4. RLS Policies
-- ----------------------------------------------------

-- User Policies
CREATE POLICY "Allow public read access to users" ON public.users
  FOR SELECT USING (true);

CREATE POLICY "Allow users to update their own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Note Policies
CREATE POLICY "Users can view their own notes" ON public.notes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notes" ON public.notes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notes" ON public.notes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notes" ON public.notes
  FOR DELETE USING (auth.uid() = user_id);

-- ----------------------------------------------------
-- 5. Helper Functions & Triggers
-- ----------------------------------------------------

-- Automatically update updated_at timestamp on edit
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  new.updated_at = timezone('utc'::text, now());
  RETURN new;
END;
$$ LANGUAGE plpgsql;

-- Trigger for public.notes updated_at
CREATE OR REPLACE TRIGGER on_notes_updated
  BEFORE UPDATE ON public.notes
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Trigger for public.users updated_at
CREATE OR REPLACE TRIGGER on_users_updated
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Automatically create user row when user registers in auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, username, full_name, avatar_url)
  VALUES (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'username', 'user_' || substr(new.id::text, 1, 8)),
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
