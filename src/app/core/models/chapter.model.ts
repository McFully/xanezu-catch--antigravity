export interface Chapter {
  id: string;
  mode: 'STORY' | 'ARCADE' | 'ABLIA';
  title: string;
  folder: string;
  difficulty: 'FÁCIL' | 'NORMAL' | 'DIFÍCIL';
  description: string;
  unlocked: boolean;
  
  // Archivos/Lógica específica de modo (opcional por ahora para escalabilidad)
  music?: string;
  objects?: any[];
  obstacles?: any[];
  objectives?: any[];
  winConditions?: any[];
  rules?: any[];
  stages?: any[];
}
