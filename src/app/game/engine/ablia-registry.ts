export interface AbliaChapterConfig {
    id: number;
    name: string;
    unlockScore: number;
    theme: string;
    character: string;
    musicStyle: string;
    baseSpeed: number;
    maxLevel: number;
    assetsDir: string;
    icon: string;
    biome: string;
    bg: string;
    weather: string;
    ambient: string;
    intensity: number;
    obstacle: string;
    colors: string[];
    musicMode?: 'procedural' | 'static';
}

export const ABLIA_CHAPTER_REGISTRY: { [key: number]: AbliaChapterConfig } = {
    1: { id: 1, name: 'Neural Jungle (ABLIA)', unlockScore: 0, theme: 'Adaptive Jungle', character: 'Scout IA', musicStyle: 'Reactive Chiptune', baseSpeed: 1.0, maxLevel: 10, assetsDir: 'ablia/1 -Jungla-Tropical', icon: '🧠', biome: 'jungle', bg: 'jungle', weather: 'rain', ambient: 'fireflies', intensity: 0.4, obstacle: 'abl_spike_sand', colors: ['#8B5E34', '#D7B77A', '#FAD67A'] },
    2: { id: 2, name: 'Neon Citadel (ABLIA)', unlockScore: 2000, theme: 'Cyber Medieval', character: 'Knight Protocol', musicStyle: 'Epic Synth Adaptive', baseSpeed: 1.1, assetsDir: 'ablia/2 -Desierto', maxLevel: 10, icon: '🧩', biome: 'desert', bg: 'desert', weather: 'sand', ambient: 'dust', intensity: 0.22, obstacle: 'abl_arc_blade', colors: ['#4B4EFC', '#7FDBFF', '#E2D9FF'] },
    3: { id: 3, name: 'Steam Core (ABLIA)', unlockScore: 3000, theme: 'Steampunk Logic', character: 'Forge Analyst', musicStyle: 'Industrial Pulse', baseSpeed: 1.2, assetsDir: 'ablia/3 -Templo-Japones', maxLevel: 10, icon: '⚙️', biome: 'japan', bg: 'zen', weather: 'sakura', ambient: 'sakura', intensity: 0.28, obstacle: 'abl_gear_wall', colors: ['#A5512B', '#D28E57', '#F7C16A'] },
    4: { id: 4, name: 'Solar Temple (ABLIA)', unlockScore: 4000, theme: 'Aztec Signal', character: 'Solar Sentinel', musicStyle: 'Tribal Data', baseSpeed: 1.3, assetsDir: 'ablia/4 -Bosque-Encantado', maxLevel: 10, icon: '☀️', biome: 'enchanted', bg: 'magic_wood', weather: 'magic_dust', ambient: 'magic_dust', intensity: 0.48, obstacle: 'abl_sun_pillar', colors: ['#F49B17', '#FFD166', '#4EC5F1'] },
    5: { id: 5, name: 'Ghost Matrix (ABLIA)', unlockScore: 5000, theme: 'Neon Spectral', character: 'Phantom Node', musicStyle: 'Dark Wave Logic', baseSpeed: 1.4, assetsDir: 'ablia/5 -Pantano-Maldito', maxLevel: 10, icon: '👾', biome: 'swamp', bg: 'swamp', weather: 'swamp_gas', ambient: 'bubbles', intensity: 0.58, obstacle: 'abl_ghost_gate', colors: ['#4A1E5A', '#7A2A8F', '#74D0F7'] },
    6: { id: 6, name: 'Chaos Lab (ABLIA)', unlockScore: 6000, theme: 'Experimental Grid', character: 'Rad Labmind', musicStyle: 'Electro Lab', baseSpeed: 1.5, assetsDir: 'ablia/6 -Fabrica-de-Juguetes', maxLevel: 10, icon: '🧪', biome: 'toyfactory', bg: 'factory', weather: 'sparks', ambient: 'steam', intensity: 0.2, obstacle: 'abl_reactor_bar', colors: ['#4F8D2D', '#8EDA66', '#5EF2E5'] },
    7: { id: 7, name: 'Arena Sync (ABLIA)', unlockScore: 7000, theme: 'Combat AI', character: 'Cyber Duelist', musicStyle: 'Techno Combat', baseSpeed: 1.6, assetsDir: 'ablia/7 -Fiesta-Mexicana', maxLevel: 10, icon: '⚔️', biome: 'mexico', bg: 'valley', weather: 'confetti', ambient: 'confetti', intensity: 0.64, obstacle: 'abl_duel_block', colors: ['#1B3AFC', '#FB2E85', '#F6E26B'] },
    8: { id: 8, name: 'Deep Mines (ABLIA)', unlockScore: 8000, theme: 'Crystal Data Caves', character: 'Miner Bot', musicStyle: 'Bass Resonance', baseSpeed: 1.7, assetsDir: 'ablia/8 -Reino-Glacial', maxLevel: 10, icon: '⛏️', biome: 'ice', bg: 'frozen', weather: 'snow', ambient: 'snowflakes', intensity: 0.28, obstacle: 'abl_crystal_shard', colors: ['#4AB8ED', '#8D7DFA', '#D6F08B'] },
    9: { id: 9, name: 'Carnival Loop (ABLIA)', unlockScore: 9000, theme: 'Retro Attraction', character: 'Acrobat AI', musicStyle: 'Carnival Pulse', baseSpeed: 1.8, assetsDir: 'ablia/9 -Neon-Arcade', maxLevel: 10, icon: '🎡', biome: 'arcade', bg: 'neon_city', weather: 'neon', ambient: 'digital', intensity: 0.68, obstacle: 'abl_carnival_spike', colors: ['#FF4FA5', '#62F4FF', '#FFE980'] },
    10: { id: 10, name: 'Toy Protocol (ABLIA)', unlockScore: 10000, theme: 'Toy Logic World', character: 'Toy Commander', musicStyle: 'Happy Logic Beat', baseSpeed: 1.9, assetsDir: 'ablia/10 -Cosmos-Pop', maxLevel: 10, icon: '🧸', biome: 'space_arcade', bg: 'space', weather: 'stardust', ambient: 'stars', intensity: 0.5, obstacle: 'abl_toy_crate', colors: ['#FF7676', '#73A9FF', '#FFD95A'] },
    11: { id: 11, name: 'Glitch Realm (ABLIA)', unlockScore: 11000, theme: 'Psy Abstract', character: 'Geo Entity', musicStyle: 'Abstract Reactive Synth', baseSpeed: 2.0, assetsDir: 'ablia/11 -Volcano-Rush', maxLevel: 10, icon: '🌀', biome: 'lava_arcade', bg: 'volcano', weather: 'embers', ambient: 'embers', intensity: 0.7, obstacle: 'abl_glitch_wall', colors: ['#7D45CC', '#57E9D7', '#F47FB9'] },
    12: { id: 12, name: 'Neon Collapse (ABLIA)', unlockScore: 12000, theme: 'Apocalypse Grid', character: 'Neon Survivor', musicStyle: 'Dark Epic Reactive', baseSpeed: 2.2, assetsDir: 'ablia/12 -Retro-Speedway', maxLevel: 10, icon: '🌆', biome: 'retro_racer', bg: 'retro', weather: 'scanlines', ambient: 'digital', intensity: 0.72, obstacle: 'abl_apoc_sign', colors: ['#C83A52', '#3EC8F7', '#FFA93D'] },
    13: { id: 13, name: 'Deep Abyss (ABLIA)', unlockScore: 13000, theme: 'Ancient Data Ruins', character: 'Buzo Arqueologo', musicStyle: 'Deep Sea Resonance', baseSpeed: 2.3, assetsDir: 'ablia/13 -Ruinas-Sumergidas', maxLevel: 10, icon: '🏛️', biome: 'underwater_ruins', bg: 'abyss', weather: 'bubbles', ambient: 'bubbles', intensity: 0.36, obstacle: 'abl_ruin_pillar', colors: ['#4A90E2', '#35688B', '#F5A623'] },
    14: { id: 14, name: 'Lunar Crater (ABLIA)', unlockScore: 14000, theme: 'Moon Data Crater', character: 'Astronauta Clásico', musicStyle: 'Lunar Sync Pulse', baseSpeed: 2.4, assetsDir: 'ablia/14 -Valle-Lunar', maxLevel: 10, icon: '🌙', biome: 'moon_valley', bg: 'moon', weather: 'dust', ambient: 'dust', intensity: 0.3, obstacle: 'abl_moon_rock', colors: ['#D1D1D1', '#4A4A4A', '#D0021B'] },
    15: { id: 15, name: 'Crystal Hall (ABLIA)', unlockScore: 15000, theme: 'Crystal Palace Logic', character: 'Principe de Cristal', musicStyle: 'Glass Reactive Beat', baseSpeed: 2.5, assetsDir: 'ablia/15 -Catedral-de-Cristal', maxLevel: 10, icon: '💠', biome: 'crystal_hall', bg: 'crystals', weather: 'glitter', ambient: 'glints', intensity: 0.34, obstacle: 'abl_glass_spike', colors: ['#9B59B6', '#E67E22', '#F1C40F'] },
    16: { id: 16, name: 'Noir City (ABLIA)', unlockScore: 16000, theme: 'Night Digital City', character: 'Detective Noir', musicStyle: 'Jazz Digital Synth', baseSpeed: 2.6, assetsDir: 'ablia/16 -Ciudad-Nocturna', maxLevel: 10, icon: '🌃', biome: 'rain_city', bg: 'night_city', weather: 'rain', ambient: 'rain', intensity: 0.34, obstacle: 'abl_neon_sign', colors: ['#34495E', '#2C3E50', '#ECF0F1'] },
};
