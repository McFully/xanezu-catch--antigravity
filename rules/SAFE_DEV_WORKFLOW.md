# Flujo de Desarrollo Seguro (Safe Dev Workflow)

Este documento guía al agente en la aplicación de cambios de forma segura.

## Ciclo de Modificación
1. **Analizar**: Entender el impacto del cambio en el sistema de renderizado (Canvas).
2. **Backup**: Si el cambio es en un archivo núcleo (`Game.js`, `UIManager.js`), realizar copia en `backup/`.
3. **Modificar**: Aplicar cambios en bloques pequeños.
4. **Verificar**: Ejecutar `npm run test` (si existen) o iniciar el juego para validar el arranque.
5. **Confirmar**: Si la estabilidad es >= 100%, proceder al siguiente batch.

## Política de Rollback
Ante pantalla blanca, negra o errores fatales en consola:
- Detener implementación.
- Restaurar desde `backup/`.
- Documentar error en `logs/error.log`.
