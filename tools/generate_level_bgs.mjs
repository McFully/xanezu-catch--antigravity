import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const chapters = [
    { dir: '1-selva-tropical', colors: ['#2E7D32', '#1B5E20', '#388E3C', '#4CAF50'] },
    { dir: '2-desierto-dorado', colors: ['#E65100', '#F57C00', '#FF9800', '#FFB74D', '#BF360C'] },
    { dir: '3-japon-feudal', colors: ['#b71c1c', '#c62828', '#f44336', '#ffcdd2'] },
    { dir: '4-bosque-encantado', colors: ['#4a148c', '#6a1b9a', '#8e24aa', '#e1bee7', '#26c6da'] },
    { dir: '5-pantano-maldito', colors: ['#1b5e20', '#33691e', '#827717', '#9e9d24', '#004d40'] },
    { dir: '6-fabrica-de-juguetes', colors: ['#01579b', '#0277bd', '#0288d1', '#03a9f4', '#fbc02d', '#d32f2f'] },
    { dir: '7-fiesta-mexicana', colors: ['#bf360c', '#d84315', '#e64a19', '#f4511e', '#ffeb3b', '#4caf50'] },
    { dir: '8-reino-glacial', colors: ['#01579b', '#0277bd', '#03a9f4', '#4fc3f7', '#81d4fa', '#e1f5fe'] },
];

function generateShape(type, colors, subLevel) {
    let svgs = '';
    const width = 1280;
    const height = 720;

    // We add elements that look like they change per level
    // These are layered between the procedural BG and FG

    if (type.includes('desierto')) {
        // Desert Theme
        if (subLevel === 1) {
            svgs += `<path d="M 200,600 Q 250,550 300,600 Z" fill="${colors[0]}"/>
                      <path d="M 800,620 Q 860,540 920,620 Z" fill="${colors[1]}"/>`;
        } else if (subLevel === 2) {
            svgs += `<rect x="300" y="450" width="80" height="200" fill="${colors[0]}"/>
                      <rect x="380" y="400" width="60" height="250" fill="${colors[1]}"/>
                      <rect x="800" y="420" width="70" height="230" fill="${colors[0]}"/>`;
        } else if (subLevel === 3) {
            svgs += `<circle cx="400" cy="500" r="150" fill="${colors[2]}" opacity="0.6"/>
                      <polygon points="500,650 600,450 700,650" fill="${colors[3]}"/>`;
        } else if (subLevel === 4) {
            svgs += `<path d="M 100,500 L 200,600 L 0,600 Z" fill="${colors[0]}"/>
                      <path d="M 1000,400 L 1150,650 L 850,650 Z" fill="${colors[1]}"/>`;
        } else if (subLevel === 5) {
            svgs += `<rect x="500" y="350" width="20" height="300" fill="${colors[0]}"/>
                      <rect x="450" y="320" width="120" height="30" fill="${colors[1]}"/>`;
        } else if (subLevel === 6) {
            svgs += `<path d="M 200,600 Q 640,300 1080,600" stroke="${colors[4]}" stroke-width="30" fill="none"/>`;
        }
    }
    else if (type.includes('selva')) {
        for (let i = 0; i < 3 + subLevel; i++) {
            let x = (100 + i * 200 + subLevel * 50) % 1200;
            svgs += `<rect x="${x}" y="300" width="40" height="420" fill="${colors[0]}"/>
                    <circle cx="${x + 20}" cy="300" r="${80 + subLevel * 10}" fill="${colors[1]}" opacity="0.8"/>`;
        }
    }
    else {
        // Generic variations for other chapters
        const c1 = colors[subLevel % colors.length];
        const c2 = colors[(subLevel + 1) % colors.length];
        for (let i = 0; i < subLevel + 2; i++) {
            let x = (150 + i * 300) % 1280;
            svgs += `<polygon points="${x},600 ${x + 100},${350 - subLevel * 20} ${x + 200},600" fill="${c1}" opacity="0.7"/>
                    <ellipse cx="${x + 100}" cy="${500 - subLevel * 10}" rx="60" ry="100" fill="${c2}" opacity="0.5"/>`;
        }
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
        ${svgs}
    </svg>`;
}

for (const ch of chapters) {
    const dirPath = path.join(__dirname, 'assets', ch.dir, 'fondos');
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }

    for (let i = 1; i <= 6; i++) {
        const bgContent = generateShape(ch.dir, ch.colors, i);
        fs.writeFileSync(path.join(dirPath, \`bg_l0\${i}.svg\`), bgContent);
    }
    console.log(\`Generated backgrounds for \${ch.dir}\`);
}
