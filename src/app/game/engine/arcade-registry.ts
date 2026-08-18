export interface ArcadeChapterConfig {
    id: number;
    name: string;
    unlockScore: number;
    theme: string;
    assetsDir: string;
    character: string;
    musicStyle: string;
    baseSpeed: number;
    maxLevel: number;
    biome: string;
    bg: string;
    weather: string;
    ambient: string;
    intensity: number;
    icon: string;
    colors: string[];
    godRays?: boolean;
    godRayColor?: string;
    musicMode?: 'procedural' | 'static';
}

export const ARCADE_CHAPTER_REGISTRY: { [key: number]: ArcadeChapterConfig } = {
    1: { id: 1, name: 'Jungla Tropical 8-bit', unlockScore: 0, theme: 'Pixel Jungle', assetsDir: 'arcade/1 -Jungla-Tropical-8-bit', character: 'Explorador 8-bit', musicStyle: 'Chiptune Tropical', baseSpeed: 1.0, maxLevel: 10, biome: 'jungle', bg: 'jungle', weather: 'rain', ambient: 'fireflies', intensity: 0.42, icon: '🌴', colors: ['#00FF66', '#00CC99', '#FFFF00'] },
    2: { id: 2, name: 'Desierto Dorado AAA', unlockScore: 2000, theme: 'Golden Desert', assetsDir: 'arcade/2 -Desierto-8-bit', character: 'Explorador Dorado', musicStyle: 'Epic Middle East Synth', baseSpeed: 1.1, maxLevel: 10, biome: 'desert', bg: 'desert', weather: 'sand', ambient: 'dust', intensity: 0.2, icon: '🏜️', colors: ['#FFD700', '#B8860B', '#8B4513'], godRays: true, godRayColor: 'rgba(255, 215, 0, 0.1)' },
    3: { id: 3, name: 'Templo Japones Arcade', unlockScore: 2000, theme: 'Neon Zen', assetsDir: 'arcade/3 -Templo-Japones-8-bit', character: 'Ninja Energetico', musicStyle: 'Synth Sakura', baseSpeed: 1.2, maxLevel: 10, biome: 'japan', bg: 'zen', weather: 'sakura', ambient: 'sakura', intensity: 0.3, icon: '⛩️', colors: ['#FFC0CB', '#FF1493', '#FFFFFF'] },
    4: { id: 4, name: 'Ciudad Futurista Arcade', unlockScore: 2000, theme: 'Cyber City', assetsDir: 'arcade/4 -Ciudad-Futurista-8-bit', character: 'Runner Neon', musicStyle: 'Cyberpunk Bass', baseSpeed: 1.3, maxLevel: 10, biome: 'arcade', bg: 'neon_city', weather: 'neon', ambient: 'digital', intensity: 0.62, icon: '🌆', colors: ['#00E5FF', '#6A00FF', '#FF00A8'] },
    5: { id: 5, name: 'Mision Espacial Arcade', unlockScore: 2000, theme: 'Space Odyssey', assetsDir: 'arcade/5 -Mision-Espacial-8-bit', character: 'Piloto Estelar', musicStyle: 'Space Synth', baseSpeed: 1.4, maxLevel: 10, biome: 'space_arcade', bg: 'space', weather: 'stardust', ambient: 'stars', intensity: 0.48, icon: '🚀', colors: ['#1E90FF', '#00008B', '#FFFFFF'] },
    6: { id: 6, name: 'Laboratorio Arcade', unlockScore: 2000, theme: 'Tech Lab', assetsDir: 'arcade/6 -Laboratorio-8-bit', character: 'Cientifico Neon', musicStyle: 'Electro Glitch', baseSpeed: 1.5, maxLevel: 10, biome: 'toyfactory', bg: 'factory', weather: 'sparks', ambient: 'steam', intensity: 0.24, icon: '🧪', colors: ['#32CD32', '#006400', '#ADFF2F'] },
    7: { id: 7, name: 'Castillo Neon Arcade', unlockScore: 2000, theme: 'Neon Fortress', assetsDir: 'arcade/7 -Castillo-Neon-8-bit', character: 'Guardian del Eco', musicStyle: 'Medieval Synth', baseSpeed: 1.6, maxLevel: 10, biome: 'enchanted', bg: 'castle', weather: 'magic_dust', ambient: 'magic_dust', intensity: 0.44, icon: '🏰', colors: ['#FF00FF', '#4B0082', '#FFFFFF'] },
    8: { id: 8, name: 'Arcade Infernal', unlockScore: 2000, theme: 'Neon Inferno', assetsDir: 'arcade/8-arcade-infernal', character: 'Demonio Pixel', musicStyle: 'Heavy Inferno Synth', baseSpeed: 1.8, maxLevel: 10, biome: 'lava_arcade', bg: 'volcano', weather: 'embers', ambient: 'embers', intensity: 0.82, icon: '🔥', colors: ['#FF0000', '#FF4500', '#000000', '#A600FF'] },
    9: { id: 9, name: 'Parque Atracciones Arcade', unlockScore: 2000, theme: 'Carnival Neon', assetsDir: 'arcade/9 -Parque-Atracciones-8-bit', character: 'Acrobata Electrico', musicStyle: 'Electro Carnival', baseSpeed: 1.8, maxLevel: 10, biome: 'arcade', bg: 'circus', weather: 'confetti', ambient: 'glints', intensity: 0.66, icon: '🎡', colors: ['#FF3CAC', '#00F5FF', '#FFE347'] },
    10: { id: 10, name: 'Mundo Magico Arcade', unlockScore: 2000, theme: 'Magic World', assetsDir: 'arcade/10 -Mundo-Magico-8-bit', character: 'Mago Digital', musicStyle: 'Fantasia 8-bit', baseSpeed: 1.9, maxLevel: 10, biome: 'enchanted', bg: 'magic_wood', weather: 'magic_dust', ambient: 'magic_dust', intensity: 0.5, icon: '🧙', colors: ['#8A2BE2', '#4B0082', '#FFFFFF'] },
    11: { id: 11, name: 'Volcan Retro Arcade', unlockScore: 2000, theme: 'Lava Rush', assetsDir: 'arcade/11 -Volcan-Retro-8-bit', character: 'Survivor Lava', musicStyle: 'Heavy Electro', baseSpeed: 2.0, maxLevel: 10, biome: 'lava_arcade', bg: 'volcano', weather: 'embers', ambient: 'embers', intensity: 0.74, icon: '🌋', colors: ['#FF4500', '#8B0000', '#FFFF00'] },
    12: { id: 12, name: 'Capitulo Final Arcade', unlockScore: 2000, theme: 'Omega Void', assetsDir: 'arcade/12 -Capitulo-Final-8-bit', character: 'Entidad Suprema', musicStyle: 'Final Boss Synth', baseSpeed: 2.2, maxLevel: 10, biome: 'retro_racer', bg: 'retro', weather: 'scanlines', ambient: 'digital', intensity: 0.72, icon: '👑', colors: ['#FFFFFF', '#000000', '#FFD700'] },
    13: { id: 13, name: 'Abismo Pixel Arcade', unlockScore: 10000, theme: 'Deep Abyss 8-bit', assetsDir: 'arcade/13 -Secreto-8-bit', character: 'Buzo Pixel', musicStyle: 'Deep Sea Chiptune', baseSpeed: 2.3, maxLevel: 10, biome: 'underwater_ruins', bg: 'abyss', weather: 'bubbles', ambient: 'bubbles', intensity: 0.36, icon: '🏛️', colors: ['#4A90E2', '#35688B', '#F5A623'] },
    14: { id: 14, name: 'Crater Lunar Arcade', unlockScore: 12000, theme: 'Lunar Crater 8-bit', assetsDir: 'arcade/14 -Secreto-8-bit', character: 'Cosmonauta Retro', musicStyle: 'Lunar Retro Pulse', baseSpeed: 2.4, maxLevel: 10, biome: 'moon_valley', bg: 'moon', weather: 'dust', ambient: 'dust', intensity: 0.3, icon: '🌙', colors: ['#D1D1D1', '#4A4A4A', '#D0021B'] },
    15: { id: 15, name: 'Catedral de Cristal Arcade', unlockScore: 14000, theme: 'Crystal Cathedral 8-bit', assetsDir: 'arcade/15 -Secreto-8-bit', character: 'Guardian del Cristal', musicStyle: 'Glass Synth 8-bit', baseSpeed: 2.5, maxLevel: 10, biome: 'crystal_hall', bg: 'crystals', weather: 'glitter', ambient: 'glints', intensity: 0.34, icon: '💠', colors: ['#9B59B6', '#E67E22', '#F1C40F'] },
    16: { id: 16, name: 'Ciudad Noir Arcade', unlockScore: 16000, theme: 'Noir City 8-bit', assetsDir: 'arcade/16 -Secreto-8-bit', character: 'Detective 8-bit', musicStyle: 'Noir Chiptune Jazz', baseSpeed: 2.6, maxLevel: 10, biome: 'rain_city', bg: 'night_city', weather: 'rain', ambient: 'rain', intensity: 0.34, icon: '🌃', colors: ['#34495E', '#2C3E50', '#ECF0F1'] },
};
