export interface AbliaThemePalette {
  sky: string[];
  structureFar: string;
  structureMid: string;
  accent: string;
  stroke: string;
}

export const ABLIA_WEATHER_MAP: Record<string, string> = {
  nordica: 'snow',
  nordico: 'snow',
  japonesa: 'sakura',
  egipto: 'sand',
  grecia: 'rain',
  sumeria: 'sand',
  azteca: 'rain',
  maya: 'rain',
  celtica: 'snow',
  atlante: 'clear',
  default: 'clear'
};

export const ABLIA_THEMES: Record<string, AbliaThemePalette> = {
  maya: { sky: ['#0a2f0a', '#1a4d1a', '#2a6b2a'], structureFar: '#051a05', structureMid: '#0d3d1a', accent: '#A6F616', stroke: '#000' },
  azteca: { sky: ['#1a2f0a', '#2a4d0a', '#3a6b0a'], structureFar: '#0d1a05', structureMid: '#1a3d0d', accent: '#FFD700', stroke: '#000' },
  egipto: { sky: ['#2f1a0a', '#4d2a1a', '#6b3d2a'], structureFar: '#1a0d05', structureMid: '#3d1a0d', accent: '#FFD700', stroke: '#2b1000' },
  sumeria: { sky: ['#3d2a1a', '#5a3d2a', '#7a4d3a'], structureFar: '#1d1a0d', structureMid: '#3d2a1a', accent: '#FF8C00', stroke: '#2b1000' },
  grecia: { sky: ['#0a1a2f', '#1a2a4d', '#2a4d6b'], structureFar: '#050a1a', structureMid: '#0d1a3d', accent: '#00f2ff', stroke: '#001a33' },
  roma: { sky: ['#2a0a0a', '#4d1a1a', '#6b2a2a'], structureFar: '#1a0505', structureMid: '#3d0d0d', accent: '#ff0000', stroke: '#2b0000' },
  china: { sky: ['#2f2f0a', '#4d4d1a', '#6b6b2a'], structureFar: '#1a1a05', structureMid: '#3d3d0d', accent: '#FF4500', stroke: '#330000' },
  nordica: { sky: ['#050510', '#101020', '#1a1a30'], structureFar: '#000005', structureMid: '#05051a', accent: '#00ffff', stroke: '#000' },
  nordico: { sky: ['#050510', '#101020', '#1a1a30'], structureFar: '#000005', structureMid: '#05051a', accent: '#00ffff', stroke: '#000' },
  inca: { sky: ['#1a1a0a', '#2a2a0a', '#3a3a0a'], structureFar: '#0d0d05', structureMid: '#1a1a0d', accent: '#FFFF00', stroke: '#000' },
  persa: { sky: ['#2a0a2f', '#4d1a4d', '#6b2a6b'], structureFar: '#1a051a', structureMid: '#3d0d3d', accent: '#FF00FF', stroke: '#2b002b' },
  hindu: { sky: ['#2f1a2f', '#4d2a4d', '#6b3d6b'], structureFar: '#1a0d1a', structureMid: '#3d1a3d', accent: '#FFA500', stroke: '#2b102b' },
  japonesa: { sky: ['#2f0a0a', '#4d1a1a', '#6b2a2a'], structureFar: '#1a0505', structureMid: '#3d0d0d', accent: '#ff4d4d', stroke: '#2b0000' },
  celtica: { sky: ['#0a2f2f', '#1a4d4d', '#2a6b6b'], structureFar: '#051a1a', structureMid: '#0d3d3d', accent: '#00FF7F', stroke: '#002b2b' },
  fenicia: { sky: ['#0a0a2f', '#1a1a4d', '#2a2a6b'], structureFar: '#05051a', structureMid: '#0d0d3d', accent: '#9370DB', stroke: '#1a0033' },
  babilonia: { sky: ['#0a0a2f', '#1a1a4d', '#2a2a6b'], structureFar: '#05051a', structureMid: '#0d0d3d', accent: '#87CEEB', stroke: '#000033' },
  atlante: { sky: ['#000033', '#000066', '#000099'], structureFar: '#00001a', structureMid: '#000033', accent: '#00FFFF', stroke: '#00001a' },
  default: { sky: ['#111', '#222', '#333'], structureFar: '#000', structureMid: '#111', accent: '#FFF', stroke: '#000' }
};

export function getAbliaTheme(civilization: string): AbliaThemePalette {
  return ABLIA_THEMES[civilization.toLowerCase()] || ABLIA_THEMES['default'];
}
