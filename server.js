const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const path = require('path');
const axios = require('axios');
const puppeteer = require('puppeteer');
const fs = require('fs').promises;

require('dotenv').config();

// Import songs data
const songs = require('./songs.js');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: '*',
    credentials: false
}));
app.use(express.json());
app.use(express.static(__dirname));

// MySQL Database Connection
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'thirupugazh_db'
};

let db;

// Initialize database connection
async function initializeDatabase() {
    try {
        db = await mysql.createConnection(dbConfig);
        console.log('Connected to MySQL database');
        
        // Create playlist_history table if it doesn't exist
        await db.execute(`
            CREATE TABLE IF NOT EXISTS playlist_history (
                id INT AUTO_INCREMENT PRIMARY KEY,
                song_id INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_song_id (song_id),
                INDEX idx_created_at (created_at)
            )
        `);
        
        // Create saved_playlists table for current working playlist
        await db.execute(`
            CREATE TABLE IF NOT EXISTS saved_playlists (
                id INT AUTO_INCREMENT PRIMARY KEY,
                playlist_name VARCHAR(255) DEFAULT 'Current Playlist',
                duration_minutes INT,
                total_songs INT,
                is_current BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);
        
        // Create playlist_songs table
        await db.execute(`
            CREATE TABLE IF NOT EXISTS playlist_songs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                playlist_id INT NOT NULL,
                song_id INT NOT NULL,
                position INT NOT NULL,
                alankaaram_enabled BOOLEAN DEFAULT FALSE,
                alankaaram_time INT DEFAULT 5,
                FOREIGN KEY (playlist_id) REFERENCES saved_playlists(id) ON DELETE CASCADE,
                INDEX idx_playlist_position (playlist_id, position)
            )
        `);
        
        // Create playlist_headers table
        await db.execute(`
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
            )
        `);
        
        console.log('Database tables initialized');
    } catch (error) {
        console.error('Database connection failed:', error);
        process.exit(1);
    }
}

// Utility functions for string matching
function normalizeString(str) {
    return str.toLowerCase().trim().replace(/\s+/g, ' ');
}

function fuzzyMatch(searchTerm, targetString) {
    const search = normalizeString(searchTerm);
    const target = normalizeString(targetString);
    
    // Exact match
    if (target.includes(search)) return 100;
    
    // Word boundary match
    const searchWords = search.split(' ');
    const targetWords = target.split(' ');
    let matchScore = 0;
    
    for (const searchWord of searchWords) {
        for (const targetWord of targetWords) {
            if (targetWord.includes(searchWord)) {
                matchScore += searchWord.length / search.length * 100;
            }
        }
    }
    
    return matchScore;
}

// Enhanced album name mapping function
function normalizeAlbumName(albumName) {
    if (!albumName) return '';
    
    const albumMappings = {
        // General songs variations
        'podhu paadalgal': 'பொதுப் பாடல்கள்',
        'general songs': 'பொதுப் பாடல்கள்',
        'podhu': 'பொதுப் பாடல்கள்',
        
        // Vinayagar thuthi variations
        'vinayagar thuthi': 'விநாயகர் துதி',
        'vinayagar': 'விநாயகர் துதி',
        
        // Vinayagar namavali variations
        'vinayagar namavali': 'விநாயகர் நாமாவளி',
        'namavali': 'விநாயகர் நாமாவளி',
        
        // Guru vanakkam variations
        'guru vanakkam': 'குரு வணக்கம்',
        'guru': 'குரு வணக்கம்',
        
        // Five abodes variations
        'thiruparankundram': 'திருப்பரங்குன்றம்',
        'parankundram': 'திருப்பரங்குன்றம்',
        'thiruchendur': 'திருசெந்தூர்',
        'tiruchendur': 'திருசெந்தூர்',
        'chendur': 'திருசெந்தூர்',
        'thirupazhanee': 'திருப்பழனி',
        'thiruppalani': 'திருப்பழனி',
        'pazhani': 'திருப்பழனி',
        'palani': 'திருப்பழனி',
        'pazhanee': 'திருப்பழனி',
        'swami malai': 'ஸ்வாமி மலை',
        'swamalai': 'ஸ்வாமி மலை',
        'thiruthanigai': 'திருத்தணிகை',
        'thanigai': 'திருத்தணிகை',
        
        // Other albums
        'pazhamudirsolai': 'பழமுதிர் சோலை',
        'pazhamuddir': 'பழமுதிர் சோலை',
        'kandhar anubhooti': 'கந்தர் அனுபூதி',
        'anubhooti': 'கந்தர் அனுபூதி',
        've ma se': 'வே, ம, சே',
        'vemase': 'வே, ம, சே',
        'viru': 'விரு',
        'makudam': 'மகுடம்',
        'vakuppu': 'வகுப்பு',
        'poojopacharangal': 'பூஜோபசாரங்கள்',
        'pooja': 'பூஜோபசாரங்கள்',
        'erumayil': 'ஏறுமயில்',
        'prarthana': 'ப்ரார்த்தனை',
        'prarthanai': 'ப்ரார்த்தனை'
    };
    
    // Normalize to lowercase for mapping lookup
    const normalized = normalizeString(albumName);
    
    // Check for exact mappings first
    if (albumMappings[normalized]) {
        return albumMappings[normalized];
    }
    
    // Check for partial matches in Tamil names
    for (const [key, value] of Object.entries(albumMappings)) {
        if (normalized.includes(key) || key.includes(normalized)) {
            return value;
        }
    }
    
    return albumName;
}

// Enhanced song search functionality
function searchSongs(query, options = {}) {
    const { 
        albumFilter = null, 
        minScore = 30,
        maxResults = 10 
    } = options;
    
    const results = [];
    
    for (const song of songs) {
        // Skip if album filter is specified and doesn't match
        if (albumFilter && song.album !== albumFilter) continue;
        
        // Calculate match scores
        const titleScore = fuzzyMatch(query, song.title);
        const albumScore = fuzzyMatch(query, song.album || '');
        const maxScore = Math.max(titleScore, albumScore);
        
        if (maxScore >= minScore) {
            results.push({
                ...song,
                matchScore: maxScore,
                matchType: titleScore > albumScore ? 'title' : 'album'
            });
        }
    }
    
    // Sort by match score descending
    return results
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, maxResults);
}

// Get songs by album (enhanced)
function getSongsByAlbum(albumName) {
    const normalizedAlbum = normalizeAlbumName(albumName);
    const results = songs.filter(song => song.album === normalizedAlbum);
    
    // Debug logging for specific problematic album
    if (albumName === 'பொதுப் பாடல்கள்') {
        console.log(`DEBUG getSongsByAlbum: Looking for "${albumName}"`);
        console.log(`DEBUG getSongsByAlbum: Normalized to "${normalizedAlbum}"`);
        console.log(`DEBUG getSongsByAlbum: Found ${results.length} songs`);
        if (results.length > 0) {
            console.log(`DEBUG getSongsByAlbum: First few songs:`, results.slice(0, 3).map(s => s.title));
        }
    }
    
    return results;
}

// Get recently used songs from database
async function getRecentlyUsedSongs(daysBack = 30) {
    try {
        // Get songs from the last 6 completed playlists (using distinct timestamps)
        const [rows] = await db.execute(`
            SELECT DISTINCT song_id 
            FROM playlist_history 
            WHERE created_at >= (
                SELECT created_at 
                FROM (
                    SELECT DISTINCT created_at 
                    FROM playlist_history 
                    ORDER BY created_at DESC 
                    LIMIT 6
                ) AS last_six
                ORDER BY created_at ASC
                LIMIT 1
            )
        `);
        return rows.map(row => row.song_id);
    } catch (error) {
        console.error('Error fetching recently used songs:', error);
        return [];
    }
}

// Utility function to convert duration string to seconds
function durationToSeconds(durationStr) {
    if (!durationStr) return 0;
    const parts = durationStr.split('.');
    const minutes = parseInt(parts[0]) || 0;
    const seconds = parseInt(parts[1]) || 0;
    return minutes * 60 + seconds;
}

// Save playlist to history and clean up old entries
async function savePlaylistToHistory(playlist) {
    try {
        // Insert all songs from the playlist with the current timestamp
        // (they will all have the same created_at, marking them as one playlist)
        for (const song of playlist) {
            await db.execute(
                'INSERT INTO playlist_history (song_id) VALUES (?)',
                [song.id]
            );
        }
        
        // Clean up: Keep only the last 6 playlists
        // Delete songs from playlists older than the 6th most recent
        await db.execute(`
            DELETE FROM playlist_history 
            WHERE created_at < (
                SELECT created_at FROM (
                    SELECT DISTINCT created_at 
                    FROM playlist_history 
                    ORDER BY created_at DESC 
                    LIMIT 1 OFFSET 5
                ) AS sixth_playlist
            )
        `);
        
        console.log('Playlist saved to history and old playlists cleaned up');
    } catch (error) {
        console.error('Error saving playlist to history:', error);
    }
}

// Check if song is already in playlist
function isDuplicateSong(playlist, song) {
    return playlist.some(existingSong => existingSong.id === song.id);
}

// Select random song from album avoiding recently used
function selectRandomSong(albumSongs, recentlyUsed = []) {
    const availableSongs = albumSongs.filter(song => !recentlyUsed.includes(song.id));
    
    if (availableSongs.length === 0) {
        // If no available songs, use any song from album
        return albumSongs[Math.floor(Math.random() * albumSongs.length)];
    }
    
    return availableSongs[Math.floor(Math.random() * availableSongs.length)];
}

// Main playlist generation engine following 13-step sequence
async function generatePlaylist(desiredDurationMinutes) {
    const playlist = [];
    const recentlyUsed = await getRecentlyUsedSongs();
    let totalDuration = 0;

    // Calculate duration targets upfront
    const desiredDurationSeconds = desiredDurationMinutes * 60;
    const tolerance = desiredDurationSeconds * 0.05; // 5% tolerance
    const maxDuration = desiredDurationSeconds + tolerance;
    const minDuration = desiredDurationSeconds - tolerance;

    console.log('=== PLAYLIST GENERATION DEBUG ===');
    console.log('Desired duration:', desiredDurationMinutes, 'minutes');
    console.log('Recently used songs:', recentlyUsed.length);

    // Step 1: கைத்தலம் (Compulsory) - exact title match
    console.log('\n--- Step 1: கைத்தலம் ---');
    const kaithalamSong = songs.find(song => song.title === 'கைத்தலம்');
    if (kaithalamSong) {
        playlist.push(kaithalamSong);
        totalDuration += durationToSeconds(kaithalamSong.duration);
        console.log('Added:', kaithalamSong.title, 'from', kaithalamSong.album);
    } else {
        console.log('கைத்தலம் song not found!');
    }

    // Step 2: விநாயகர் துதி (1 Additional Song) - different from கைத்தலம்
    console.log('\n--- Step 2: விநாயகர் துதி (Additional Song) ---');
    const vinayagarThuthiSongs = getSongsByAlbum('விநாயகர் துதி')
        .filter(song => song.title !== 'கைத்தலம்');
    console.log('Available விநாயகர் துதி songs (excluding கைத்தலம்):', vinayagarThuthiSongs.length);
    if (vinayagarThuthiSongs.length > 0) {
        const song = selectRandomSong(vinayagarThuthiSongs, recentlyUsed);
        playlist.push(song);
        totalDuration += durationToSeconds(song.duration);
        console.log('Added:', song.title, 'from', song.album);
    }

    // Step 3: விநாயகர் நாமாவளி (1 Song)
    console.log('\n--- Step 3: விநாயகர் நாமாவளி ---');
    const vinayagarNamavaliSongs = getSongsByAlbum('விநாயகர் நாமாவளி');
    console.log('Available விநாயகர் நாமாவளி songs:', vinayagarNamavaliSongs.length);
    if (vinayagarNamavaliSongs.length > 0) {
        const song = selectRandomSong(vinayagarNamavaliSongs, recentlyUsed);
        playlist.push(song);
        totalDuration += durationToSeconds(song.duration);
        console.log('Added:', song.title, 'from', song.album);
    }

    // Step 4: குரு வணக்கம் (Compulsory)
    console.log('\n--- Step 4: குரு வணக்கம் ---');
    const guruVanakkamSongs = getSongsByAlbum('குரு வணக்கம்');
    console.log('Available குரு வணக்கம் songs:', guruVanakkamSongs.length);
    if (guruVanakkamSongs.length > 0) {
        const song = selectRandomSong(guruVanakkamSongs, recentlyUsed);
        playlist.push(song);
        totalDuration += durationToSeconds(song.duration);
        console.log('Added:', song.title, 'from', song.album);
    }

    // Step 5: The Five Abodes (2 Songs Each)
    console.log('\n--- Step 5: The Five Abodes (2 Songs Each) ---');
    const fiveAbodes = [
        'திருப்பரங்குன்றம்',
        'திருசெந்தூர்',
        'திருப்பழனி',
        'ஸ்வாமி மலை',
        'திருத்தணிகை'
    ];
    
    for (const abode of fiveAbodes) {
        const abodeSongs = getSongsByAlbum(abode);
        console.log(`Available ${abode} songs:`, abodeSongs.length);
        
        // Select 2 songs from each abode
        for (let i = 0; i < 2 && abodeSongs.length > 0; i++) {
            const song = selectRandomSong(abodeSongs, recentlyUsed);
            playlist.push(song);
            totalDuration += durationToSeconds(song.duration);
            console.log(`Added (${i+1}/2):`, song.title, 'from', song.album);
            
            // Remove the selected song from the pool to avoid duplicates
            const songIndex = abodeSongs.findIndex(s => s.id === song.id);
            if (songIndex > -1) {
                abodeSongs.splice(songIndex, 1);
            }
        }
    }

    // Step 5f: குன்றுதோறாடல் (1 Song) - NEW STEP as requested
    console.log('\n--- Step 5f: குன்றுதோறாடல் ---');
    const kunruthoradalsongs = getSongsByAlbum('குன்றுதோறாடல்');
    console.log('Available குன்றுதோறாடல் songs:', kunruthoradalsongs.length);
    if (kunruthoradalsongs.length > 0) {
        const song = selectRandomSong(kunruthoradalsongs, recentlyUsed);
        playlist.push(song);
        totalDuration += durationToSeconds(song.duration);
        console.log('Added:', song.title, 'from', song.album);
    }

    // Step 6: பொதுப் பாடல்கள் (ALL Required - Including Fillers)
    console.log('\n--- Step 6: பொதுப் பாடல்கள் (ALL Songs) ---');
    const generalSongs = getSongsByAlbum('பொதுப் பாடல்கள்');
    console.log('Available பொதுப் பாடல்கள் songs:', generalSongs.length);
    
    if (generalSongs.length === 0) {
        console.error('ERROR: No பொதுப் பாடல்கள் songs found in database!');
    } else {
        // Calculate accurate remaining time for Steps 7-16 by sampling actual songs
        // Sample one song from each remaining mandatory album to estimate actual duration
        let estimatedRemainingStepsDuration = 0;
        const remainingMandatoryAlbums = [
            'பஞ்சபூதம் காஞ்சீபுரம்', 'பழமுதிர் சோலை', 'கந்தர் அனுபூதி', 
            'வே, ம, சே', 'விரு', 'மகுடம்', 'வகுப்பு', 'பூஜோபசாரங்கள்', 
            'ஏறுமயில்', 'ப்ரார்த்தனை'
        ];
        
        remainingMandatoryAlbums.forEach(albumName => {
            const albumSongs = getSongsByAlbum(albumName);
            if (albumSongs.length > 0) {
                const avgDuration = albumSongs.reduce((sum, song) => sum + durationToSeconds(song.duration), 0) / albumSongs.length;
                estimatedRemainingStepsDuration += avgDuration;
            } else {
                estimatedRemainingStepsDuration += 3.5 * 60; // Default 3.5 minutes if no songs found
            }
        });
        
        // Add time for Pancha Bhoota albums (up to 5 songs)
        const panchaBhootaAlbums = [...new Set(songs
            .filter(song => song.album && song.album.startsWith('பஞ்சபூதம் '))
            .map(song => song.album)
        )];
        const panchaBhootaCount = Math.min(5, panchaBhootaAlbums.length);
        if (panchaBhootaCount > 0) {
            const panchaBhootaSongs = songs.filter(song => song.album && song.album.startsWith('பஞ்சபூதம் '));
            const avgPanchaBhootaDuration = panchaBhootaSongs.reduce((sum, song) => sum + durationToSeconds(song.duration), 0) / panchaBhootaSongs.length;
            estimatedRemainingStepsDuration += avgPanchaBhootaDuration * panchaBhootaCount;
        }
        
        console.log(`Calculated remaining steps duration: ${Math.round(estimatedRemainingStepsDuration/60)} minutes`);
        
        const timeAvailableForGeneral = Math.max(0, desiredDurationSeconds - totalDuration - estimatedRemainingStepsDuration);
        
        console.log(`Target duration: ${Math.round(desiredDurationSeconds/60)} minutes (±${Math.round(tolerance/60)} minutes tolerance)`);
        console.log(`Time available for பொதுப் பாடல்கள்: ${Math.round(timeAvailableForGeneral/60)} minutes`);
        
        // Calculate how many பொதுப் பாடல்கள் songs needed with more accurate duration calculation
        const generalSongDurations = generalSongs.map(song => durationToSeconds(song.duration));
        const avgGeneralSongDuration = generalSongDurations.reduce((sum, dur) => sum + dur, 0) / generalSongDurations.length;
        const targetGeneralSongsCount = Math.max(3, Math.round(timeAvailableForGeneral / avgGeneralSongDuration));
        
        console.log(`Target பொதுப் பாடல்கள் songs: ${targetGeneralSongsCount}`);
        
        const usedGeneralSongs = new Set(); // Track songs used in this step to avoid duplicates
        let generalSongsAdded = 0;
        let generalSongsDuration = 0;
        
        for (let i = 0; i < targetGeneralSongsCount && generalSongs.length > 0; i++) {
            // Filter out songs already used in this step and in current playlist
            const availableGeneralSongs = generalSongs.filter(song => 
                !usedGeneralSongs.has(song.id) && 
                !playlist.some(existing => existing.id === song.id)
            );
            
            if (availableGeneralSongs.length === 0) {
                console.log('Warning: All பொதுப் பாடல்கள் songs already used');
                break;
            }
            
            // Select random song, preferring non-recently used
            const nonRecentSongs = availableGeneralSongs.filter(song => !recentlyUsed.includes(song.id));
            const songPool = nonRecentSongs.length > 0 ? nonRecentSongs : availableGeneralSongs;
            const song = songPool[Math.floor(Math.random() * songPool.length)];
            
            if (song) {
                const songDuration = durationToSeconds(song.duration);
                // Check if adding this song would exceed the target duration (considering tolerance)
                const projectedTotalDuration = totalDuration + songDuration + estimatedRemainingStepsDuration;
                if (projectedTotalDuration <= maxDuration) {
                    playlist.push(song);
                    usedGeneralSongs.add(song.id);
                    totalDuration += songDuration;
                    generalSongsDuration += songDuration;
                    generalSongsAdded++;
                    console.log(`Added general song ${generalSongsAdded}:`, song.title, 'from', song.album, `(ID: ${song.id}, ${Math.round(songDuration/60)}min)`);
                } else {
                    console.log(`Stopping பொதுப் பாடல்கள் addition - would exceed time budget`);
                    break;
                }
            }
        }
        
        console.log(`Successfully added ${generalSongsAdded} பொதுப் பாடல்கள் songs (${Math.round(generalSongsDuration/60)} minutes)`);
    }

    // Step 7: Pancha Bhoota Sthalams (Up to 5 Songs)
    console.log('\n--- Step 7: Pancha Bhoota Sthalams ---');
    const panchaBhootaAlbums = [...new Set(songs
        .filter(song => song.album && song.album.startsWith('பஞ்சபூதம் '))
        .map(song => song.album)
    )];
    console.log('Found Pancha Bhoota albums:', panchaBhootaAlbums.length);
    console.log('Albums:', panchaBhootaAlbums);
    
    for (const albumName of panchaBhootaAlbums.slice(0, 5)) { // Up to 5 albums
        const albumSongs = getSongsByAlbum(albumName);
        console.log(`Available ${albumName} songs:`, albumSongs.length);
        if (albumSongs.length > 0) {
            const song = selectRandomSong(albumSongs, recentlyUsed);
            playlist.push(song);
            totalDuration += durationToSeconds(song.duration);
            console.log('Added:', song.title, 'from', song.album);
        }
    }

    // Step 8: பழமுதிர் சோலை (2 Songs)
    console.log('\n--- Step 8: பழமுதிர் சோலை (2 Songs) ---');
    const pazhamuthirSongs = getSongsByAlbum('பழமுதிர் சோலை');
    console.log('Available பழமுதிர் சோலை songs:', pazhamuthirSongs.length);
    
    // Select 2 songs from பழமுதிர் சோலை
    for (let i = 0; i < 2 && pazhamuthirSongs.length > 0; i++) {
        const song = selectRandomSong(pazhamuthirSongs, recentlyUsed);
        playlist.push(song);
        totalDuration += durationToSeconds(song.duration);
        console.log(`Added (${i+1}/2):`, song.title, 'from', song.album);
        
        // Remove the selected song from the pool to avoid duplicates
        const songIndex = pazhamuthirSongs.findIndex(s => s.id === song.id);
        if (songIndex > -1) {
            pazhamuthirSongs.splice(songIndex, 1);
        }
    }

    // Step 9: கந்தர் அனுபூதி (Compulsory)
    console.log('\n--- Step 9: கந்தர் அனுபூதி ---');
    const kantharAnubhoothiSongs = getSongsByAlbum('கந்தர் அனுபூதி');
    console.log('Available கந்தர் அனுபூதி songs:', kantharAnubhoothiSongs.length);
    if (kantharAnubhoothiSongs.length > 0) {
        const song = selectRandomSong(kantharAnubhoothiSongs, recentlyUsed);
        playlist.push(song);
        totalDuration += durationToSeconds(song.duration);
        console.log('Added:', song.title, 'from', song.album);
    }

    // Step 10: வே, ம, சே (Compulsory)
    console.log('\n--- Step 10: வே, ம, சே ---');
    const veMaSeSongs = getSongsByAlbum('வே, ம, சே');
    console.log('Available வே, ம, சே songs:', veMaSeSongs.length);
    if (veMaSeSongs.length > 0) {
        const song = selectRandomSong(veMaSeSongs, recentlyUsed);
        playlist.push(song);
        totalDuration += durationToSeconds(song.duration);
        console.log('Added:', song.title, 'from', song.album);
    }

    // Step 11: விரு (Compulsory)
    console.log('\n--- Step 11: விரு ---');
    const viruSongs = getSongsByAlbum('விரு');
    console.log('Available விரு songs:', viruSongs.length);
    if (viruSongs.length > 0) {
        const song = selectRandomSong(viruSongs, recentlyUsed);
        playlist.push(song);
        totalDuration += durationToSeconds(song.duration);
        console.log('Added:', song.title, 'from', song.album);
    }

    // Step 12: மகுடம் (Compulsory)
    console.log('\n--- Step 12: மகுடம் ---');
    const makudamSongs = getSongsByAlbum('மகுடம்');
    console.log('Available மகுடம் songs:', makudamSongs.length);
    if (makudamSongs.length > 0) {
        const song = selectRandomSong(makudamSongs, recentlyUsed);
        playlist.push(song);
        totalDuration += durationToSeconds(song.duration);
        console.log('Added:', song.title, 'from', song.album);
    }

    // Step 13: வகுப்பு (Compulsory)
    console.log('\n--- Step 13: வகுப்பு ---');
    const vakuppuSongs = getSongsByAlbum('வகுப்பு');
    console.log('Available வகுப்பு songs:', vakuppuSongs.length);
    if (vakuppuSongs.length > 0) {
        const song = selectRandomSong(vakuppuSongs, recentlyUsed);
        playlist.push(song);
        totalDuration += durationToSeconds(song.duration);
        console.log('Added:', song.title, 'from', song.album);
    }

    // Step 14: பூஜோபசாரங்கள் (Compulsory)
    console.log('\n--- Step 14: பூஜோபசாரங்கள் ---');
    const poojopacharangalSongs = getSongsByAlbum('பூஜோபசாரங்கள்');
    console.log('Available பூஜோபசாரங்கள் songs:', poojopacharangalSongs.length);
    if (poojopacharangalSongs.length > 0) {
        const song = selectRandomSong(poojopacharangalSongs, recentlyUsed);
        playlist.push(song);
        totalDuration += durationToSeconds(song.duration);
        console.log('Added:', song.title, 'from', song.album);
    }

    // Step 15: ஏறுமயில் (Compulsory)
    console.log('\n--- Step 15: ஏறுமயில் ---');
    const erumayilSongs = getSongsByAlbum('ஏறுமயில்');
    console.log('Available ஏறுமயில் songs:', erumayilSongs.length);
    if (erumayilSongs.length > 0) {
        const song = selectRandomSong(erumayilSongs, recentlyUsed);
        playlist.push(song);
        totalDuration += durationToSeconds(song.duration);
        console.log('Added:', song.title, 'from', song.album);
    }

    // Step 16: ப்ரார்த்தனை (Compulsory)
    console.log('\n--- Step 16: ப்ரார்த்தனை ---');
    const prarthanaiequalSongs = getSongsByAlbum('ப்ரார்த்தனை');
    console.log('Available ப்ரார்த்தனை songs:', prarthanaiequalSongs.length);
    if (prarthanaiequalSongs.length > 0) {
        const song = selectRandomSong(prarthanaiequalSongs, recentlyUsed);
        playlist.push(song);
        totalDuration += durationToSeconds(song.duration);
        console.log('Added:', song.title, 'from', song.album);
    }

    console.log('\n--- Compulsory songs total duration:', Math.round(totalDuration / 60), 'minutes ---');

    // Note: பொதுப் பாடல்கள் (General Songs) are now added at Step 6 instead of as fillers
    console.log('\n--- Final Duration Check ---');
    const finalDurationMinutes = Math.round(totalDuration / 60);
    const targetDurationMinutes = Math.round(desiredDurationSeconds / 60);
    const toleranceMinutes = Math.round(tolerance / 60);
    const durationDifference = Math.abs(finalDurationMinutes - targetDurationMinutes);
    const isWithinTolerance = totalDuration >= minDuration && totalDuration <= maxDuration;
    
    console.log(`Final playlist duration: ${finalDurationMinutes} minutes (target: ${targetDurationMinutes} ± ${toleranceMinutes} minutes)`);
    console.log(`Duration difference: ${durationDifference} minutes`);
    console.log(`Within 5% tolerance: ${isWithinTolerance ? 'YES' : 'NO'}`);
    
    if (!isWithinTolerance) {
        console.log(`Warning: Playlist duration is outside the 5% tolerance range`);
        if (totalDuration < minDuration) {
            console.log('Suggestion: Consider adding more பொதுப் பாடல்கள் or using AI chat to add songs');
        } else {
            console.log('Suggestion: Consider removing some பொதுப் பாடல்கள் or using AI chat to adjust playlist');
        }
    }

    console.log('\n=== FINAL PLAYLIST ===');
    console.log('Total songs:', playlist.length);
    console.log('Total duration:', Math.round(totalDuration / 60), 'minutes');
    console.log('Songs by album:');
    const albumCounts = playlist.reduce((acc, song) => {
        acc[song.album] = (acc[song.album] || 0) + 1;
        return acc;
    }, {});
    console.log(albumCounts);

    return playlist;
}

// API Routes

// Generate playlist endpoint
app.post('/api/generate-playlist', async (req, res) => {
    try {
        const { duration, headerData } = req.body;
        
        if (!duration || duration < 10 || duration > 300) {
            return res.status(400).json({ 
                error: 'Duration must be between 10 and 300 minutes' 
            });
        }

        const playlist = await generatePlaylist(duration);
        
        // Save to history
        await savePlaylistToHistory(playlist);
        
        res.json({
            playlist,
            headerData: headerData || null,
            totalDuration: playlist.reduce((sum, song) => sum + durationToSeconds(song.duration), 0),
            requestedDuration: duration * 60
        });
    } catch (error) {
        console.error('Error generating playlist:', error);
        res.status(500).json({ error: 'Failed to generate playlist' });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ ok: true, ts: Date.now() });
});

// Search songs endpoint (used by AI Assistant and UI)
app.get('/api/search', (req, res) => {
    try {
        const { query = '', albumFilter, minScore, maxResults } = req.query;
        if (!query || !String(query).trim()) {
            return res.status(400).json({ error: 'query parameter is required' });
        }
        const options = {
            albumFilter: albumFilter ? normalizeAlbumName(albumFilter) : null,
            minScore: isNaN(parseInt(minScore)) ? 30 : parseInt(minScore),
            maxResults: isNaN(parseInt(maxResults)) ? 10 : parseInt(maxResults)
        };
        const results = searchSongs(query, options);
        // Return array directly to match frontend expectations
        res.json(results);
    } catch (err) {
        console.error('Error in /api/search:', err);
        res.status(500).json({ error: 'Search failed' });
    }
});

// Get songs by album endpoint
app.get('/api/songs/:album', (req, res) => {
    try {
        const raw = req.params.album || '';
        const albumName = decodeURIComponent(raw);
        const results = getSongsByAlbum(albumName);
        res.json(results);
    } catch (err) {
        console.error('Error in /api/songs/:album:', err);
        res.status(500).json({ error: 'Failed to fetch songs by album' });
    }
});

// LLM proxy endpoint for AI chatbot
app.post('/api/llm-chat', async (req, res) => {
    const { message, playlist } = req.body;
    
    try {
        if (!process.env.LLM_API_KEY) {
            return res.status(500).json({ error: 'LLM API key not configured' });
        }

        const systemPrompt = `You are an AI assistant for the Thirupugazh Song List Generator. 
        The user can ask you to modify the current playlist. You should respond with JSON commands 
        that the frontend can execute, along with a brief user-friendly explanation.
        
        IMPORTANT: The playlist follows a strict 16-step sequence order based on album hierarchy:
        1. விநாயகர் துதி (கைத்தலம் + additional songs)
        2. விநாயகர் நாமாவளி
        3. குரு வணக்கம்
        4. திருப்பரங்குன்றம், திருசெந்தூர், திருப்பழனி, ஸ்வாமி மலை, திருத்தணிகை (Five Abodes)
        5. பொதுப் பாடல்கள் (General Songs - ALL placed here before பஞ்சபூதம்)
        6. பஞ்சபூதம் albums (Pancha Bhoota Sthalams)
        7. பழமுதிர் சோலை
        8. கந்தர் அனுபூதி
        9. வே, ம, சே
        10. விரு
        11. மகுடம்
        12. வகுப்பு
        13. பூஜோபசாரங்கள் (Compulsory)
        14. ஏறுமயில் (Compulsory)
        15. ப்ரார்த்தனை (Compulsory)
        
        All songs will be automatically positioned according to this hierarchy regardless of requested positions.

        ALBUM NAME MAPPING: When users mention albums in English, use these exact Tamil names:
        - "podhu paadalgal" or "general songs" → "பொதுப் பாடல்கள்"
        - "vinayagar thuthi" → "விநாயகர் துதி"
        - "thiruparankundram" → "திருப்பரங்குன்றம்"
        - "thiruchendur" or "tiruchendur" → "திருசெந்தூர்"
        - "thirupazhanee" or "pazhani" or "palani" → "திருப்பழனி"
        - "swami malai" → "ஸ்வாமி மலை"
        - "thiruthanigai" → "திருத்தணிகை"
        - "pazhamudirsolai" → "பழமுதிர் சோலை"
        - "poojopacharangal" or "pooja" → "பூஜோபசாரங்கள்"
        - "erumayil" → "ஏறுமயில்"
        - "prarthana" or "prarthanai" → "ப்ரார்த்தனை"
        - "ve ma se" or "vemase" → "வே, ம, சே"
        
        CRITICAL: When generating JSON commands with album names containing commas (like "வே, ம, சே"), 
        the JSON MUST be properly formatted with the album name as a string value in quotes.
        Example: {"action": "add", "albumName": "வே, ம, சே", "count": 1}
        
        HANDLING SPECIFIC SONG REQUESTS:
        When users ask for specific songs by title (e.g., "add song oruvarai oruvar"), use the search command to find the exact song.
        
        RESPONSE FORMAT: Provide a brief user-friendly explanation followed by the JSON command(s).
        
        EXAMPLES:
        User: "Add 5 songs from tiruchendur"
        Response: "I'll add 5 songs from the திருசெந்தூர் album. {"action": "add", "albumName": "திருசெந்தூர்", "count": 5}"

        User: "Remove the first song"
        Response: "I'll remove the first song from your playlist. {"action": "remove", "position": 1}"
        User: "Replace the first song with one from pazhani"
        Response: "I'll replace the first song with one from திருப்பழனி. Note that the new song will be positioned according to the 16-step sequence, not at position 1. {"action": "replace", "position": 1, "newAlbumName": "திருப்பழனி"}"

        User: "Remove 5 songs from podhu paadalgal"
        Response: "I'll remove 5 songs from the பொதுப் பாடல்கள் album. {"action": "remove_from_album", "albumName": "பொதுப் பாடல்கள்", "count": 5}"
        
        Available commands:
        - {"action": "remove", "songId": number} - Remove a song by its ID
        - {"action": "remove_from_album", "albumName": "string", "count": number} - Remove a specified number of songs from an album.
        - {"action": "add", "albumName": "string"} - Add a song from specified album (position ignored, uses hierarchy)
        - {"action": "search_and_add", "songTitle": "string", "albumHint": "string"} - Search for specific song and add it
        - {"action": "move", "songId": number} - Move a song (will be repositioned according to hierarchy)
        - {"action": "replace", "songId": number, "newAlbumName": "string"} - Replace a song with one from another album (note: replacement song will be repositioned according to 16-step hierarchy)
        
        Current playlist: ${JSON.stringify(playlist)}`;

        // Check if using Gemini API (default to Gemini if LLM_PROVIDER is not set or is 'gemini')
        const llmProvider = process.env.LLM_PROVIDER || 'gemini';
        const isGeminiAPI = llmProvider.toLowerCase() === 'gemini';

        let response;
        
        if (isGeminiAPI) {
            // Google Gemini API format using correct headers and model
            const geminiModel = process.env.LLM_MODEL || 'gemini-2.0-flash';
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent`;
            
            response = await axios.post(
                apiUrl,
                {
                    contents: [
                        {
                            parts: [
                                {
                                    text: `${systemPrompt}\n\nUser: ${message}`
                                }
                            ]
                        }
                    ],
                    generationConfig: {
                        maxOutputTokens: 500,
                        temperature: 0.7
                    }
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'X-goog-api-key': process.env.LLM_API_KEY
                    }
                }
            );
            
            // Extract response from Gemini format
            const geminiResponse = response.data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated';
            res.json({ response: geminiResponse });
            
        } else {
            // OpenAI API format (fallback)
            response = await axios.post(
                process.env.LLM_API_URL || 'https://api.openai.com/v1/chat/completions',
                {
                    model: process.env.LLM_MODEL || 'gpt-3.5-turbo',
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: message }
                    ],
                    max_tokens: 500
                },
                {
                    headers: {
                        'Authorization': `Bearer ${process.env.LLM_API_KEY}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            res.json({ response: response.data.choices[0].message.content });
        }
        
    } catch (error) {
        console.error('Error with LLM request:', error);
        console.error('Error details:', error.response?.data || error.message);
        console.error('Original user message:', message);
        console.error('Stack trace:', error.stack);
        res.status(500).json({ 
            error: 'Failed to process LLM request',
            details: error.response?.data?.error?.message || error.message,
            userMessage: message
        });
    }
});

// Server-side PDF generation endpoint
app.post('/api/generate-pdf', async (req, res) => {
    try {
        const { playlist, alankaaramData = {}, headerData = null } = req.body;
        
        if (!playlist || playlist.length === 0) {
            return res.status(400).json({ error: 'No playlist data provided' });
        }

        // Create HTML content for PDF
        const now = new Date();
        const totalDuration = playlist.reduce((sum, song) => {
            const duration = durationToSeconds(song.duration);
            return sum + duration;
        }, 0);

        const formatDuration = (seconds) => {
            const mins = Math.floor(seconds / 60);
            const secs = Math.floor(seconds % 60);
            return `${mins}:${secs.toString().padStart(2, '0')}`;
        };

        const formatTotalDuration = (seconds) => {
            const hours = Math.floor(seconds / 3600);
            const mins = Math.floor((seconds % 3600) / 60);
            if (hours > 0) {
                return `${hours}:${mins.toString().padStart(2, '0')}`;
            }
            return `${mins}:${Math.floor(seconds % 60).toString().padStart(2, '0')}`;
        };

        // Create header content if header data exists
        let headerSection = '';
        if (headerData) {
            headerSection += '<div class="bhajan-header">';
            
            // Line 1: Prarthanai
            if (headerData.selectedPrarthanai) {
                headerSection += `<div class="header-line prayer-text">${headerData.selectedPrarthanai.text}</div>`;
            }
            
            // Line 2: Function
            if (headerData.selectedFunction) {
                headerSection += `<div class="header-line function-text">${headerData.selectedFunction.name}</div>`;
            }
            
            // Line 3: Date, Day, Time
            if (headerData.bhajanDetails && (headerData.bhajanDetails.date || headerData.bhajanDetails.startTime || headerData.bhajanDetails.endTime)) {
                let line3Content = [];
                
                if (headerData.bhajanDetails.date) {
                    const dateObj = new Date(headerData.bhajanDetails.date);
                    const formattedDate = dateObj.toLocaleDateString('en-IN');
                    line3Content.push(formattedDate);
                }
                
                if (headerData.bhajanDetails.day) {
                    line3Content.push(headerData.bhajanDetails.day);
                }
                
                if (headerData.bhajanDetails.startTime) {
                    const startTimeObj = new Date(`1970-01-01T${headerData.bhajanDetails.startTime}`);
                    const formattedStartTime = startTimeObj.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
                    
                    if (headerData.bhajanDetails.endTime) {
                        const endTimeObj = new Date(`1970-01-01T${headerData.bhajanDetails.endTime}`);
                        const formattedEndTime = endTimeObj.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
                        line3Content.push(`${formattedStartTime} - ${formattedEndTime}`);
                    } else {
                        line3Content.push(formattedStartTime);
                    }
                } else if (headerData.bhajanDetails.endTime) {
                    const endTimeObj = new Date(`1970-01-01T${headerData.bhajanDetails.endTime}`);
                    const formattedEndTime = endTimeObj.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
                    line3Content.push(`Until ${formattedEndTime}`);
                }
                
                if (line3Content.length > 0) {
                    headerSection += `<div class="header-line details-text">${line3Content.join(' | ')}</div>`;
                }
            }
            
            // Line 4: Host details
            if (headerData.selectedMember) {
                headerSection += `
                    <div class="header-line host-text">
                        ${headerData.selectedMember.name}<br>
                        <span class="host-details">
                            ${headerData.selectedMember.address}<br>
                            ${headerData.selectedMember.phone_numbers.join(', ')}
                        </span>
                    </div>
                `;
            }
            
            headerSection += '</div>';
        }

        // Implement proper pagination with manual page breaks and header repetition
        // Use a slightly smaller first page to account for the header block height
        const firstPageSongs = 21; // leave more room for header so table doesn't spill
        const pageChunks = [];
        if (playlist.length <= firstPageSongs) {
            pageChunks.push(playlist.slice());
        } else {
            pageChunks.push(playlist.slice(0, firstPageSongs));
            // Put the rest on the next page (we currently target max 2 pages)
            pageChunks.push(playlist.slice(firstPageSongs));
        }

        const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Thirupugazh Playlist</title>
            <style>
                @page {
                    size: A4 portrait;
                    margin: 0.7in 0.5in 0.5in 0.5in;
                }
                
                .page-header {
                    text-align: center;
                    margin-bottom: 15px;
                    padding: 10px;
                    background-color: #f8f9fa;
                    border: 1px solid #ddd;
                    border-radius: 3px;
                    page-break-inside: avoid;
                    page-break-after: avoid;
                }
                
                .playlist-table thead {
                    display: table-header-group !important;
                    page-break-inside: avoid;
                    page-break-after: avoid;
                }
                
                body {
                    font-family: 'Noto Sans Tamil', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    font-size: 11pt;
                    font-weight: bold;
                    font-style: normal;
                    line-height: 1.2;
                    margin: 0;
                    padding: 0;
                    color: #333;
                    column-count: 1 !important;
                    column-width: auto !important;
                    columns: none !important;
                    text-rendering: optimizeLegibility;
                    -webkit-font-feature-settings: "liga", "kern";
                    font-feature-settings: "liga", "kern";
                }
                
                .header {
                    text-align: center;
                    margin-bottom: 15px;
                    border-bottom: 2px solid #333;
                    padding-bottom: 10px;
                }
                
                .title {
                    font-size: 22pt;
                    font-weight: bold;
                    margin-bottom: 8px;
                }
                
                .info {
                    font-size: 16pt;
                    font-weight: bold;
                    margin: 3px 0;
                }
                
                .bhajan-header {
                    text-align: center;
                    margin-bottom: 15px;
                    padding: 15px;
                    background-color: #f8f9fa;
                    border: 1px solid #ddd;
                    border-radius: 3px;
                    page-break-inside: avoid;
                    page-break-after: avoid;
                }
                
                .header-line {
                    margin-bottom: 8px;
                    line-height: 1.4;
                }
                
                .header-line:last-child {
                    margin-bottom: 0;
                }
                
                .prayer-text {
                    font-size: 14pt;
                    color: #333;
                }
                
                .function-text {
                    font-weight: bold;
                    font-size: 16pt;
                    color: #333;
                }
                
                .details-text {
                    font-size: 14pt;
                    color: #333;
                }
                
                .host-text {
                    font-size: 14pt;
                    font-weight: bold;
                    color: #333;
                }
                
                .host-details {
                    font-weight: normal;
                    font-size: 12pt;
                    display: block;
                    margin-top: 4px;
                }
                
                .page-break {
                    page-break-before: always;
                }
                
                .page-header {
                    text-align: center;
                    margin-bottom: 15px;
                    padding: 10px;
                    background-color: #f8f9fa;
                    border: 1px solid #ddd;
                    border-radius: 3px;
                }
                
                .playlist-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 15px;
                    border: 2px solid #333;
                    page-break-inside: avoid; /* avoid splitting table across pages */
                    table-layout: fixed;
                    clear: both;
                }
                
                .playlist-table thead {
                    display: table-header-group;
                    background-color: #f0f0f0;
                    page-break-inside: avoid;
                    page-break-after: avoid;
                }
                
                .playlist-table tbody tr {
                    page-break-inside: avoid;
                    page-break-after: auto;
                }
                
                .playlist-table thead {
                    display: table-header-group;
                    background-color: #f0f0f0;
                    page-break-inside: avoid;
                    page-break-after: avoid;
                }
                
                .playlist-table thead th {
                    page-break-inside: avoid;
                    border-right: 1px solid #333;
                }
                
                .playlist-table thead th:last-child {
                    border-right: 2px solid #333;
                }
                
                /* Print optimization */
                @media print {
                    .playlist-table {
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                    
                    .page-break {
                        page-break-before: always;
                    }
                    
                    .page-header {
                        page-break-after: avoid;
                    }
                    
                    .playlist-table thead {
                        display: table-header-group;
                        page-break-inside: avoid;
                        page-break-after: avoid;
                    }
                    
                    .playlist-table tbody tr {
                        page-break-inside: avoid;
                        page-break-after: auto;
                    }
                }
                
                .playlist-table th,
                .playlist-table td {
                    border-bottom: 1px solid #333;
                    border-right: 1px solid #333;
                    padding: 6px;
                    text-align: left;
                    vertical-align: top;
                    font-size: 9pt;
                    font-weight: bold;
                    font-style: normal;
                    word-wrap: break-word;
                    overflow-wrap: break-word;
                }
                
                .playlist-table td:last-child,
                .playlist-table th:last-child {
                    border-right: 2px solid #333;
                }
                
                .playlist-table tbody tr:last-child td {
                    border-bottom: 2px solid #333;
                }
                
                .playlist-table th {
                    background-color: #f0f0f0;
                    font-weight: bold;
                    text-align: center;
                    padding: 8px 6px;
                    font-size: 12pt;
                    page-break-after: avoid;
                }
                
                .playlist-table tr {
                    page-break-inside: avoid;
                }
                
                .playlist-table td.number {
                    text-align: center;
                    width: 10% !important;
                    max-width: 10% !important;
                    min-width: 10% !important;
                }
                
                .playlist-table td.song-title {
                    width: 30% !important;
                    max-width: 30% !important;
                    min-width: 30% !important;
                }
                
                .playlist-table td.song-number {
                    width: 15% !important;
                    max-width: 15% !important;
                    min-width: 15% !important;
                    text-align: center;
                }
                
                .playlist-table td.raga {
                    width: 20% !important;
                    max-width: 20% !important;
                    min-width: 20% !important;
                }
                
                .playlist-table td.album {
                    width: 30% !important;
                    max-width: 30% !important;
                    min-width: 30% !important;
                }
                
                .playlist-table td.alankaaram {
                    width: 5% !important;
                    max-width: 5% !important;
                    min-width: 5% !important;
                    text-align: center;
                    font-weight: bold;
                }
                
                /* Header column widths to match table data */
                .playlist-table th:nth-child(1) { width: 10%; }
                .playlist-table th:nth-child(2) { width: 30%; }
                .playlist-table th:nth-child(3) { width: 15%; }
                .playlist-table th:nth-child(4) { width: 20%; }
                .playlist-table th:nth-child(5) { width: 30%; }
                .playlist-table th:nth-child(6) { width: 5%; }
                

                
                @media print {
                    .playlist-table thead {
                        display: table-header-group;
                    }
                    
                    .bhajan-header {
                        page-break-before: avoid;
                        page-break-after: avoid;
                    }
                    
                    .repeating-header {
                        position: running(pageHeader);
                    }
                    
                    .playlist-table tbody tr {
                        page-break-inside: avoid;
                    }
                    
                    .header-section {
                        page-break-inside: avoid;
                    }
                }

            </style>
        </head>
        <body>
            ${pageChunks.map((chunk, pageIndex) => {
                // Numbering offset: first page starts at 0, second page continues after firstPageSongs
                const startIndex = pageIndex === 0 ? 0 : firstPageSongs;
                const pageBreakClass = pageIndex > 0 ? 'page-break' : '';
                
                return `
                <div class="${pageBreakClass}">
                    ${pageIndex === 0 ? headerSection : ''}
                    
                    <table class="playlist-table">
                        <thead>
                            <tr>
                                <th>&nbsp;</th>
                                <th>Song Title</th>
                                <th>Song No.</th>
                                <th>Raagam</th>
                                <th>Album</th>
                                <th>A</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${chunk.map((song, chunkIndex) => {
                                const globalIndex = startIndex + chunkIndex;
                                const hasAlankaaram = alankaaramData[globalIndex] && alankaaramData[globalIndex].enabled;
                                const alankaaramDisplay = hasAlankaaram ? `✓` : '';
                                
                                return `
                                <tr>
                                    <td class="number">${globalIndex + 1}</td>
                                    <td class="song-title">${song.title || ''}</td>
                                    <td class="song-number">${song.songNumber || ''}</td>
                                    <td class="raga">${song.raga || ''}</td>
                                    <td class="album">${song.album || ''}</td>
                                    <td class="alankaaram">${alankaaramDisplay}</td>
                                </tr>`;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
                `;
            }).join('')}

        </body>
        </html>
        `;



        // Generate PDF using Puppeteer
        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        const page = await browser.newPage();
        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
        
        const pdfBuffer = await page.pdf({
            format: 'A4',
            orientation: 'portrait',
            margin: {
                top: '0.7in',
                right: '0.5in',
                bottom: '0.5in',
                left: '0.5in'
            },
            printBackground: true,
            preferCSSPageSize: false
        });
        
        await browser.close();

        // Set response headers for PDF download
        const filename = `thirupugazh-playlist-${now.toISOString().split('T')[0]}.pdf`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Length', pdfBuffer.length);
        
        // Send PDF buffer as binary data
        res.end(pdfBuffer, 'binary');

    } catch (error) {
        console.error('PDF endpoint error:', error);
        res.status(500).json({ error: 'Failed to generate PDF' });
    }
});

// Enhanced song search endpoint
app.get('/api/search-songs', async (req, res) => {
    try {
        const { query, albumFilter } = req.query;
        const minScore = parseInt(req.query.minScore) || 30;
        const maxResults = parseInt(req.query.maxResults) || 10;

        if (!query) {
            return res.status(400).json({ error: 'Search query is required' });
        }

        const results = searchSongs(query, { albumFilter, minScore, maxResults });
        res.json(results);
    } catch (error) {
        console.error('Error searching songs:', error);
        res.status(500).json({ error: 'Failed to search songs' });
    }
});

// Get all albums endpoint
app.get('/api/albums', (req, res) => {
    const albums = [...new Set(songs.map(song => song.album))].filter(album => album);
    res.json(albums);
});

// Get songs by album endpoint
app.get('/api/songs/:album', (req, res) => {
    const albumName = decodeURIComponent(req.params.album);
    const albumSongs = getSongsByAlbum(albumName);
    res.json(albumSongs);
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        songsLoaded: songs.length 
    });
});

// Test endpoint to check பொதுப் பாடல்கள் songs
app.get('/api/test-general-songs', (req, res) => {
    try {
        const generalSongs = getSongsByAlbum('பொதுப் பாடல்கள்');
        const sampleSongs = generalSongs.slice(0, 5).map(song => ({
            id: song.id,
            title: song.title,
            album: song.album
        }));
        
        res.json({
            totalGeneralSongs: generalSongs.length,
            sampleSongs: sampleSongs,
            totalSongsInDatabase: songs.length
        });
    } catch (error) {
        console.error('Error in test endpoint:', error);
        res.status(500).json({ error: 'Failed to fetch general songs' });
    }
});

// ============ PLAYLIST SAVE/LOAD ENDPOINTS ============

// Get current working playlist
app.get('/api/playlists/current', async (req, res) => {
    try {
        // Get current playlist
        const [playlists] = await db.execute(
            'SELECT * FROM saved_playlists WHERE is_current = TRUE LIMIT 1'
        );
        
        if (playlists.length === 0) {
            return res.json({ playlist: null });
        }
        
        const playlistId = playlists[0].id;
        
        // Get songs in order
        const [playlistSongs] = await db.execute(
            `SELECT ps.*, ps.song_id as id
             FROM playlist_songs ps
             WHERE ps.playlist_id = ?
             ORDER BY ps.position ASC`,
            [playlistId]
        );
        
        // Enrich with full song data
        const enrichedSongs = playlistSongs.map(ps => {
            const fullSong = songs.find(s => s.id === ps.song_id);
            return {
                ...fullSong
            };
        });
        
        // Build alankaaramData object from playlist_songs data
        const alankaaramData = {};
        playlistSongs.forEach(ps => {
            if (ps.alankaaram_enabled) {
                alankaaramData[ps.song_id] = {
                    enabled: ps.alankaaram_enabled === 1,
                    time: ps.alankaaram_time?.toString() || '5'
                };
            }
        });
        
        // Get header data
        const [headers] = await db.execute(
            'SELECT * FROM playlist_headers WHERE playlist_id = ?',
            [playlistId]
        );
        
        const headerData = headers.length > 0 ? {
            selectedPrarthanai: headers[0].prarthanai_text ? {
                id: headers[0].prarthanai_id,
                text: headers[0].prarthanai_text
            } : null,
            selectedFunction: headers[0].function_name ? {
                id: headers[0].function_id,
                name: headers[0].function_name
            } : null,
            selectedMember: headers[0].member_name ? {
                id: headers[0].member_id,
                name: headers[0].member_name,
                address: headers[0].member_address,
                phone: headers[0].member_phone
            } : null,
            bhajanDetails: {
                date: headers[0].bhajan_date,
                day: headers[0].bhajan_day,
                startTime: headers[0].bhajan_start_time,
                endTime: headers[0].bhajan_end_time
            }
        } : null;
        
        res.json({
            playlist: enrichedSongs,
            alankaaramData: alankaaramData,
            headerData: headerData,
            metadata: {
                playlistName: playlists[0].playlist_name,
                lastSaved: playlists[0].updated_at
            }
        });
    } catch (error) {
        console.error('Error loading current playlist:', error);
        res.status(500).json({ error: 'Failed to load playlist' });
    }
});

// Save/Update current working playlist
app.post('/api/playlists/save', async (req, res) => {
    try {
        const { playlist, headerData, alankaaramData } = req.body;
        
        if (!playlist || !Array.isArray(playlist)) {
            return res.status(400).json({ error: 'Invalid playlist data' });
        }
        
        // Start transaction
        await db.query('START TRANSACTION');
        
        try {
            // Check if current playlist exists
            const [existing] = await db.execute(
                'SELECT id FROM saved_playlists WHERE is_current = TRUE LIMIT 1'
            );
            
            let playlistId;
            
            if (existing.length > 0) {
                // Update existing
                playlistId = existing[0].id;
                await db.execute(
                    `UPDATE saved_playlists 
                     SET total_songs = ?, updated_at = CURRENT_TIMESTAMP 
                     WHERE id = ?`,
                    [playlist.length, playlistId]
                );
                
                // Delete old songs
                await db.execute('DELETE FROM playlist_songs WHERE playlist_id = ?', [playlistId]);
                await db.execute('DELETE FROM playlist_headers WHERE playlist_id = ?', [playlistId]);
            } else {
                // Create new
                const [result] = await db.execute(
                    `INSERT INTO saved_playlists (playlist_name, total_songs, is_current) 
                     VALUES (?, ?, TRUE)`,
                    ['Current Playlist', playlist.length]
                );
                playlistId = result.insertId;
            }
            
            // Insert songs
            for (let i = 0; i < playlist.length; i++) {
                const song = playlist[i];
                const alankaaramInfo = alankaaramData?.[song.id] || { enabled: false, time: 5 };
                
                await db.execute(
                    `INSERT INTO playlist_songs 
                     (playlist_id, song_id, position, alankaaram_enabled, alankaaram_time) 
                     VALUES (?, ?, ?, ?, ?)`,
                    [
                        playlistId,
                        song.id,
                        i + 1,
                        alankaaramInfo.enabled ? 1 : 0,
                        parseInt(alankaaramInfo.time) || 5
                    ]
                );
            }
            
            // Insert header data if provided
            if (headerData) {
                // Normalize phone number (could be array or string)
                let phoneValue = null;
                if (headerData.selectedMember?.phone) {
                    phoneValue = Array.isArray(headerData.selectedMember.phone) 
                        ? headerData.selectedMember.phone.join(', ') 
                        : headerData.selectedMember.phone;
                } else if (headerData.selectedMember?.phone_numbers) {
                    phoneValue = Array.isArray(headerData.selectedMember.phone_numbers)
                        ? headerData.selectedMember.phone_numbers.join(', ')
                        : headerData.selectedMember.phone_numbers;
                }
                
                await db.execute(
                    `INSERT INTO playlist_headers 
                     (playlist_id, prarthanai_id, prarthanai_text, function_id, function_name,
                      member_id, member_name, member_address, member_phone,
                      bhajan_date, bhajan_day, bhajan_start_time, bhajan_end_time)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        playlistId,
                        headerData.selectedPrarthanai?.id || null,
                        headerData.selectedPrarthanai?.text || null,
                        headerData.selectedFunction?.id || null,
                        headerData.selectedFunction?.name || null,
                        headerData.selectedMember?.id || null,
                        headerData.selectedMember?.name || null,
                        headerData.selectedMember?.address || null,
                        phoneValue,
                        headerData.bhajanDetails?.date || null,
                        headerData.bhajanDetails?.day || null,
                        headerData.bhajanDetails?.startTime || null,
                        headerData.bhajanDetails?.endTime || null
                    ]
                );
            }
            
            await db.query('COMMIT');
            
            res.json({ 
                success: true, 
                message: 'Playlist saved successfully',
                lastSaved: new Date().toISOString()
            });
        } catch (error) {
            await db.query('ROLLBACK');
            throw error;
        }
    } catch (error) {
        console.error('Error saving playlist:', error);
        res.status(500).json({ error: 'Failed to save playlist' });
    }
});

// Mark current playlist as complete and move to history
app.post('/api/playlists/mark-complete', async (req, res) => {
    try {
        // Get current playlist songs
        const [playlists] = await db.execute(
            'SELECT id FROM saved_playlists WHERE is_current = TRUE LIMIT 1'
        );
        
        if (playlists.length === 0) {
            return res.json({ success: true, message: 'No current playlist to complete' });
        }
        
        const playlistId = playlists[0].id;
        
        // Get all songs from current playlist
        const [playlistSongs] = await db.execute(
            'SELECT song_id FROM playlist_songs WHERE playlist_id = ?',
            [playlistId]
        );
        
        // Start transaction
        await db.query('START TRANSACTION');
        
        try {
            // Add songs to history
            for (const song of playlistSongs) {
                await db.execute(
                    'INSERT INTO playlist_history (song_id) VALUES (?)',
                    [song.song_id]
                );
            }
            
            // Keep only last 6 playlists worth of history
            // (Delete songs older than the 6th most recent playlist)
            await db.execute(`
                DELETE FROM playlist_history 
                WHERE created_at < (
                    SELECT created_at FROM (
                        SELECT DISTINCT created_at 
                        FROM playlist_history 
                        ORDER BY created_at DESC 
                        LIMIT 1 OFFSET 5
                    ) AS sixth_playlist
                )
            `);
            
            // Mark current playlist as not current (archive it)
            await db.execute(
                'UPDATE saved_playlists SET is_current = FALSE WHERE id = ?',
                [playlistId]
            );
            
            await db.query('COMMIT');
            
            res.json({ 
                success: true, 
                message: 'Playlist marked as complete and moved to history' 
            });
        } catch (error) {
            await db.query('ROLLBACK');
            throw error;
        }
    } catch (error) {
        console.error('Error completing playlist:', error);
        res.status(500).json({ error: 'Failed to complete playlist' });
    }
});

// ============================================================================
// Update Song in songs.js file
// ============================================================================
app.post('/api/songs/update', async (req, res) => {
    try {
        const updatedSong = req.body;
        
        // Validate required fields
        if (!updatedSong.id || !updatedSong.title) {
            return res.status(400).json({ error: 'Song ID and title are required' });
        }
        
        console.log(`Updating song ID ${updatedSong.id}: ${updatedSong.title}`);
        
        // Read the current songs.js file
        const songsFilePath = path.join(__dirname, 'songs.js');
        let fileContent = await fs.readFile(songsFilePath, 'utf-8');
        
        // Find the song in the in-memory array
        const songIndex = songs.findIndex(s => s.id === updatedSong.id);
        if (songIndex === -1) {
            return res.status(404).json({ error: 'Song not found' });
        }
        
        // Update the in-memory song
        songs[songIndex] = {
            id: updatedSong.id,
            title: updatedSong.title,
            songNumber: updatedSong.songNumber || '',
            duration: updatedSong.duration || '',
            raga: updatedSong.raga || '',
            album: updatedSong.album || '',
            notes: updatedSong.notes || '',
            taught: updatedSong.taught || 'Yes'
        };
        
        // Create the new songs array content
        const songsArrayString = JSON.stringify(songs, null, 2);
        
        // Build the complete file content with module exports
        const newFileContent = `const songs = ${songsArrayString};

// Export for use in the application
if (typeof window !== 'undefined') {
  window.songDatabase = songs;
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = songs;
}
`;
        
        // Write the updated content back to songs.js
        await fs.writeFile(songsFilePath, newFileContent, 'utf-8');
        
        console.log(`Successfully updated song ID ${updatedSong.id} in songs.js`);
        
        res.json({ 
            success: true, 
            message: 'Song updated successfully',
            song: songs[songIndex]
        });
        
    } catch (error) {
        console.error('Error updating song:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({ 
            error: 'Failed to update song',
            details: error.message 
        });
    }
});

// ============================================================================
// Delete Song from songs.js file
// ============================================================================
app.post('/api/songs/delete', async (req, res) => {
    try {
        const { id } = req.body;
        
        // Validate required field
        if (!id) {
            return res.status(400).json({ error: 'Song ID is required' });
        }
        
        console.log(`Deleting song ID ${id}`);
        
        // Find the song in the in-memory array
        const songIndex = songs.findIndex(s => s.id === id);
        if (songIndex === -1) {
            return res.status(404).json({ error: 'Song not found' });
        }
        
        // Remove from the in-memory array
        const deletedSong = songs.splice(songIndex, 1)[0];
        
        // Create the new songs array content
        const songsArrayString = JSON.stringify(songs, null, 2);
        
        // Build the complete file content with module exports
        const newFileContent = `const songs = ${songsArrayString};

// Export for use in the application
if (typeof window !== 'undefined') {
  window.songDatabase = songs;
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = songs;
}
`;
        
        // Write the updated content back to songs.js
        const songsFilePath = path.join(__dirname, 'songs.js');
        await fs.writeFile(songsFilePath, newFileContent, 'utf-8');
        
        console.log(`Successfully deleted song ID ${id} from songs.js`);
        
        res.json({ 
            success: true, 
            message: 'Song deleted successfully',
            deletedSong: deletedSong
        });
        
    } catch (error) {
        console.error('Error deleting song:', error);
        res.status(500).json({ 
            error: 'Failed to delete song',
            details: error.message 
        });
    }
});

// ============================================================================
// Create Member in members.js file
// ============================================================================
app.post('/api/members/create', async (req, res) => {
    try {
        const newMember = req.body;
        
        // Validate required fields
        if (!newMember.name) {
            return res.status(400).json({ error: 'Member name is required' });
        }
        
        console.log(`Creating new member: ${newMember.name}`);
        
        // Read the current members.js file
        const membersFilePath = path.join(__dirname, 'members.js');
        let fileContent = await fs.readFile(membersFilePath, 'utf-8');
        
        // Load the current members data
        const membersData = require('./members.js');
        const members = membersData.members;
        
        // Generate new ID (max existing ID + 1)
        const maxId = members.reduce((max, m) => Math.max(max, m.id || 0), 0);
        const newId = maxId + 1;
        
        // Create the new member object
        const memberToAdd = {
            id: newId,
            name: newMember.name,
            phone_numbers: Array.isArray(newMember.phone_numbers) ? newMember.phone_numbers : [],
            address: newMember.address || ''
        };
        
        // Add to the beginning of the array
        members.unshift(memberToAdd);
        
        // Create the new members array content
        const membersArrayString = JSON.stringify(members, null, 2);
        
        // Build the complete file content
        const newFileContent = `const membersData = {
  members: ${membersArrayString}
};

// Export for use in the application
if (typeof window !== 'undefined') {
  window.membersData = membersData;
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = membersData;
}
`;
        
        // Write the updated content back to members.js
        await fs.writeFile(membersFilePath, newFileContent, 'utf-8');
        
        console.log(`Successfully created member ID ${newId} in members.js`);
        
        // Clear the require cache to reload the updated file
        delete require.cache[require.resolve('./members.js')];
        
        res.json({ 
            success: true, 
            message: 'Member created successfully',
            member: memberToAdd
        });
        
    } catch (error) {
        console.error('Error creating member:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({ 
            error: 'Failed to create member',
            details: error.message 
        });
    }
});

// ============================================================================
// Update Member in members.js file
// ============================================================================
app.post('/api/members/update', async (req, res) => {
    try {
        const updatedMember = req.body;
        
        // Validate required fields
        if (!updatedMember.id || !updatedMember.name) {
            return res.status(400).json({ error: 'Member ID and name are required' });
        }
        
        console.log(`Updating member ID ${updatedMember.id}: ${updatedMember.name}`);
        
        // Read the current members.js file
        const membersFilePath = path.join(__dirname, 'members.js');
        let fileContent = await fs.readFile(membersFilePath, 'utf-8');
        
        // Load the current members data
        const membersData = require('./members.js');
        const members = membersData.members;
        
        // Find the member in the array
        const memberIndex = members.findIndex(m => m.id === updatedMember.id);
        if (memberIndex === -1) {
            return res.status(404).json({ error: 'Member not found' });
        }
        
        // Update the member
        members[memberIndex] = {
            id: updatedMember.id,
            name: updatedMember.name,
            phone_numbers: Array.isArray(updatedMember.phone_numbers) ? updatedMember.phone_numbers : [],
            address: updatedMember.address || ''
        };
        
        // Create the new members array content
        const membersArrayString = JSON.stringify(members, null, 2);
        
        // Build the complete file content
        const newFileContent = `const membersData = {
  members: ${membersArrayString}
};

// Export for use in the application
if (typeof window !== 'undefined') {
  window.membersData = membersData;
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = membersData;
}
`;
        
        // Write the updated content back to members.js
        await fs.writeFile(membersFilePath, newFileContent, 'utf-8');
        
        console.log(`Successfully updated member ID ${updatedMember.id} in members.js`);
        
        // Clear the require cache to reload the updated file
        delete require.cache[require.resolve('./members.js')];
        
        res.json({ 
            success: true, 
            message: 'Member updated successfully',
            member: members[memberIndex]
        });
        
    } catch (error) {
        console.error('Error updating member:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({ 
            error: 'Failed to update member',
            details: error.message 
        });
    }
});

// ============================================================================
// Delete Member from members.js file
// ============================================================================
app.post('/api/members/delete', async (req, res) => {
    try {
        const { id } = req.body;
        
        // Validate required field
        if (!id) {
            return res.status(400).json({ error: 'Member ID is required' });
        }
        
        console.log(`Deleting member ID ${id}`);
        
        // Read the current members.js file
        const membersFilePath = path.join(__dirname, 'members.js');
        let fileContent = await fs.readFile(membersFilePath, 'utf-8');
        
        // Load the current members data
        const membersData = require('./members.js');
        const members = membersData.members;
        
        // Find the member in the array
        const memberIndex = members.findIndex(m => m.id === id);
        if (memberIndex === -1) {
            return res.status(404).json({ error: 'Member not found' });
        }
        
        // Remove from the array
        const deletedMember = members.splice(memberIndex, 1)[0];
        
        // Create the new members array content
        const membersArrayString = JSON.stringify(members, null, 2);
        
        // Build the complete file content
        const newFileContent = `const membersData = {
  members: ${membersArrayString}
};

// Export for use in the application
if (typeof window !== 'undefined') {
  window.membersData = membersData;
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = membersData;
}
`;
        
        // Write the updated content back to members.js
        await fs.writeFile(membersFilePath, newFileContent, 'utf-8');
        
        console.log(`Successfully deleted member ID ${id} from members.js`);
        
        // Clear the require cache to reload the updated file
        delete require.cache[require.resolve('./members.js')];
        
        res.json({ 
            success: true, 
            message: 'Member deleted successfully',
            deletedMember: deletedMember
        });
        
    } catch (error) {
        console.error('Error deleting member:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({ 
            error: 'Failed to delete member',
            details: error.message 
        });
    }
});

// Serve the frontend
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
async function startServer() {
    await initializeDatabase();
    
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        console.log(`Application available at http://localhost:${PORT}`);
        console.log('\nPlease ensure you have set up the following environment variables:');
        console.log('- DB_HOST, DB_USERNAME, DB_PASSWORD, DB_NAME (MySQL database)');
        console.log('- LLM_API_KEY (for AI chatbot functionality)');
    });
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    console.error('Stack:', error.stack);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

startServer().catch(console.error); 