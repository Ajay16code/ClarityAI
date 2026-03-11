-- ClarityIQ Complete Database & Storage Setup
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)

-- 1. Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  username TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create customers table
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add name column to customers if it doesn't exist (for existing databases)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customers' AND column_name='name') THEN
        ALTER TABLE public.customers ADD COLUMN name TEXT NOT NULL DEFAULT 'Untitled Customer';
    END IF;
END $$;

-- 3. Create meetings table
CREATE TABLE IF NOT EXISTS public.meetings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add name column to meetings if it doesn't exist (for existing databases)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='meetings' AND column_name='name') THEN
        ALTER TABLE public.meetings ADD COLUMN name TEXT NOT NULL DEFAULT 'Untitled Meeting';
    END IF;
END $$;

-- 4. Create calls table
CREATE TABLE IF NOT EXISTS public.calls (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  file_url TEXT,
  file_name TEXT,
  transcription TEXT,
  bant_budget TEXT,
  bant_authority TEXT,
  bant_need TEXT,
  bant_timeline TEXT,
  vibe_summary TEXT,
  deal_momentum TEXT,
  vibe_category TEXT,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  customer_name TEXT,
  meeting_id UUID REFERENCES public.meetings(id) ON DELETE SET NULL,
  meeting_name TEXT,
  sentiment_analysis JSONB,
  engagement_metrics JSONB,
  momentum_engine JSONB,
  buying_signals JSONB,
  rep_effectiveness JSONB,
  risk_engine JSONB,
  unified_deal_health_score INTEGER,
  geography TEXT,
  product TEXT,
  raw_gemini_response JSONB
);

-- Add columns if they don't exist (for existing databases)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='calls' AND column_name='sentiment_analysis') THEN
        ALTER TABLE public.calls ADD COLUMN sentiment_analysis JSONB;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='calls' AND column_name='engagement_metrics') THEN
        ALTER TABLE public.calls ADD COLUMN engagement_metrics JSONB;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='calls' AND column_name='momentum_engine') THEN
        ALTER TABLE public.calls ADD COLUMN momentum_engine JSONB;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='calls' AND column_name='buying_signals') THEN
        ALTER TABLE public.calls ADD COLUMN buying_signals JSONB;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='calls' AND column_name='rep_effectiveness') THEN
        ALTER TABLE public.calls ADD COLUMN rep_effectiveness JSONB;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='calls' AND column_name='risk_engine') THEN
        ALTER TABLE public.calls ADD COLUMN risk_engine JSONB;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='calls' AND column_name='unified_deal_health_score') THEN
        ALTER TABLE public.calls ADD COLUMN unified_deal_health_score INTEGER;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='calls' AND column_name='geography') THEN
        ALTER TABLE public.calls ADD COLUMN geography TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='calls' AND column_name='product') THEN
        ALTER TABLE public.calls ADD COLUMN product TEXT;
    END IF;
END $$;

-- 5. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calls ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS Policies
-- Profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Customers
DROP POLICY IF EXISTS "Users can view their own customers" ON public.customers;
CREATE POLICY "Users can view their own customers" ON public.customers FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert their own customers" ON public.customers;
CREATE POLICY "Users can insert their own customers" ON public.customers FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update their own customers" ON public.customers;
CREATE POLICY "Users can update their own customers" ON public.customers FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete their own customers" ON public.customers;
CREATE POLICY "Users can delete their own customers" ON public.customers FOR DELETE USING (auth.uid() = user_id);

-- Meetings
DROP POLICY IF EXISTS "Users can view their own meetings" ON public.meetings;
CREATE POLICY "Users can view their own meetings" ON public.meetings FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert their own meetings" ON public.meetings;
CREATE POLICY "Users can insert their own meetings" ON public.meetings FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update their own meetings" ON public.meetings;
CREATE POLICY "Users can update their own meetings" ON public.meetings FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete their own meetings" ON public.meetings;
CREATE POLICY "Users can delete their own meetings" ON public.meetings FOR DELETE USING (auth.uid() = user_id);

-- Calls
DROP POLICY IF EXISTS "Users can view their own calls" ON public.calls;
CREATE POLICY "Users can view their own calls" ON public.calls FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert their own calls" ON public.calls;
CREATE POLICY "Users can insert their own calls" ON public.calls FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update their own calls" ON public.calls;
CREATE POLICY "Users can update their own calls" ON public.calls FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete their own calls" ON public.calls;
CREATE POLICY "Users can delete their own calls" ON public.calls FOR DELETE USING (auth.uid() = user_id);

-- 7. Setup Storage Bucket for Audio Files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('call-audio', 'call-audio', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('meeting-recordings', 'meeting-recordings', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies (Allow users to manage their own folder)
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
CREATE POLICY "Allow authenticated uploads" ON storage.objects FOR INSERT WITH CHECK (bucket_id IN ('call-audio', 'meeting-recordings') AND auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Allow public viewing" ON storage.objects;
CREATE POLICY "Allow public viewing" ON storage.objects FOR SELECT USING (bucket_id IN ('call-audio', 'meeting-recordings'));
DROP POLICY IF EXISTS "Allow users to delete their own files" ON storage.objects;
CREATE POLICY "Allow users to delete their own files" ON storage.objects FOR DELETE USING (bucket_id IN ('call-audio', 'meeting-recordings') AND (storage.foldername(name))[1] = auth.uid()::text);
