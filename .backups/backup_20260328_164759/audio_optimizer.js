// audio_optimizer.js
// Converts MP3 to OGG for better compression
// Run: node audio_optimizer.js

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ASSETS_DIR = 'assets';
const FFMPEG = 'ffmpeg_temp/ffmpeg-master-latest-win64-gpl/bin/ffmpeg.exe';

console.log('🎵 Audio Optimizer - Converting MP3 to OGG\n');

function convertToOGG(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    if (ext !== '.mp3') return;

    const oggPath = filePath.replace(/\.mp3$/i, '.ogg');
    
    // Skip if OGG already exists and is newer
    if (fs.existsSync(oggPath)) {
        const mp3Stat = fs.statSync(filePath);
        const oggStat = fs.statSync(oggPath);
        if (oggStat.mtime >= mp3Stat.mtime) {
            console.log(`  SKIP: ${path.basename(filePath)} (OGG up to date)`);
            return;
        }
    }

    try {
        // Use ffmpeg to convert to OGG with good quality
        const cmd = `"${FFMPEG}" -i "${filePath}" -acodec libvorbis -q:a 4 "${oggPath}" -y -loglevel error`;
        execSync(cmd, { stdio: 'pipe' });

        const origSize = fs.statSync(filePath).size;
        const newSize = fs.statSync(oggPath).size;
        const savings = ((origSize - newSize) / origSize * 100).toFixed(1);

        console.log(`  CONVERT: ${path.basename(filePath)} -> ${path.basename(oggPath)} (${savings}% smaller)`);
    } catch (err) {
        console.log(`  ERROR: ${path.basename(filePath)}: ${err.message}`);
    }
}

function processDir(dir) {
    if (!fs.existsSync(dir)) return;

    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
            processDir(fullPath);
        } else if (entry.name.toLowerCase().endsWith('.mp3')) {
            convertToOGG(fullPath);
        }
    }
}

console.log('📁 Processing audio files...\n');
processDir(ASSETS_DIR);
console.log('\n✅ Audio conversion complete!');
console.log('\n📝 Update AssetLoader to prefer .ogg files');
