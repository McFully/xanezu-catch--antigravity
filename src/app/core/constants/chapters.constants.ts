import { Chapter } from '../models/chapter.model';

const BASES = [
  { title: 'Selva Tropical', folder: '1-selva-tropical', diff: 'FÁCIL', desc: 'Una jungla densa llena de vida y peligros ocultos.' },
  { title: 'Desierto Dorado', folder: '2-desierto-dorado', diff: 'FÁCIL', desc: 'Dunas infinitas bajo un sol implacable.' },
  { title: 'Japón Feudal', folder: '3-japon-feudal', diff: 'FÁCIL', desc: 'Templos antiguos y cerezos en flor.' },
  { title: 'Bosque Encantado', folder: '4-bosque-encantado', diff: 'NORMAL', desc: 'Un lugar donde la magia y la naturaleza se fusionan.' },
  { title: 'Pantano Maldito', folder: '5-pantano-maldito', diff: 'NORMAL', desc: 'Aguas estancadas y sombras que acechan.' },
  { title: 'Fábrica de Juguetes', folder: '6-fabrica-de-juguetes', diff: 'NORMAL', desc: 'Engranajes y robots fuera de control.' },
  { title: 'Fiesta Mexicana', folder: '7-fiesta-mexicana', diff: 'NORMAL', desc: 'Colores, música y calaveras festivas.' },
  { title: 'Reino Glacial', folder: '8-reino-glacial', diff: 'NORMAL', desc: 'Hielo eterno y ventiscas cortantes.' },
  { title: 'Neón Arcade', folder: '9-neon-arcade', diff: 'DIFÍCIL', desc: 'Un mundo digital de luces y velocidad.' },
  { title: 'Cosmos Pop', folder: '10-cosmos-pop', diff: 'DIFÍCIL', desc: 'Viaja entre estrellas y galaxias de colores.' },
  { title: 'Volcano Rush', folder: '11-volcano-rush', diff: 'DIFÍCIL', desc: 'Ríos de lava y calor extremo.' },
  { title: 'Retro Speedway', folder: '12-retro-speedway', diff: 'DIFÍCIL', desc: 'Pistas de carreras clásicas y veloces.' },
  { title: 'Ruinas Sumergidas', folder: '13-ruinas-sumergidas', diff: 'DIFÍCIL', desc: 'Los secretos de una civilización bajo el mar.' },
  { title: 'Valle Lunar', folder: '14-valle-lunar', diff: 'DIFÍCIL', desc: 'Baja gravedad y cráteres misteriosos.' },
  { title: 'Catedral de Cristal', folder: '15-catedral-de-cristal', diff: 'DIFÍCIL', desc: 'Belleza frágil y reflejos infinitos.' },
  { title: 'Ciudad Nocturna', folder: '16-ciudad-nocturna', diff: 'DIFÍCIL', desc: 'Rascacielos y luces en la oscuridad urbana.' }
];

export const STORY_CHAPTERS: Chapter[] = BASES.map((b, i) => ({
  id: `STORY_CHAPTER_${(i + 1).toString().padStart(2, '0')}`,
  mode: 'STORY',
  title: b.title,
  folder: b.folder,
  difficulty: b.diff as any,
  description: b.desc,
  unlocked: true,
  music: `story_bgm_${i + 1}`,
  objects: [], obstacles: [], objectives: [], winConditions: [], rules: [], stages: []
}));

const ARCADE_FOLDERS = [
  '1 -Jungla-Tropical-8-bit',
  '2 -Desierto-8-bit',
  '3 -Templo-Japones-8-bit',
  '4 -Ciudad-Futurista-8-bit',
  '5 -Mision-Espacial-8-bit',
  '6 -Laboratorio-8-bit',
  '7 -Castillo-Neon-8-bit',
  '8 -Mina-Cristal-8-bit',
  '9 -Parque-Atracciones-8-bit',
  '10 -Mundo-Magico-8-bit',
  '11 -Volcan-Retro-8-bit',
  '12 -Capitulo-Final-8-bit',
  '13 -Secreto-8-bit',
  '14 -Secreto-8-bit',
  '15 -Secreto-8-bit',
  '16 -Secreto-8-bit'
];

export const ARCADE_CHAPTERS: Chapter[] = BASES.map((b, i) => ({
  id: `ARCADE_CHAPTER_${(i + 1).toString().padStart(2, '0')}`,
  mode: 'ARCADE',
  title: `${b.title} (Arcade)`,
  folder: ARCADE_FOLDERS[i],
  difficulty: b.diff as any,
  description: `Modo supervivencia infinita en ${b.title}.`,
  unlocked: i < 12, // 12 desbloqueados, 4 bloqueados (índices 0-11 = true, 12-15 = false)
  music: `arcade_bgm_${i + 1}`,
  objects: [], obstacles: [], objectives: [], winConditions: [], rules: [], stages: []
}));

const ABLIA_CIVILIZATIONS = [
  { title: 'Templo Maya', folder: 'maya', diff: 'NORMAL', desc: 'Junglas densas y pirámides escalonadas de una civilización perdida.' },
  { title: 'Imperio Azteca', folder: 'azteca', diff: 'NORMAL', desc: 'El corazón de Tenochtitlán y sus sacrificios al sol.' },
  { title: 'Valle de los Reyes', folder: 'egipto', diff: 'NORMAL', desc: 'Arena dorada, obeliscos y los secretos de los faraones.' },
  { title: 'Ur Sumeria', folder: 'sumeria', diff: 'NORMAL', desc: 'Entre los ríos Tigris y Éufrates, la cuna de la escritura.' },
  { title: 'Acrópolis Griega', folder: 'grecia', diff: 'DIFÍCIL', desc: 'Columnas de mármol y la sabiduría de los dioses del Olimpo.' },
  { title: 'Foro Romano', folder: 'roma', diff: 'DIFÍCIL', desc: 'El esplendor del águila imperial y sus calzadas eternas.' },
  { title: 'Dinastía Han', folder: 'china', diff: 'DIFÍCIL', desc: 'La gran muralla y el misticismo del dragón ancestral.' },
  { title: 'Midgard Nórdico', folder: 'nordica', diff: 'DIFÍCIL', desc: 'Fiordos helados y el eco de los tambores de guerra vikingos.' },
  { title: 'Machu Picchu Inca', folder: 'inca', diff: 'DIFÍCIL', desc: 'Ciudades en las nubes y templos dedicados al Inti.' },
  { title: 'Persépolis Persa', folder: 'persa', diff: 'DIFÍCIL', desc: 'El lujo de los inmortales y los jardines de Ciro.' },
  { title: 'Valle del Indo', folder: 'hindu', diff: 'DIFÍCIL', desc: 'Espiritualidad milenaria a orillas del río sagrado.' },
  { title: 'Nara Japonesa', folder: 'japonesa', diff: 'DIFÍCIL', desc: 'Santuarios Shinto y el honor de los primeros samuráis.' },
  { title: 'Tierras Celtas', folder: 'celtica', diff: 'DIFÍCIL', desc: 'Dólmenes misteriosos y el susurro de los druidas.' },
  { title: 'Puertos Fenicios', folder: 'fenicia', diff: 'DIFÍCIL', desc: 'Maestros del mar y el comercio de la púrpura de Tiro.' },
  { title: 'Jardines de Babilonia', folder: 'babilonia', diff: 'DIFÍCIL', desc: 'Una de las maravillas del mundo antiguo en Mesopotamia.' },
  { title: 'Abismo Atlante', folder: 'atlante', diff: 'DIFÍCIL', desc: 'La mítica civilización sumergida antes del gran cataclismo.' }
];

export const ABLIA_CHAPTERS: Chapter[] = ABLIA_CIVILIZATIONS.map((c, i) => ({
  id: `ABLIA_CHAPTER_${(i + 1).toString().padStart(2, '0')}`,
  mode: 'ABLIA',
  title: `${c.title} (Ablia)`,
  folder: c.folder,
  difficulty: c.diff as any,
  description: c.desc,
  unlocked: i < 12,
  music: `ablia_bgm_${i + 1}`,
  objects: [], obstacles: [], objectives: [], winConditions: [], rules: [], stages: []
}));

// Agrupamos todos por conveniencia de búsqueda, pero respetamos la separación pedida por el motor
export const ALL_CHAPTERS: Chapter[] = [...STORY_CHAPTERS, ...ARCADE_CHAPTERS, ...ABLIA_CHAPTERS];
// Export for fast migration compatible lookup.
export const CHAPTERS: Chapter[] = ALL_CHAPTERS;
