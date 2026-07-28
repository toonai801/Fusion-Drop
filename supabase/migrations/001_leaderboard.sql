-- Fusion Drop Supabase Database Schema
-- Run this in Supabase SQL Editor

-- Drop existing tables if they exist
DROP TABLE IF EXISTS public.active_players;
DROP TABLE IF EXISTS public.scores;

-- Create scores table for leaderboard
CREATE TABLE public.scores (
    id BIGSERIAL PRIMARY KEY,
    player_name TEXT NOT NULL,
    score INTEGER NOT NULL CHECK (score >= 0),
    level INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create active_players table for "who's playing now"
CREATE TABLE public.active_players (
    id BIGSERIAL PRIMARY KEY,
    player_name TEXT NOT NULL UNIQUE,
    score INTEGER DEFAULT 0,
    last_seen TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.active_players ENABLE ROW LEVEL SECURITY;

-- Anyone can read scores
CREATE POLICY "Allow anonymous read scores" ON public.scores
    FOR SELECT TO anon USING (true);

-- Anyone can insert scores
CREATE POLICY "Allow anonymous insert scores" ON public.scores
    FOR INSERT TO anon WITH CHECK (true);

-- Anyone can read active players
CREATE POLICY "Allow anonymous read active" ON public.active_players
    FOR SELECT TO anon USING (true);

-- Anyone can insert/update active players
CREATE POLICY "Allow anonymous upsert active" ON public.active_players
    FOR ALL TO anon USING (true) WITH CHECK (true);

-- Create index for leaderboard queries
CREATE INDEX idx_scores_score ON public.scores(score DESC);
CREATE INDEX idx_active_last_seen ON public.active_players(last_seen);

-- Clean up inactive players older than 60 seconds (run via cron or application)
-- You can also create a function that runs automatically:
CREATE OR REPLACE FUNCTION cleanup_inactive_players()
RETURNS void AS $$
BEGIN
    DELETE FROM public.active_players
    WHERE last_seen < NOW() - INTERVAL '60 seconds';
END;
$$ LANGUAGE plpgsql;
