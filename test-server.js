const songs = require('./songs.js');

// Copy the exact normalizeAlbumName function from server.js
function normalizeAlbumName(albumName) {
    if (!albumName) return '';
    
    const albumMappings = {
        // General songs variations
        'podhu paadalgal': 'பொதுப் பாடல்கள்',
        'general songs': 'பொதுப் பாடல்கள்',
        'podhu': 'பொதுப் பாடல்கள்',
        // ... other mappings
    };
    
    // Normalize to lowercase for mapping lookup
    const normalized = albumName.toLowerCase().trim().replace(/\s+/g, ' ');
    
    // Check for exact mappings first
    if (albumMappings[normalized]) {
        return albumMappings[normalized];
    }
    
    // Check for partial matches
    for (const [key, value] of Object.entries(albumMappings)) {
        if (normalized.includes(key) || key.includes(normalized)) {
            return value;
        }
    }
    
    return albumName;
}

// Copy the exact getSongsByAlbum function from server.js
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

console.log('=== TESTING SERVER FUNCTIONS ===');

// Test the exact same call the server makes
console.log('\n1. Testing getSongsByAlbum with Tamil text:');
const result1 = getSongsByAlbum('பொதுப் பாடல்கள்');
console.log('Result count:', result1.length);

console.log('\n2. Testing with English mapping:');
const result2 = getSongsByAlbum('general songs');
console.log('Result count:', result2.length);

console.log('\n3. Testing normalizeAlbumName directly:');
console.log('Input: "பொதுப் பாடல்கள்"');
console.log('Output:', normalizeAlbumName('பொதுப் பாடல்கள்'));
console.log('Input: "general songs"');
console.log('Output:', normalizeAlbumName('general songs'));

console.log('\n4. Direct comparison test:');
const testAlbum = 'பொதுப் பாடல்கள்';
const matchingSongs = songs.filter(song => {
    const match = song.album === testAlbum;
    if (match) console.log(`Match found: ${song.title}`);
    return match;
});
console.log('Direct filter result:', matchingSongs.length); 