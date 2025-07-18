const songs = require('./songs.js');

console.log('=== DEBUGGING பொதுப் பாடல்கள் ISSUE ===');
console.log('Total songs:', songs.length);

// Get all unique album names
const albums = [...new Set(songs.map(s => s.album))].filter(a => a);
console.log('Total unique albums:', albums.length);

// Look for albums containing Tamil characters or 'paadal'
console.log('\n=== Albums with Tamil or "paadal" text ===');
albums.forEach((album, i) => {
    if (album.includes('பொ') || album.includes('paadal') || album.includes('general')) {
        console.log(`${i}: "${album}" (length: ${album.length})`);
        // Show character codes
        console.log('Character codes:', album.split('').map(c => c.charCodeAt(0)).join(', '));
    }
});

// Direct search for songs with general/common patterns
console.log('\n=== Direct song search ===');
const generalPatterns = ['பொதுப்', 'paadal', 'general', 'common'];
generalPatterns.forEach(pattern => {
    const matches = songs.filter(s => s.album && s.album.includes(pattern));
    console.log(`Pattern "${pattern}": ${matches.length} songs found`);
    if (matches.length > 0) {
        console.log(`  First match: "${matches[0].title}" from "${matches[0].album}"`);
    }
});

// Check for songs around ID 348-350 where we saw பொதுப் பாடல்கள் in the grep results
console.log('\n=== Songs around ID 348-350 ===');
const targetSongs = songs.filter(s => s.id >= 348 && s.id <= 352);
targetSongs.forEach(song => {
    console.log(`ID ${song.id}: "${song.title}" from "${song.album}"`);
}); 