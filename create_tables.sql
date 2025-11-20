USE thirupugazh_db;

DROP TABLE IF EXISTS playlist_headers;
DROP TABLE IF EXISTS playlist_songs;
DROP TABLE IF EXISTS saved_playlists;

CREATE TABLE saved_playlists (
    id INT AUTO_INCREMENT PRIMARY KEY,
    playlist_name VARCHAR(255) DEFAULT 'Current Playlist',
    duration_minutes INT,
    total_songs INT,
    is_current BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE playlist_songs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    playlist_id INT NOT NULL,
    song_id INT NOT NULL,
    position INT NOT NULL,
    alankaaram_enabled BOOLEAN DEFAULT FALSE,
    alankaaram_time INT DEFAULT 5,
    FOREIGN KEY (playlist_id) REFERENCES saved_playlists(id) ON DELETE CASCADE,
    INDEX idx_playlist_position (playlist_id, position)
);

CREATE TABLE playlist_headers (
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

SHOW TABLES;
