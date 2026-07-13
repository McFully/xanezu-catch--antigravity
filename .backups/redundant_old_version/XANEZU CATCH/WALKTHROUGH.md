# Guía de Creación y Workflow AAA (Walkthrough)

## 0. Verificación General

Asegúrate de ejecutar desde `c:/Users/Aritz/Desktop/Proyectos Antigravity/Ver1.5-Xanezu Games/` en PowerShell como Administrador. Los archivos base de la Lógica del Motor (`Game.js`, `AssetLoader.js`) deben estar alineados con los nuevos activos nombrados `obs_bot_l01`, `obs_top_l01`, a diferencia de solo un recurso universal viejo. Ya existe esta lógica habilitada por la corrección gráfica del Capítulo 2.

## 1. Módulo "Construcción de Obstáculos Supremos"

El viejo script `generate_level_obs.ps1` se considerará arcaico y reemplazable.

### Pasos

1. Copiar mentalmente la estructura del `generate_desert_obs.ps1` usando cajas (`W=100`, `H=100`) para colisiones perfectas.
2. Elaborar bucles anidados por capítulo, recorriendo un array gigantesco de texturas CSS-in-SVG (`sandTex`, `woodTex`, `iceTex`, `metalGlow`).
3. Crear condiciones lógicas por `$chapter_dir` para dividir la generación de arte Top y Arte Bottom en los 6 grados de dificultad, resultando en `12` gráficos vectoriales por escenario (Multiplicado por 8 = 96 trampas 100% únicas).
4. Ejecutar el PowerShell general sobrescribiendo cualquier trampa poligonal simple anterior.

## 2. Renovación Joyera (Items Premium)

El juego actual (específicamente la interfaz y la recolección en escena) requiere reflejos y estética gacha atractiva. Se hará abandonando polígonos mate.

### Pasos

1. Reemplazar iteración vieja (`generate_chars_items.ps1`).
2. Rediseñar Banana, Moneda y Monedas Voladoras para la economía con biseles dobles concéntricos (oro central iluminado, bisel naranja dorado oscuro).
3. Escribir gradientes de cristal `radialGradient` que de blanco (#FFF) pasan a semi-sólido teñido para Gemas (Rubí `#e91e63`, Esmeralda `#00e676`).
4. Reemplazar y lanzar el Powershell de carga. Testear recolección si la Hitbox concuerda visualmente sin cortes (usar `x=1` y `y=1` a `x=98`, `y=98`).

## 3. Integración Motor de Interfaz y UI Fluida

Xanezu es un arcade, por ende, el flujo rápido entre morir, ver score y recomenzar es imperativo.

### Pasos

1. Entrar en `index.css` o equivalente global. Desechar estilización de bloques opacos o grisáceos.
2. Inyectar variables nativas de Neumorphism o Glassmorphism (`backdrop-filter: blur(14px)`, `background: rgba(255, 255, 255, 0.15)`).
3. Animar botones de hover (escala CSS `@keyframes` con curva de Bézier suave).
4. El Texto del Score en Canvas: Usar fuentes Impact o Inter de Google, alineación central, pero reescribiendo la rutina `drawHUD()` para añadir triple Stroke (contorno de grosor variable imitando a Mario u otros plataformas clásicos).

## 4. Ajustes Prácticos

Tras regenerar decenas de activos, comprobar recarga en el navegador local. Realizar pruebas saltando conscientemente encima (Colisiones de arriba/abajo) de un obstáculo top frente a uno bot: asegurar que no maten "por aire místico invisible" debido a desalineación, validada ya por `preserveAspectRatio="none"` pero confirmada visualmente.
Refinar volumen o pitch variable del sintetizador de salto si resultase monótono mediante el parámetro `BaseFreq`.
