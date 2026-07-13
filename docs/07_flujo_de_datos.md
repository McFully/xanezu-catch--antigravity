# Flujo de Datos

El intercambio de información entre las capas Angular y el motor Canvas se mantiene desacoplado mediante el uso de servicios compartidos y patrones de mensajería asíncronos.

## Flujo de Datos del Gameplay

```
[Canvas (Gameplay)] 
       │
       ▼ (Eventos / Colisiones)
[GameEngine] 
       │
       ▼ (Actualiza Datos de Partida: Puntos, Vidas, Combos)
[GameDataService] (Guarda en localStorage / Memoria)
       │
       ▼ (Notifica cambios a través de Signals / RxJS)
[UI Components (Angular DOM HUD)]
```

1. **Inicialización**: Al seleccionar un nivel, `GameStateService` establece el capítulo activo. `AssetLoader` carga los datos de configuración del nivel y sus dependencias de imágenes.
2. **Gameplay Loop**: El motor Canvas lee entradas del teclado mediante eventos de escucha de ventana. Modifica las posiciones de las entidades y procesa colisiones.
3. **Actualización del Estado**: Al colisionar con una banana o chuche, el motor notifica al `GameDataService` y actualiza las puntuaciones, multiplicadores y grillas de combos correspondientes.
4. **Sincronización HUD**: Los componentes del HUD Angular, enlazados reactivamente a las señales del servicio de datos, actualizan instantáneamente sus barras de progreso, marcadores y ranuras de combo de manera visual sin necesidad de redibujar la UI en el canvas.
5. **Persistencia**: Al finalizar el nivel, las puntuaciones altas, gemas obtenidas y rangos desbloqueados se guardan localmente en el `localStorage` del dispositivo para que el progreso se mantenga al reiniciar la aplicación.\n