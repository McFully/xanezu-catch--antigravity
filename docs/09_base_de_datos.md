# Base de Datos y Persistencia

El almacenamiento de información de progreso y configuraciones del jugador se realiza de forma local y persistente.

## Sistema de Persistencia: LocalStorage

Los datos se serializan y guardan bajo una clave estructurada de almacenamiento web local:

- **Estructura de Datos Guardada**:
  - `xp`: Puntos de experiencia totales del jugador (utilizados en la curva de progresión).
  - `level`: Nivel de perfil alcanzado (1 al 30).
  - `gems`: Cantidad de gemas disponibles para comprar skins o mejoras.
  - `unlockedChapters`: Lista de identificadores de capítulos desbloqueados en los modos Historia, Arcade y Ablia.
  - `purchasedSkins`: Colección de skins compradas en la tienda.
  - `currentSkin`: La apariencia seleccionada y activa para el personaje jugador.
  - `settings`: Configuración de volumen de música, efectos de sonido y estado de habilitación de audio.

Esta estructura se actualiza en tiempo real al finalizar un nivel, comprar una skin en la tienda o cambiar las configuraciones de volumen en el menú de opciones.\n