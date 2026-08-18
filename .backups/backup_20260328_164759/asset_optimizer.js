// asset_optimizer.js
// Converts PNG assets to WebP for better performance
// Run: node asset_optimizer.js

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ASSETS_DIR = 'assets';
const QUALITY = 80;

const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg'];

async function convertToWebP(dir) {
    if (!fs.existsSync(dir)) return;

    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
            await convertToWebP(fullPath);
        } else {
            const ext = path.extname(entry.name).toLowerCase();
            if (IMAGE_EXTENSIONS.includes(ext)) {
                const webpPath = fullPath.replace(new RegExp(`${ext}$`, 'i'), '.webp');

                if (fs.existsSync(webpPath)) {
                    const origStat = fs.statSync(fullPath);
                    const webpStat = fs.statSync(webpPath);
                    if (webpStat.mtime >= origStat.mtime) continue;
                }

                try {
                    await sharp(fullPath).webp({ quality: QUALITY }).toFile(webpPath);

                    const origSize = fs.statSync(fullPath).size;
                    const newSize = fs.statSync(webpPath).size;
                    const savings = ((origSize - newSize) / origSize * 100).toFixed(1);

                    console.log(`  ${ext.toUpperCase()}->WebP: ${entry.name} (${savings}% smaller)`);
                } catch (err) {
                    console.error(`  ERROR: ${entry.name}: ${err.message}`);
                }
            }
        }
    }
}

async function main() {
    console.log('🗜️  Asset Optimizer - Converting all images to WebP\n');
    console.log(`Quality: ${QUALITY}%`);
    console.log(`Formats: PNG, JPG, JPEG -> WebP\n`);

    if (!fs.existsSync(ASSETS_DIR)) {
        console.error('❌ Assets directory not found!');
        process.exit(1);
    }

    console.log('📁 Processing...\n');
    await convertToWebP(ASSETS_DIR);
    console.log('\n✅ All images converted to WebP!');
}

main().catch(console.error);
