import { Injectable } from '@angular/core';

export interface GameItem {
  id: string;
  name: string;
  icon: string;
  category: 'REWARD' | 'GEM' | 'POWERUP' | 'ARTIFACT' | 'UPGRADE' | 'CONSUMABLE';
  description?: string;
  price?: number;
  owned?: boolean;
}

export interface Skin {
  id: string;
  name: string;
  color: string;
  emoji: string;
  unlocked: boolean;
  price?: number;
}

export interface LastGameStats {
  score: number;
  time: string;
  level: number;
  maxMultiplier: number;
  xp: number;
  coinsEarned: number;
  gemsEarned: number;
  itemsBySprite: { [key: string]: number };
}

@Injectable({
  providedIn: 'root'
})
export class GameDataService {
  public rewards: GameItem[] = [
    { id: 'banana', name: 'Banana', icon: '🍌', category: 'REWARD' },
    { id: 'candy', name: 'Caramelo', icon: '🍬', category: 'REWARD' },
    { id: 'star', name: 'Estrella', icon: '⭐', category: 'REWARD' },
    { id: 'apple', name: 'Manzana', icon: '🍎', category: 'REWARD' },
    { id: 'grape', name: 'Uva', icon: '🍇', category: 'REWARD' },
    { id: 'cherry', name: 'Cereza', icon: '🍒', category: 'REWARD' },
    { id: 'watermelon', name: 'Sandía', icon: '🍉', category: 'REWARD' },
    { id: 'pineapple', name: 'Piña', icon: '🍍', category: 'REWARD' },
    { id: 'mango', name: 'Mango', icon: '🥭', category: 'REWARD' },
    { id: 'kiwi', name: 'Kiwi', icon: '🥝', category: 'REWARD' },
    { id: 'blueberry', name: 'Arándano', icon: '🫐', category: 'REWARD' }
  ];

  public gems: GameItem[] = [
    { id: 'sapphire', name: 'Zafiro', icon: '💎', category: 'GEM' },
    { id: 'diamond', name: 'Diamante', icon: '💍', category: 'GEM' },
    { id: 'emerald', name: 'Esmeralda', icon: '🔱', category: 'GEM' },
    { id: 'ruby', name: 'Rubí', icon: '💖', category: 'GEM' },
    { id: 'topaz', name: 'Topacio', icon: '🧡', category: 'GEM' },
    { id: 'amber', name: 'Ámbar', icon: '💛', category: 'GEM' },
    { id: 'peridot', name: 'Peridoto', icon: '💚', category: 'GEM' },
    { id: 'aquamarine', name: 'Aguamarina', icon: '💙', category: 'GEM' },
    { id: 'amethyst', name: 'Amatista', icon: '💜', category: 'GEM' }
  ];

  public powerups: GameItem[] = [
    { id: 'shield', name: 'Escudo', icon: '🛡️', category: 'POWERUP', description: 'Protección temporal' },
    { id: 'magnet', name: 'Imán', icon: '🧲', category: 'POWERUP', description: 'Atrae coleccionables' },
    { id: 'speed', name: 'Velocidad', icon: '⚡', category: 'POWERUP', description: 'Aumento de ritmo' },
    { id: 'energy', name: 'Energía', icon: '🔋', category: 'POWERUP', description: 'Recupera estamina' },
    { id: 'fire', name: 'Fuego', icon: '🔥', category: 'POWERUP', description: 'Destruye obstáculos' },
    { id: 'ice', name: 'Hielo', icon: '❄️', category: 'POWERUP', description: 'Ralentiza el mundo' }
  ];

  public artifacts: GameItem[] = [
    { id: 'vase', name: 'Vasija Antigua', icon: '🏺', category: 'ARTIFACT' },
    { id: 'scroll', name: 'Pergamino Sacro', icon: '📜', category: 'ARTIFACT' },
    { id: 'totem', name: 'Tótem Ancestral', icon: '🗿', category: 'ARTIFACT' },
    { id: 'key', name: 'Llave del Reino', icon: '🗝️', category: 'ARTIFACT' },
    { id: 'crown', name: 'Corona Perdida', icon: '👑', category: 'ARTIFACT' },
    { id: 'aegis', name: 'Égida Legendaria', icon: '🛡️', category: 'ARTIFACT' }
  ];

  public shopItems: GameItem[] = [
    { id: 'shield_up', name: 'Escudo Reforzado', description: 'Inicia cada partida con un escudo protector activo.', price: 500, icon: '🛡️', category: 'UPGRADE' },
    { id: 'magnet_up', name: 'Súper Imán', description: 'Activa atracción magnética permanente de coleccionables.', price: 750, icon: '🧲', category: 'UPGRADE' },
    { id: 'gem_finder', name: 'Radar de Gemas', description: 'Duplica la frecuencia de aparición de gemas raras.', price: 1200, icon: '💎', category: 'UPGRADE' },
    { id: 'speed_boost', name: 'Turbo Propulsor', description: 'Aumenta la agilidad de salto y bonificación de velocidad.', price: 1000, icon: '🚀', category: 'POWERUP' },
    { id: 'revive', name: 'Pack de Reanimación', description: 'Otorga +1 vida adicional al iniciar o continuar partida.', price: 200, icon: '💉', category: 'CONSUMABLE' }
  ];

  public skins: Skin[] = [
    { id: 'frog_og', name: 'Original Frog', color: '#A6F616', emoji: '🐸', unlocked: true },
    { id: 'frog_cyber', name: 'Cyber Neon', color: '#00f2ff', emoji: '🤖', unlocked: false, price: 1000 },
    { id: 'frog_fire', name: 'Inferno Frog', color: '#FF4D4D', emoji: '🔥', unlocked: false, price: 1500 },
    { id: 'frog_ninja', name: 'Shadow Ninja', color: '#ffffff', emoji: '🥷', unlocked: false, price: 2000 },
    { id: 'frog_alien', name: 'Zanezu Invader', color: '#FF00FF', emoji: '👽', unlocked: false, price: 3000 },
    { id: 'frog_king', name: 'Royal Majesty', color: '#FFD700', emoji: '👑', unlocked: false, price: 5000 }
  ];

  public tips: string[] = [
    'TIP: Explora todos los caminos para encontrar secretos.',
    'TIP: Algunos obstáculos se pueden evitar saltando en el momento justo.',
    'TIP: Recoge 5 bananas para detonar todos los obstáculos en pantalla.',
    'TIP: El imán es vital para conseguir gemas lejanas.',
    'TIP: Visita la tienda Xanezu para equipar mejoras permanentes.'
  ];

  public lastGameStats: LastGameStats = {
    score: 0,
    time: '00:00',
    level: 0,
    maxMultiplier: 1,
    xp: 0,
    coinsEarned: 0,
    gemsEarned: 0,
    itemsBySprite: {}
  };

  getRandomTip(): string {
    return this.tips[Math.floor(Math.random() * this.tips.length)];
  }
}
