# Plan de Rediseño Artístico Antigravity - Fase 1 (CORREGIDO)

## Estado Actual de la Tarea

- [x] **Limpieza y Centralización de Assets:** Carpetas antiguas eliminadas, SFX centralizados en `assets/audio/sfx` y música organizada por capítulos.
- [x] **Expansión Estructural:** 10 niveles por capítulo preparados con guías de prompts (`PROMPTS.md`).
- [x] **Corrección de Rutas:** Se han movido los assets a las carpetas originales (`1-selva-tropical`, `2-desierto-dorado`, etc.) manteniendo la coherencia con el `CHAPTER_REGISTRY`.
- [x] **Parallax Vertical Dinámico:** Implementado sistema de inclinación pseudo-3D en `BiomeRenderer.js` que reacciona a la altura del jugador.
- [x] **Iluminación Atmosférica AAA:** Añadido sistema de "Bloom/Glow" dinámico basado en la paleta de colores del capítulo para mayor cohesión visual.
- [x] **Generación de Assets 4K:** Nivel 1 (Selva) completado y cargado.
- [!] **Nota:** Cuota de generación de imágenes pausada temporalmente.

### Estado de la Implementación AAA (Marzo 2026)

- [x] Motor de Parallax Multi-Capa (Far, Mid, Near, Deco).
- [x] Iluminación Atmosférica Dinámica por Capítulo.
- [x] AssetLoader robusto con fallbacks WebP -> PNG -> SVG.
- [ ] Generación de Assets de Nivel 2+ (PAUSADO por cuota exhausted).
- [ ] Obstáculos con Parallax (En desarrollo).

**NOTA:** El sistema del Gorila Bruno y sus mecánicas asociadas han sido eliminadas por completo del motor por petición del usuario (07-03-2026). El combo de 5 bananas queda pendiente de una nueva implementación futura.

## Estructura de Directorios Final

```text
assets/
├── audio/
│   └── sfx/ (Efectos globales: hit, collect, etc.)
├── menu/ (Assets de la interfaz principal)
└── 1-selva-tropical/ (y capítulos 2-8)
    ├── audios/
    │   └── 1-selva-tropical.mp3 (Música única del capítulo)
    ├── fondos/
    │   └── nivel_1...10/
    │       ├── fondo_lejano.png
    │       ├── fondo_intermedio.png
    │       ├── primer_plano.png
    │       ├── decoraciones.png
    │       ├── efectos/
    │       │   └── bruma.png
    │       └── PROMPTS.md (Guía de generación específica)
    ├── objetos/
    └── obstaculos/
```

## Próximos Pasos: Obstáculos y Detalle

1. **Tematización por Capítulos:**
    - [x] **Capítulo 2 (Desierto Dorado):** Serpientes (arriba), Pilares (abajo), Escorpiones (móvil). Gates desactivadas.
    - [x] **Capítulo 3 (Japón Feudal):** Máscaras Oni Rojas (arriba), Azules (abajo), Mixtas (móvil). Gates desactivadas.
    - [x] **Capítulo 4 (Bosque Encantado):** Lianas con runas (arriba), Cristales flotantes (abajo), Hadas malvadas/Pixies (móvil). Gates desactivadas.
    - [x] **Capítulo 5 (Pantano Maldito):** Raíces con fango (arriba), Pozos de lodo burbujeante (abajo), Fantasmas del fango (móvil). Gates desactivadas.
    - [x] **Capítulo 6 (Fábrica de Juguetes):** Soldaditos de plomo colgantes (arriba), Soldaditos de pie (abajo), Robots de cuerda (móvil). Gates desactivadas.
    - [x] **Capítulo 7 (Fiesta Mexicana):** Piñatas de burro colgantes (arriba), Cactus con sombrero y bigote (abajo), Máscaras de luchador (móvil). Gates desactivadas.
    - [x] **Capítulo 8 (Reino Glacial):** Carámbanos de cristal (arriba), Pinchos de hielo (abajo), Pingüinos en trineo (móvil). Gates desactivadas.

## Implementar Sprites con volumen para Personaje Arcade | ![Medium](https://img.shields.io/badge/-Medium-blue) | ✅ VFX Aura OK |

---

### 🏛️ Hito: Reorganización Arquitectónica (Marzo 2026)

Se ha migrado el 100% de los activos a una estructura de 4 pilares:

- `assets/menu/`: UI y Globales.
- `assets/campaign/`: Capítulos 1-16 originales.
- `assets/arcade/`: Estructura para 12 capítulos 8-bit.
- `assets/ABL_IA/`: Estructura para 16 capítulos IA.

**Resultado**: Código desacoplado, rutas normalizadas y documentación técnica integrada.

---

### 🕹️ Evolución Visual: Modo Arcade (8-bit Premium)

Se ha implementado el motor de renderizado retro procedural para los 12 capítulos, otorgando una identidad Triple-A nostálgica:

- [x] **Capítulo 1 (Jungla):** Montañas pixeladas, niebla volumétrica 8-bit y scanlines.
- [x] **Capítulo 2 (Desierto):** Dunas escalonadas, atardecer pixelado y arena cuadrada.
- [x] **Capítulo 3 (Zen Neon):** Lluvia de Sakura 8-bit y pagodas de bloques.
- [x] **Capítulo 4 (Cyber City):** Rascacielos con ventanas de píxel y grid de neón.
- [x] **Capitulo 5 (Espacio):** Planetas pixelados y nebulosas de ruido.
- [x] **Capitulo 6 (Laboratorio):** Tubos de ensayo con líquido brillante y rayos eléctricos.
- [x] **Capitulo 7 (Fortaleza):** Almenas de piedra oscura y antorchas de neón.
- [x] **Capitulo 8 (Mina Cristal):** Estalactitas angulares y cristales brillantes.
- [x] **Capitulo 9 (Carnaval):** Noria retro y luces de feria dinámicas.
- [x] **Capitulo 10 (Mundo Mágico):** Islas flotantes pixeladas y chispas de magia.
- [x] **Capitulo 11 (Volcán):** Ríos de lava 8-bit y lluvia de ceniza.
- [x] **Capitulo 12 (Omega Void):** Geometría abstracta y flujo de datos dorado.

---

## Implementación de Motor (Completado)

1. [x] **AssetLoader.js**: Actualizado para manejar múltiples capas de fondo (lejano, intermedio, próximo, decoraciones) con soporte de fallbacks WebP -> PNG -> SVG.
2. [x] **BiomeRenderer.js**: Implementado sistema de parallax multi-capa con iluminación atmosférica dinámica.
3. [x] **ChapterRegistry.js**: Centralización de configuraciones de biomas y colores.

## Prompts Preparados para Generación (Fase 2)

Debido a los límites de cuota de generación de imágenes, he preparado los prompts exactos para que puedas continuar el rediseño cuando desees. El motor ya está programado para cargar estos archivos automáticamente.

### Capítulo 1 - Nivel 2 (Atardecer de Tormenta)

- **Fondo Lejano:** `Rayman Legends style far background for a tropical jungle level at sunset during a storm. Dark orange, violet, and indigo sky with heavy, stylized storm clouds and distant silhouetted mountains. Faint flashes of lightning. 2D platformer aesthetic, painterly texture, 4K.`
- **Fondo Intermedio:** `Rayman Legends style intermediate background for a tropical jungle level in a storm. Wind-swept, dark green jungle canopy, swaying trees with large leaves, and rain curtains in the distance. Intense, dramatic lighting. 2D platformer aesthetic, painterly texture, semi-transparent gaps for parallax, 4K.`

### Capítulo 1 - Obstáculos y Objetos (Estilo Pintado)

- **Obstáculo:** `Rayman Legends style high-detail jungle obstacle. A giant prickly bramble vine with sharp, stylized thorns, glowing moss, and deep wood textures. Sharp detail, rich textures, bright highlights. 2D platformer aesthetic, painterly style, 4K, transparent background.`
- **Moneda/Ítem:** `Rayman Legends style golden coin collectible. A thick, stylized gold coin with a glowing sun icon, painterly metallic texture, and magical sparkles. 2D platformer aesthetic, 4K, transparent background.`

## Resumen Técnico del Motor

1. **Vertical Tilt:** El fondo ahora se inclina ligeramente cuando la rana salta, dando profundidad 3D.
2. **Atmospheric Glow:** Cada capítulo tiene un resplandor ambiental que unifica los colores de la escena.
3. **Smart Loading:** El juego busca archivos `.png` en las nuevas carpetas y los prefiere sobre los `.svg`.
