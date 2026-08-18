# Assets: Campaign Mode

Recursos específicos para el modo historia "Campaign". Organizados por capítulos numerados.

## Estructura de Capítulos

Cada carpeta de capítulo debe seguir el formato: `NUMERO-nombre-del-bioma`.

### Estándar de Contenido por Capítulo

- `audios/`: Banda sonora temática (preferiblemente `.ogg`).
- `fondos/`: Subdividido por `nivel_N` con 4 capas de parallax (`fondo_lejano`, `fondo_intermedio`, `fondo_proximo`, `decoraciones`).
- `objetos/`: SVGs específicos del bioma.
- `obstaculos/`: SVGs y WebP de peligros ambientales.
- `personaje/`: Sprites de la rana con la skin temática del capítulo.

## Reglas

- NO renombrar las carpetas existentes ya que el `ChapterRegistry.js` depende de estos nombres.
- Mantener la resolución estándar de 1920x1080 para fondos.
