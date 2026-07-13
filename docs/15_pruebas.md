# Estrategia de Pruebas

Para garantizar que el motor físico y la lógica de puntuación funcionen correctamente antes de cada compilación, se cuenta con una suite de pruebas estructurada.

## Pruebas de Lógica de Juego
Las pruebas unitarias están diseñadas para validar:
- La correcta actualización del XP del jugador basándose en la tabla de progresión.
- La lógica de subida de nivel (de 0 a nivel 30).
- La validación del sistema de combos y el reinicio de multiplicadores al expirar el tiempo de 30 segundos.

## Ejecución de Pruebas
Puedes correr la suite de pruebas unitarias ejecutando:
```bash
npm run test
```
Esta prueba ejecuta `tests/logic.test.mjs` que valida la consistencia algorítmica de los servicios principales sin requerir renderizado visual.\n