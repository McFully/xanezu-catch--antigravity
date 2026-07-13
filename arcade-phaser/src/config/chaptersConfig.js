export const ABL_CHAPTERS = [
  { id: 1, theme: 'Castillo medieval', unlockScore: 0, character: 'Caballero Real', musicStyle: 'Epic Medieval Synth', baseSpeed: 1.0, palette: [0x4f46e5, 0x60a5fa, 0xfacc15], obstacle: 'Lanza de guardia' },
  { id: 2, theme: 'Aldea rustica', unlockScore: 2000, character: 'Aldeano Valiente', musicStyle: 'Folk Chiptune', baseSpeed: 1.1, palette: [0x65a30d, 0xca8a04, 0xf5d0a9], obstacle: 'Carreta rota' },
  { id: 3, theme: 'Mazmorra subterranea', unlockScore: 3000, character: 'Explorador Oscuro', musicStyle: 'Dark Dungeon Synth', baseSpeed: 1.2, palette: [0x1f2937, 0x6d28d9, 0x22d3ee], obstacle: 'Muro de pinchos' },
  { id: 4, theme: 'Ruinas antiguas', unlockScore: 4000, character: 'Arqueologo', musicStyle: 'Ancient Ambient Synth', baseSpeed: 1.3, palette: [0xb45309, 0xf59e0b, 0x60a5fa], obstacle: 'Columna partida' },
  { id: 5, theme: 'Caverna de cristales', unlockScore: 5000, character: 'Minero Luminoso', musicStyle: 'Crystal Electro', baseSpeed: 1.4, palette: [0x0ea5e9, 0xa78bfa, 0x67e8f9], obstacle: 'Pico cristalino' },
  { id: 6, theme: 'Puerto medieval', unlockScore: 6000, character: 'Marinero', musicStyle: 'Seaside Chiptune', baseSpeed: 1.5, palette: [0x0369a1, 0x0ea5e9, 0xf59e0b], obstacle: 'Ancla oxidada' },
  { id: 7, theme: 'Fortaleza en la montana', unlockScore: 7000, character: 'Guardian', musicStyle: 'Epic Mountain Synth', baseSpeed: 1.6, palette: [0x334155, 0x64748b, 0xf8fafc], obstacle: 'Muralla de roca' },
  { id: 8, theme: 'Pueblo vikingo', unlockScore: 8000, character: 'Vikingo', musicStyle: 'Viking Chiptune', baseSpeed: 1.7, palette: [0x7c2d12, 0xb45309, 0x94a3b8], obstacle: 'Hacha doble' },
  { id: 9, theme: 'Cementerio antiguo', unlockScore: 9000, character: 'Espiritu Errante', musicStyle: 'Dark Ambient', baseSpeed: 1.8, palette: [0x111827, 0x374151, 0x7dd3fc], obstacle: 'Lapida maldita' },
  { id: 10, theme: 'Isla volcanica', unlockScore: 10000, character: 'Explorador Volcanico', musicStyle: 'Lava Electro', baseSpeed: 1.9, palette: [0x7f1d1d, 0xdc2626, 0xf97316], obstacle: 'Roca de magma' },
  { id: 11, theme: 'Catedral gotica', unlockScore: 11000, character: 'Sacerdote Arcano', musicStyle: 'Gothic Choir Synth', baseSpeed: 2.0, palette: [0x312e81, 0x4c1d95, 0xa78bfa], obstacle: 'Vitral oscuro' },
  { id: 12, theme: 'Pueblo vikingo - Eclipse', unlockScore: 12000, character: 'Vikingo Lider', musicStyle: 'Epic Viking Synth', baseSpeed: 2.2, palette: [0x1e293b, 0x0369a1, 0xf43f5e], obstacle: 'Totem de guerra' }
];

export const ABL_MAX_LEVEL = 10;

export function getChapterById(id) {
  return ABL_CHAPTERS.find((c) => c.id === id) || ABL_CHAPTERS[0];
}
