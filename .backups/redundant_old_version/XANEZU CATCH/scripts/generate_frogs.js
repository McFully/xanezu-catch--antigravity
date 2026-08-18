const fs = require('fs');
const path = require('path');

// Base frog colors to be replaced
// Ordered from darkest to lightest roughly
const MAPPING = [
    { old: '#204b0e', type: 'very_dark' },
    { old: '#1a4a14', type: 'very_dark' },
    { old: '#174b19', type: 'very_dark' },
    { old: '#2f5a1a', type: 'very_dark' },
    { old: '#154a16', type: 'very_dark' },
    { old: '#1c4418', type: 'very_dark' },
    { old: '#1f4a10', type: 'very_dark' },
    { old: '#20470f', type: 'very_dark' },
    { old: '#1a3526', type: 'very_dark' },
    { old: '#17322a', type: 'very_dark' },
    { old: '#1a2b38', type: 'very_dark' },

    { old: '#7ad95f', type: 'mid_dark' },
    { old: '#7bd666', type: 'mid_dark' },
    { old: '#55e141', type: 'mid_dark' },
    { old: '#57de4f', type: 'mid_dark' },
    { old: '#57b666', type: 'mid_dark' },

    { old: '#aff92f', type: 'primary' },
    { old: '#abf62f', type: 'primary' },
    { old: '#b3f52f', type: 'primary' },
    { old: '#bdef46', type: 'primary' },
    { old: '#aff92f', type: 'primary' },

    { old: '#c6ed63', type: 'light_mid' },
    { old: '#d7f397', type: 'light' },
    { old: '#d1f070', type: 'light' },
    { old: '#d1f482', type: 'light' },
    { old: '#f6fbdf', type: 'very_light' }
];

const registryPath = path.join(__dirname, '../js/core/ChapterRegistry.js');
const registryText = fs.readFileSync(registryPath, 'utf8');

// Primitive regex to extract chapter data
const chapterMatches = [...registryText.matchAll(/(\d+):\s*\{([^}]+)\}/g)];
const chapters = {};

chapterMatches.forEach(m => {
    const id = m[1];
    const body = m[2];
    const colorsMatch = body.match(/colors:\s*\[([^\]]+)\]/);
    const eyeMatch = body.match(/eyeColor:\s*"([^"]+)"/);

    const colors = colorsMatch ? colorsMatch[1].split(',').map(c => c.trim().replace(/"|'/g, '')) : ['#A6F616', '#061a10'];
    const eyeColor = eyeMatch ? eyeMatch[1] : colors[0];

    chapters[id] = { colors, eyeColor };
});

const baseSvgPath = path.join(__dirname, '../assets/frog.idl.svg');
const baseSvg = fs.readFileSync(baseSvgPath, 'utf8');

console.log(`Starting generation for 88 frog skins...`);

for (let i = 1; i <= 88; i++) {
    const config = chapters[i] || { colors: ['#A6F616', '#061a10'], eyeColor: '#A6F616' };
    const primary = config.colors[0];
    const secondary = config.colors[1] || primary;
    const highlight = config.eyeColor;

    let tintedSvg = baseSvg;

    // Replacement strategy:
    // very_light -> white/highlight tint
    // light -> highlight
    // primary -> primary color
    // mid_dark -> mixed/secondary
    // very_dark -> secondary

    MAPPING.forEach(m => {
        let replacement = primary;
        if (m.type === 'very_light') replacement = '#FFFFFF';
        else if (m.type === 'light') replacement = highlight;
        else if (m.type === 'primary') replacement = primary;
        else if (m.type === 'mid_dark') replacement = secondary;
        else if (m.type === 'very_dark') replacement = shadeColor(secondary, -20);

        // Dynamic replacement (case insensitive)
        const re = new RegExp(m.old, 'gi');
        tintedSvg = tintedSvg.replace(re, replacement);
    });

    const outDir = path.join(__dirname, `../assets/ch${i}`);
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    fs.writeFileSync(path.join(outDir, 'frog.svg'), tintedSvg);
}

console.log('Successfully generated all 88 thematic frog skins.');

function shadeColor(color, percent) {
    var R = parseInt(color.substring(1, 3), 16);
    var G = parseInt(color.substring(3, 5), 16);
    var B = parseInt(color.substring(5, 7), 16);

    R = parseInt(R * (100 + percent) / 100);
    G = parseInt(G * (100 + percent) / 100);
    B = parseInt(B * (100 + percent) / 100);

    R = (R < 255) ? R : 255;
    G = (G < 255) ? G : 255;
    B = (B < 255) ? B : 255;

    R = Math.round(R);
    G = Math.round(G);
    B = Math.round(B);

    var RR = ((R.toString(16).length == 1) ? "0" + R.toString(16) : R.toString(16));
    var GG = ((G.toString(16).length == 1) ? "0" + G.toString(16) : G.toString(16));
    var BB = ((B.toString(16).length == 1) ? "0" + B.toString(16) : B.toString(16));

    return "#" + RR + GG + BB;
}
