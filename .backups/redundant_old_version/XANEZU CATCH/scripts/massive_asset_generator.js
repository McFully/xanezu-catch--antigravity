const fs = require('fs');
const path = require('path');

const ASSETS_DIR = path.join(__dirname, '../assets');
const CHAPTERS_TOTAL = 88;

// SVG Templates & Generators
const generators = {
    nature: (colors) => `
        <svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
            <path d="M10,90 Q50,10 90,90" fill="${colors[0]}" opacity="0.6" />
            <circle cx="50" cy="30" r="${5 + Math.random() * 10}" fill="${colors[1]}" />
            <path d="M30,70 L50,40 L70,70" fill="${colors[0]}" />
        </svg>`,
    scifi: (colors) => `
        <svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
            <rect x="10" y="10" width="80" height="80" fill="none" stroke="${colors[1]}" stroke-width="2" />
            <rect x="20" y="20" width="60" height="60" fill="${colors[0]}" opacity="0.3" />
            <line x1="0" y1="50" x2="100" y2="50" stroke="${colors[1]}" opacity="0.5" />
            <circle cx="50" cy="50" r="10" fill="${colors[1]}" />
        </svg>`,
    tech: (colors) => `
        <svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
            <path d="M10,10 L90,10 L90,90 L10,90 Z" fill="none" stroke="${colors[0]}" stroke-width="1" />
            <circle cx="20" cy="20" r="5" fill="${colors[1]}" />
            <circle cx="80" cy="80" r="5" fill="${colors[1]}" />
            <path d="M30,30 L70,70 M70,30 L30,70" stroke="${colors[0]}" stroke-width="2" />
        </svg>`,
    magic: (colors) => `
        <svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <radialGradient id="grad${Math.random()}">
                    <stop offset="0%" stop-color="${colors[0]}" />
                    <stop offset="100%" stop-color="transparent" />
                </radialGradient>
            </defs>
            <circle cx="50" cy="50" r="40" fill="url(#grad${Math.random()})" />
            <polygon points="50,10 60,40 90,50 60,60 50,90 40,60 10,50 40,40" fill="${colors[1]}" />
        </svg>`
};

const themes = [
    { name: 'nature', types: ['leaf', 'rock', 'bush', 'flower', 'cloud'] },
    { name: 'scifi', types: ['panel', 'wire', 'drone', 'shutter', 'beam'] },
    { name: 'tech', types: ['gear', 'chip', 'bolt', 'pipe', 'sensor'] },
    { name: 'magic', types: ['crystal', 'spark', 'rune', 'orb', 'wisp'] }
];

async function generate() {
    console.log("🚀 Starting Massive Asset Generation...");

    if (!fs.existsSync(ASSETS_DIR)) fs.mkdirSync(ASSETS_DIR, { recursive: true });

    let count = 0;

    for (let ch = 1; ch <= CHAPTERS_TOTAL; ch++) {
        const chDir = path.join(ASSETS_DIR, `ch${ch}`);
        if (!fs.existsSync(chDir)) fs.mkdirSync(chDir, { recursive: true });

        // Generate a color palette for this chapter
        const baseHue = (ch * 137.5) % 360;
        const colors = [
            `hsl(${baseHue}, 70%, 40%)`,
            `hsl(${(baseHue + 40) % 360}, 80%, 60%)`
        ];

        const theme = themes[ch % themes.length];

        // Create 12 unique assets for each chapter (Decoration, Obstacles, Parallax)
        // 12 * 88 = 1056 assets
        for (let i = 1; i <= 12; i++) {
            const type = theme.types[i % theme.types.length];
            const fileName = `${type}_${i}.svg`;
            const svg = generators[theme.name](colors);

            fs.writeFileSync(path.join(chDir, fileName), svg);
            count++;
        }
    }

    console.log(`✅ Success! Generated ${count} assets in /assets/ch1 to /assets/ch88`);
}

generate().catch(console.error);
