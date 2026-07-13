# Plan de Implementación: Puntos Pendientes (Qué Falta)

## Fases y Pasos Técnicos

### Fase 1: Actualización del Motor (Engine Core)

- [x] **Modificar `AssetLoader.js`**: Implementar la lógica para detectar y cargar múltiples capas `.png` (`fondo_lejano.png`, `fondo_intermedio.png`, `primer_plano.png`, `decoraciones.png` y `efectos/bruma.png`) en las nuevas carpetas por capítulo (ej. `1-selva-tropical`), dándole prioridad sobre los archivos `.svg`.
- [x] **Modificar `BiomeRenderer.js`**: Actualizar el pipeline de renderizado del fondo. Pasar de un solo fondo SVG a un sistema de múltiples capas 4K con parallax profundo (diferentes velocidades para cada capa para simular 3D).

### Fase 2: Control de Calidad y Ajustes de Gameplay

- [x] **Control de Colisiones**: Asegurar que las hitboxes concuerdan con los nuevos obstáculos AAA visuales (tanto obstáculos superiores como inferiores y monedas gacha premium).
- [x] **Interfaz Fluida y HUD**: Asegurar que la implementación del texto "triple stroke" y los estilos Neumorphism/Glassmorphism en `index.css` y `drawHUD()` están correctos y se ven de acuerdo con el estilo AAA buscado.
- [x] **Skins Globales de Objetos**: Implementar lógica para que los assets de `1-selva-tropical/objetos` sean el estándar premium en todos los niveles.

### Fase 3: Reiniciar Cuota de Generación de Assets (Suspendida Temporalmente)

- [x] Retomar la ejecución de los prompts 4K alojados en `REDISEÑO_ARTISTICO.md` y `PROMPTS.md` para el Capítulo 1, Nivel 2 y 3.
- [!] **Nota**: Cuota de generación IA agotada para el Nivel 4. Motor preparado para cargar assets 4K automáticamente cuando estén disponibles.
