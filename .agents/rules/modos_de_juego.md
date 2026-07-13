---
trigger: always_on
---

# Estándar de Modos de Juego y Capítulos

Este documento establece la organización interna obligatoria para la separación estricta entre los tres modos principales del juego. Esta estructura se aplica a nivel de lógica, persistencia, estados y nomenclatura.

## MODOS DE JUEGO

El juego está compuesto por tres modos completamente independientes:

1. **MODO HISTORIA**
2. **MODO ARCADE**
3. **MODO ABLIA**

Cada modo se gestiona como un sistema autónomo.

ESTRUCTURA DE CAPÍTULOS

Cada modo contiene exactamente 16 capítulos.

Modo Historia: 16 capítulos  
Modo Arcade: 16 capítulos  
Modo ABLIA: 16 capítulos  

Total absoluto del juego: 48 capítulos distintos.

Es obligatorio que el sistema interno trate estos 48 capítulos como entidades únicas y separadas. No se deben mezclar, reutilizar ni cruzar datos entre modos.

IDENTIFICACIÓN Y NOMENCLATURA

Todos los capítulos deben tener identificadores únicos que indiquen claramente a qué modo pertenecen.

Ejemplo de estructura recomendada:

HISTORIA  
STORY_CHAPTER_01  
STORY_CHAPTER_02  
...  
STORY_CHAPTER_16  

ARCADE  
ARCADE_CHAPTER_01  
ARCADE_CHAPTER_02  
...  
ARCADE_CHAPTER_16  

ABLIA  
ABLIA_CHAPTER_01  
ABLIA_CHAPTER_02  
...  
ABLIA_CHAPTER_16  

Esta nomenclatura debe aplicarse en:

- Estados del juego
- Rutas internas
- Gestión de escenas
- Sistema de progreso
- Carga de assets
- Base de datos interna
- Configuraciones de nivel
- Objetos de juego

ESTADO DE DESBLOQUEO (ARCADE)

En el modo Arcade debe existir un sistema de desbloqueo con el siguiente estado inicial:

12 capítulos desbloqueados  
4 capítulos bloqueados  

El sistema debe permitir gestionar el estado LOCKED / UNLOCKED de cada capítulo de forma independiente.

SEPARACIÓN DE ASSETS

Cada modo debe tener sus propios recursos independientes.

Modo Historia
- música
- objetos
- obstáculos
- reglas
- condiciones de victoria
- estructura narrativa
- mecánicas propias

Modo Arcade
- música específica
- objetos específicos
- obstáculos específicos
- reglas propias de arcade
- objetivos arcade
- lógica de puntuación

Modo ABLIA
- música propia
- objetos propios
- obstáculos propios
- reglas específicas del modo
- objetivos propios del modo

No se deben compartir configuraciones internas entre modos.

ESTRUCTURA DE DATOS

Debes crear o reorganizar las estructuras internas para que cada capítulo tenga su propia configuración independiente, incluyendo como mínimo:

- id del capítulo
- modo de juego
- nombre del capítulo
- estado de desbloqueo
- assets asociados
- música
- objetos
- obstáculos
- objetivos
- condiciones de victoria
- reglas específicas del modo
- posibles etapas internas del nivel

ESCALABILIDAD

La arquitectura debe quedar preparada para permitir en el futuro:

- cambiar objetos de un modo sin afectar a otros
- cambiar obstáculos
- modificar reglas
- cambiar objetivos
- añadir nuevas mecánicas por modo
- añadir etapas internas a cada capítulo
- modificar condiciones de victoria

Todo debe poder modificarse de forma independiente por modo y por capítulo.

REQUISITO FUNDAMENTAL

El sistema debe reconocer de forma inequívoca que existen:

16 capítulos del modo Historia  
16 capítulos del modo Arcade  
16 capítulos del modo ABLIA 

Total: 48 capítulos completamente distintos.

No debe existir ninguna ambigüedad ni mezcla entre modos.