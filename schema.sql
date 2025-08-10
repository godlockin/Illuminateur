-- Illuminateur Database Schema for Cloudflare D1
-- Run this script to initialize your D1 database

-- Table for storing input metadata
CREATE TABLE IF NOT EXISTS inputs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL CHECK (type IN ('text', 'url', 'image')),
    r2_object_key TEXT NOT NULL,
    original_content TEXT, -- Store original text input or URL
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Table for storing LLM analysis results
CREATE TABLE IF NOT EXISTS llm_outputs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    input_id INTEGER NOT NULL,
    summary TEXT NOT NULL,
    keywords TEXT NOT NULL, -- JSON array as string
    extracted_tables TEXT, -- JSON string for table data
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (input_id) REFERENCES inputs(id)
);

-- Table for storing weekly insights
CREATE TABLE IF NOT EXISTS weekly_insights (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    insight_text TEXT NOT NULL,
    week_start_date TEXT NOT NULL, -- ISO date string (YYYY-MM-DD)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_inputs_created_at ON inputs(created_at);
CREATE INDEX IF NOT EXISTS idx_inputs_type ON inputs(type);
CREATE INDEX IF NOT EXISTS idx_llm_outputs_input_id ON llm_outputs(input_id);
CREATE INDEX IF NOT EXISTS idx_llm_outputs_created_at ON llm_outputs(created_at);
CREATE INDEX IF NOT EXISTS idx_weekly_insights_week_start ON weekly_insights(week_start_date);