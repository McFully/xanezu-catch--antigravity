export interface ChapterConfig {
    id: number;
    name: string;
    description: string;
    difficulty: number;
    mapX: number;
    mapY: number;
    assetsDir: string;
    icon: string;
    biome: string;
    weather: string;
    obstacle: string;
    colors: string[];
    bg: string;
    ambient: string;
    intensity: number;
    eyeColor: string;
    godRays?: boolean;
    godRayColor?: string;
    tint?: string;
    tintAlpha?: number;
    vignetteAlpha?: number;
    maxLevel: number;
    musicMode?: 'procedural' | 'static';
}

export const CHAPTER_REGISTRY: { [key: number]: ChapterConfig } = {
    1: { 
        id: 1, 
        name: 'Selva Tropical', 
        description: 'Un ecosistema vibrante y denso. Los restos de satélites caen entre la maleza, protegidos por plantas carnívoras y trampas naturales.',
        difficulty: 1,
        mapX: 250, mapY: 300,
        assetsDir: 'story/1-selva-tropical', icon: '🌿', biome: 'jungle', weather: 'rain', obstacle: 'jungleBramble', colors: ['#1a4a1a', '#061a10'], bg: 'forest', ambient: 'fireflies', intensity: 0.4, eyeColor: '#A6F616', godRays: false, godRayColor: 'rgba(170,255,102,0.06)', tint: '#1a3a1a', tintAlpha: 0.06, vignetteAlpha: 0.45, maxLevel: 30 
    },
    2: { 
        id: 2, 
        name: 'Desierto Dorado', 
        description: 'Ruinas antiguas emergen de las dunas. El calor distorsiona la vista y las tormentas de arena ocultan peligros ancestrales.',
        difficulty: 2,
        mapX: 420, mapY: 520,
        assetsDir: 'story/2-desierto-dorado', icon: '🏜️', biome: 'desert', weather: 'sand', obstacle: 'ancientColumn', colors: ['#E4D00A', '#8B4513'], bg: 'desert', ambient: 'dust', intensity: 0.15, eyeColor: '#FFD700', godRays: false, godRayColor: 'rgba(255,215,0,0.05)', tint: '#FFD700', tintAlpha: 0.04, vignetteAlpha: 0.35, maxLevel: 30 
    },
    3: { 
        id: 3, 
        name: 'Japon Feudal', 
        description: 'Pétalos de sakura caen sobre templos olvidados. Una atmósfera de paz que esconde la caída de proyectiles tecnológicos.',
        difficulty: 3,
        mapX: 600, mapY: 380,
        assetsDir: 'story/3-japon-feudal', icon: '⛩️', biome: 'japan', weather: 'sakura', obstacle: 'toriiGate', colors: ['#E6B0AA', '#922B21'], bg: 'zen', ambient: 'sakura', intensity: 0.3, eyeColor: '#FFF', godRays: false, tint: '#e6c8c8', tintAlpha: 0.05, vignetteAlpha: 0.3, maxLevel: 30 
    },
    4: { 
        id: 4, 
        name: 'Bosque Encantado', 
        description: 'La magia y la tecnología se entrelazan. El polvo arcano dificulta la navegación aérea de los recolectores.',
        difficulty: 3,
        mapX: 820, mapY: 580,
        assetsDir: 'story/4-bosque-encantado', icon: '🦄', biome: 'enchanted', weather: 'magic_dust', obstacle: 'enchantedRoot', colors: ['#2ecc71', '#0b3d20'], bg: 'magic_wood', ambient: 'magic_dust', intensity: 0.5, eyeColor: '#a855f7', godRays: false, tint: '#2d1b69', tintAlpha: 0.08, vignetteAlpha: 0.5, maxLevel: 30 
    },
    5: { 
        id: 5, 
        name: 'Pantano Maldito', 
        description: 'Gases tóxicos y raíces retorcidas. Sobrevivir aquí requiere reflejos rápidos y una máscara de oxígeno virtual.',
        difficulty: 4,
        mapX: 1020, mapY: 420,
        assetsDir: 'story/5-pantano-maldito', icon: '🐊', biome: 'swamp', weather: 'swamp_gas', obstacle: 'twistedRoot', colors: ['#2d5a27', '#0b1f0b'], bg: 'swamp', ambient: 'bubbles', intensity: 0.6, eyeColor: '#88ff88', godRays: false, tint: '#1a3a0a', tintAlpha: 0.1, vignetteAlpha: 0.55, maxLevel: 30 
    },
    6: { 
        id: 6, 
        name: 'Fabrica de Juguetes', 
        description: 'Engranajes gigantes y cintas transportadoras. Esquiva los muñecos defectuosos en esta colorida pero peligrosa factoría.',
        difficulty: 4,
        mapX: 1220, mapY: 650,
        assetsDir: 'story/6-fabrica-de-juguetes', icon: '🤖', biome: 'factory', weather: 'sparks', obstacle: 'gear', colors: ['#FF5733', '#C70039'], bg: 'factory', ambient: 'smoke', intensity: 0.55, eyeColor: '#FFC300', godRays: false, tint: '#4a0e0e', tintAlpha: 0.08, vignetteAlpha: 0.4, maxLevel: 30 
    },
    7: { 
        id: 7, 
        name: 'Fiesta Mexicana', 
        description: 'Papel picado y música vibrante. Una celebración eterna donde los fuegos artificiales pueden ser tus aliados o enemigos.',
        difficulty: 3,
        mapX: 1450, mapY: 780,
        assetsDir: 'story/7-fiesta-mexicana', icon: '🌵', biome: 'mexico', weather: 'confetti', obstacle: 'pinata', colors: ['#28B463', '#F1C40F'], bg: 'plaza', ambient: 'music', intensity: 0.45, eyeColor: '#E74C3C', godRays: false, tint: '#3a1a0a', tintAlpha: 0.06, vignetteAlpha: 0.35, maxLevel: 30 
    },
    8: { 
        id: 8, 
        name: 'Reino Glacial', 
        description: 'El frío absoluto ha congelado la tecnología. Deslízate por el hielo mientras recolectas restos espaciales.',
        difficulty: 5,
        mapX: 1650, mapY: 620,
        assetsDir: 'story/8-reino-glacial', icon: '❄️', biome: 'ice', weather: 'snow', obstacle: 'iceSpike', colors: ['#85C1E9', '#2E86C1'], bg: 'glacier', ambient: 'snow', intensity: 0.7, eyeColor: '#FFFFFF', godRays: true, godRayColor: 'rgba(255,255,255,0.1)', tint: '#0a1a3a', tintAlpha: 0.12, vignetteAlpha: 0.5, maxLevel: 30 
    },
    9: { 
        id: 9, 
        name: 'Neon Arcade', 
        description: 'Una simulación digital dentro del mundo real. Rayos láser y cubos de datos caen del cielo binario.',
        difficulty: 5,
        mapX: 1780, mapY: 400,
        assetsDir: 'story/9-neon-arcade', icon: '🕹️', biome: 'arcade', weather: 'neon', obstacle: 'neonBlock', colors: ['#2EF3FF', '#A600FF'], bg: 'neon_city', ambient: 'pixels', intensity: 0.7, eyeColor: '#2EF3FF', godRays: false, godRayColor: 'rgba(46,243,255,0.08)', tint: '#3a0f5c', tintAlpha: 0.08, vignetteAlpha: 0.32, maxLevel: 30 
    },
    10: { 
        id: 10, 
        name: 'Cosmos Pop', 
        description: 'Navega entre estrellas de neón y burbujas de energía.',
        difficulty: 5,
        mapX: 1680, mapY: 180,
        assetsDir: 'story/10-cosmos-pop', icon: '🌌', biome: 'space_arcade', weather: 'stardust', obstacle: 'cometGate', colors: ['#FF4D6D', '#4CC9F0'], bg: 'cosmos_pop', ambient: 'sparkles', intensity: 0.65, eyeColor: '#FFD6E0', godRays: false, godRayColor: 'rgba(255,77,109,0.07)', tint: '#2d1444', tintAlpha: 0.07, vignetteAlpha: 0.34, maxLevel: 30 
    },
    11: { 
        id: 11, 
        name: 'Volcano Rush', 
        description: 'El calor del núcleo se desborda en este bioma ardiente.',
        difficulty: 6,
        mapX: 1480, mapY: 100,
        assetsDir: 'story/11-volcano-rush', icon: '🌋', biome: 'lava_arcade', weather: 'embers', obstacle: 'magmaPillar', colors: ['#FF7A00', '#FF2E2E'], bg: 'volcano', ambient: 'embers', intensity: 0.72, eyeColor: '#FFD166', godRays: false, tint: '#4a1900', tintAlpha: 0.1, vignetteAlpha: 0.4, maxLevel: 30 
    },
    12: { 
        id: 12, 
        name: 'Retro Speedway', 
        description: 'Velocidad pura en una rejilla digital infinita.',
        difficulty: 4,
        mapX: 1280, mapY: 50,
        assetsDir: 'story/12-retro-speedway', icon: '🏁', biome: 'retro_racer', weather: 'scanlines', obstacle: 'barrier', colors: ['#00E5FF', '#FF00A8'], bg: 'retro_grid', ambient: 'streaks', intensity: 0.68, eyeColor: '#FFFFFF', godRays: false, godRayColor: 'rgba(0,229,255,0.08)', tint: '#101635', tintAlpha: 0.08, vignetteAlpha: 0.3, maxLevel: 30 
    },
    13: { 
        id: 13, 
        name: 'Ruinas Sumergidas', 
        description: 'El silencio del abismo tecnológico.',
        difficulty: 4,
        mapX: 1080, mapY: 100,
        assetsDir: 'story/13-ruinas-sumergidas', icon: '🏛️', biome: 'underwater_ruins', weather: 'bubbles', obstacle: 'ruinColumn', colors: ['#6EC6FF', '#1B4965'], bg: 'abyss', ambient: 'bubbles', intensity: 0.35, eyeColor: '#C8F7FF', godRays: false, godRayColor: 'rgba(110,198,255,0.06)', tint: '#0c2b3f', tintAlpha: 0.09, vignetteAlpha: 0.42, maxLevel: 30 
    },
    14: { 
        id: 14, 
        name: 'Valle Lunar', 
        description: 'Baja gravedad y alta tensión.',
        difficulty: 4,
        mapX: 880, mapY: 150,
        assetsDir: 'story/14-valle-lunar', icon: '🌙', biome: 'moon_valley', weather: 'dust', obstacle: 'moonRock', colors: ['#D9D9E3', '#3C3F58'], bg: 'moon', ambient: 'dust', intensity: 0.3, eyeColor: '#E8EAFF', godRays: false, tint: '#23263a', tintAlpha: 0.08, vignetteAlpha: 0.44, maxLevel: 30 
    },
    15: { 
        id: 15, 
        name: 'Catedral de Cristal', 
        description: 'Belleza frágil y reflejos letales.',
        difficulty: 5,
        mapX: 680, mapY: 80,
        assetsDir: 'story/15-catedral-de-cristal', icon: '💠', biome: 'crystal_hall', weather: 'glitter', obstacle: 'crystalSpire', colors: ['#BDE0FE', '#6D4C9B'], bg: 'cathedral', ambient: 'glitter', intensity: 0.38, eyeColor: '#DFF7FF', godRays: false, godRayColor: 'rgba(189,224,254,0.06)', tint: '#2a1b3d', tintAlpha: 0.07, vignetteAlpha: 0.4, maxLevel: 30 
    },
    16: { 
        id: 16, 
        name: 'Ciudad Nocturna', 
        description: 'Lluvia ácida y luces de neón.',
        difficulty: 4,
        mapX: 450, mapY: 150,
        assetsDir: 'story/16-ciudad-nocturna', icon: '🌃', biome: 'rain_city', weather: 'rain', obstacle: 'neonSign', colors: ['#7DD3FC', '#1E293B'], bg: 'night_city', ambient: 'rain', intensity: 0.33, eyeColor: '#9EE7FF', godRays: false, godRayColor: 'rgba(125,211,252,0.05)', tint: '#0f172a', tintAlpha: 0.09, vignetteAlpha: 0.45, maxLevel: 30 
    },
};
