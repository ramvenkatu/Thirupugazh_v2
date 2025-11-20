-- Thirupugazh Song List Generator Database Setup
-- This script creates the database and required tables

-- Create database (uncomment if needed)
-- CREATE DATABASE IF NOT EXISTS thirupugazh_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Use the database
USE thirupugazh_db;

-- Create playlist_history table as specified in the SRS
-- Stores last 6 completed playlists for duplicate song prevention
CREATE TABLE IF NOT EXISTS playlist_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    song_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_song_id (song_id),
    INDEX idx_created_at (created_at)
);

-- Optional: Create additional indexes for better performance
CREATE INDEX IF NOT EXISTS idx_song_created ON playlist_history (song_id, created_at);

-- Current working playlist (auto-saved, single record)
CREATE TABLE IF NOT EXISTS saved_playlists (
    id INT AUTO_INCREMENT PRIMARY KEY,
    playlist_name VARCHAR(255) DEFAULT 'Current Playlist',
    duration_minutes INT,
    total_songs INT,
    is_current BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_current (is_current)
);

-- Songs in the current working playlist
CREATE TABLE IF NOT EXISTS playlist_songs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    playlist_id INT NOT NULL,
    song_id INT NOT NULL,
    position INT NOT NULL,
    alankaaram_enabled BOOLEAN DEFAULT FALSE,
    alankaaram_time INT DEFAULT 5,
    FOREIGN KEY (playlist_id) REFERENCES saved_playlists(id) ON DELETE CASCADE,
    INDEX idx_playlist_position (playlist_id, position)
);

-- Bhajan header details for current playlist
CREATE TABLE IF NOT EXISTS playlist_headers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    playlist_id INT NOT NULL UNIQUE,
    prarthanai_id INT,
    prarthanai_text TEXT,
    function_id INT,
    function_name VARCHAR(255),
    member_id INT,
    member_name VARCHAR(255),
    member_address TEXT,
    member_phone VARCHAR(255),
    bhajan_date DATE,
    bhajan_day VARCHAR(50),
    bhajan_start_time TIME,
    bhajan_end_time TIME,
    FOREIGN KEY (playlist_id) REFERENCES saved_playlists(id) ON DELETE CASCADE
);

-- Display table structure for verification
DESCRIBE playlist_history;

-- Display initial row count (should be 0)
SELECT COUNT(*) as total_records FROM playlist_history;

SHOW TABLES; 