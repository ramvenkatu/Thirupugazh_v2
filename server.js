const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const path = require('path');
const axios = require('axios');
const pdf = require('html-pdf');

require('dotenv').config();

// Import songs data
const songs = require('./songs.js');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000'
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
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
        const [rows] = await db.execute(
            'SELECT DISTINCT song_id FROM playlist_history WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)',
            [daysBack]
        );
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

// Save playlist to history
async function savePlaylistToHistory(playlist) {
    try {
        for (const song of playlist) {
            await db.execute(
                'INSERT INTO playlist_history (song_id) VALUES (?)',
                [song.id]
            );
        }
        console.log('Playlist saved to history');
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

    // Step 5: The Five Abodes (5 Songs)
    console.log('\n--- Step 5: The Five Abodes ---');
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
        if (abodeSongs.length > 0) {
            const song = selectRandomSong(abodeSongs, recentlyUsed);
            playlist.push(song);
            totalDuration += durationToSeconds(song.duration);
            console.log('Added:', song.title, 'from', song.album);
        }
    }

    // Step 6: பொதுப் பாடல்கள் (ALL Required - Including Fillers)
    console.log('\n--- Step 6: பொதுப் பாடல்கள் (ALL Songs) ---');
    const generalSongs = getSongsByAlbum('பொதுப் பாடல்கள்');
    console.log('Available பொதுப் பாடல்கள் songs:', generalSongs.length);
    
    if (generalSongs.length === 0) {
        console.error('ERROR: No பொதுப் பாடல்கள் songs found in database!');
    } else {
        // Estimate remaining time for Steps 7-16 (approximately 10-15 minutes based on typical patterns)
        const estimatedRemainingStepsDuration = 12 * 60; // 12 minutes estimate
        const desiredDurationSeconds = desiredDurationMinutes * 60;
        const timeAvailableForGeneral = desiredDurationSeconds - totalDuration - estimatedRemainingStepsDuration;
        
        console.log(`Estimated remaining steps duration: ${Math.round(estimatedRemainingStepsDuration/60)} minutes`);
        console.log(`Time available for பொதுப் பாடல்கள்: ${Math.round(timeAvailableForGeneral/60)} minutes`);
        
        // Calculate how many பொதுப் பாடல்கள் songs needed (minimum 3, but fill available time)
        const avgSongDuration = 3.5 * 60; // Average 3.5 minutes per song
        const targetGeneralSongsCount = Math.max(3, Math.floor(timeAvailableForGeneral / avgSongDuration));
        
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
                // Check if adding this song would exceed available time (with 2-minute buffer)
                if (generalSongsDuration + songDuration <= timeAvailableForGeneral + 120) {
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

    // Step 8: பழமுதிர் சோலை (Minimum 1 Song)
    console.log('\n--- Step 8: பழமுதிர் சோலை ---');
    const pazhamuthirSongs = getSongsByAlbum('பழமுதிர் சோலை');
    console.log('Available பழமுதிர் சோலை songs:', pazhamuthirSongs.length);
    if (pazhamuthirSongs.length > 0) {
        const song = selectRandomSong(pazhamuthirSongs, recentlyUsed);
        playlist.push(song);
        totalDuration += durationToSeconds(song.duration);
        console.log('Added:', song.title, 'from', song.album);
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
    const desiredDurationSeconds = desiredDurationMinutes * 60;
    const finalDuration = Math.round(totalDuration / 60);
    const targetDuration = Math.round(desiredDurationSeconds / 60);
    console.log(`Final playlist duration: ${finalDuration} minutes (target: ${targetDuration} minutes)`);
    
    if (Math.abs(finalDuration - targetDuration) > 3) {
        console.log(`Note: Playlist duration differs from target by ${Math.abs(finalDuration - targetDuration)} minutes`);
        console.log('This is expected since all பொதுப் பாடல்கள் are now placed at Step 6 before பஞ்சபூதம் songs');
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
        const { duration } = req.body;
        
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
            totalDuration: playlist.reduce((sum, song) => sum + durationToSeconds(song.duration), 0),
            requestedDuration: duration * 60
        });
    } catch (error) {
        console.error('Error generating playlist:', error);
        res.status(500).json({ error: 'Failed to generate playlist' });
    }
});

// LLM proxy endpoint for AI chatbot
app.post('/api/llm-chat', async (req, res) => {
    try {
        const { message, playlist } = req.body;
        
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
        
        HANDLING SPECIFIC SONG REQUESTS:
        When users ask for specific songs by title (e.g., "add song oruvarai oruvar"), use the search command to find the exact song.
        
        RESPONSE FORMAT: Provide a brief user-friendly explanation followed by the JSON command(s).
        
        EXAMPLES:
        User: "Add more songs from podhu paadalgal"
        Response: "I'll add more general songs to your playlist. {"action": "add", "albumName": "பொதுப் பாடல்கள்"}"
        
        User: "Add song oruvarai oruvar from pazhani"
        Response: "I'll search for the song 'oruvarai oruvar' from திருப்பழனி. {"action": "search_and_add", "songTitle": "oruvarai oruvar", "albumHint": "திருப்பழனி"}"
        
        User: "Remove the first song"
        Response: "I'll remove the first song from your playlist. {"action": "remove", "position": 1}"
        
        User: "Replace the first song with one from pazhani"
        Response: "I'll replace the first song with one from திருப்பழனி. Note that the new song will be positioned according to the 16-step sequence, not at position 1. {"action": "replace", "position": 1, "newAlbumName": "திருப்பழனி"}"
        
        Available commands:
        - {"action": "remove", "songId": number} - Remove a song by its ID
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
        res.status(500).json({ 
            error: 'Failed to process LLM request',
            details: error.response?.data?.error?.message || error.message
        });
    }
});

// Server-side PDF generation endpoint
app.post('/api/generate-pdf', (req, res) => {
    try {
        const { playlist, alankaaramData = {} } = req.body;
        
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

        const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Thirupugazh Playlist</title>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Tamil:wght@400;700&display=swap');
                
                body {
                    font-family: 'Noto Sans Tamil', 'Arial Unicode MS', Arial, sans-serif;
                    font-size: 14px;
                    line-height: 1.5;
                    margin: 20px;
                    color: #333;
                }
                
                .header {
                    text-align: center;
                    margin-bottom: 20px;
                    border-bottom: 2px solid #333;
                    padding-bottom: 12px;
                }
                
                .title {
                    font-size: 24px;
                    font-weight: bold;
                    margin-bottom: 10px;
                }
                
                .info {
                    font-size: 14px;
                    margin: 4px 0;
                }
                
                .playlist-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 15px;
                }
                
                .playlist-table th,
                .playlist-table td {
                    border: 1px solid #333;
                    padding: 8px;
                    text-align: left;
                    vertical-align: top;
                    font-size: 12px;
                }
                
                .playlist-table th {
                    background-color: #f0f0f0;
                    font-weight: bold;
                    text-align: center;
                    padding: 10px 8px;
                    font-size: 13px;
                }
                
                .playlist-table td.number {
                    text-align: center;
                    width: 4%;
                }
                
                .playlist-table td.song-title {
                    width: 32%;
                }
                
                .playlist-table td.song-number {
                    width: 14%;
                    text-align: center;
                }
                
                .playlist-table td.raga {
                    width: 18%;
                }
                
                .playlist-table td.album {
                    width: 20%;
                }
                
                .playlist-table td.alankaaram {
                    width: 12%;
                    text-align: center;
                    font-weight: bold;
                }
                
                .footer {
                    margin-top: 25px;
                    text-align: center;
                    font-size: 12px;
                    border-top: 1px solid #333;
                    padding-top: 10px;
                }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="title">Thirupugazh Playlist</div>
                <div class="info">Generated on: ${now.toLocaleDateString('en-IN')} ${now.toLocaleTimeString('en-IN')}</div>
            </div>
            
            <table class="playlist-table">
                <thead>
                    <tr>
                        <th>Sl.No</th>
                        <th>Song Title</th>
                        <th>Song Number 8th Ed</th>
                        <th>Raagam</th>
                        <th>Album</th>
                        <th>Alankaaram</th>
                    </tr>
                </thead>
                <tbody>
                    ${playlist.map((song, index) => {
                        const hasAlankaaram = alankaaramData[index] && alankaaramData[index].enabled;
                        const alankaaramMinutes = hasAlankaaram ? alankaaramData[index].minutes || 4 : '';
                        const alankaaramDisplay = hasAlankaaram ? `✓ ${alankaaramMinutes}min` : '';
                        
                        return `
                        <tr>
                            <td class="number">${index + 1}</td>
                            <td class="song-title">${song.title || ''}</td>
                            <td class="song-number">${song.songNumber || ''}</td>
                            <td class="raga">${song.raga || ''}</td>
                            <td class="album">${song.album || ''}</td>
                            <td class="alankaaram">${alankaaramDisplay}</td>
                        </tr>`;
                    }).join('')}
                </tbody>
            </table>
            
            <div class="footer">
                Thirupugazh Song List Generator v2.8 | Following the traditional 16-step sequence | Enhanced with Alankaaram support
            </div>
        </body>
        </html>
        `;

        // PDF generation options - landscape orientation for better readability
        const options = {
            format: 'A4',
            orientation: 'landscape',
            border: {
                top: '0.5in',
                right: '0.5in',
                bottom: '0.5in',
                left: '0.5in'
            },
            type: 'pdf',
            quality: '100',
            renderDelay: 300,
            zoomFactor: 1.0,
            height: '8.3in',
            width: '11.7in'
        };

        // Generate PDF
        pdf.create(htmlContent, options).toBuffer((err, buffer) => {
            if (err) {
                console.error('PDF generation error:', err);
                return res.status(500).json({ error: 'Failed to generate PDF' });
            }

            // Set response headers for PDF download
            const filename = `thirupugazh-playlist-${now.toISOString().split('T')[0]}.pdf`;
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            res.setHeader('Content-Length', buffer.length);
            
            // Send PDF buffer
            res.send(buffer);
        });

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

startServer().catch(console.error); 