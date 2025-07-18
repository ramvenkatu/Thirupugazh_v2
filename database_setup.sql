-- Thirupugazh Song List Generator Database Setup
-- This script creates the database and required tables

-- Create database (uncomment if needed)
-- CREATE DATABASE IF NOT EXISTS thirupugazh_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Use the database
USE thirupugazh_db;

-- Create playlist_history table as specified in the SRS
CREATE TABLE IF NOT EXISTS playlist_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    song_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_song_id (song_id),
    INDEX idx_created_at (created_at)
);

-- Optional: Create additional indexes for better performance
CREATE INDEX IF NOT EXISTS idx_song_created ON playlist_history (song_id, created_at);

-- Display table structure for verification
DESCRIBE playlist_history;

-- Display initial row count (should be 0)
SELECT COUNT(*) as total_records FROM playlist_history;

SHOW TABLES; 