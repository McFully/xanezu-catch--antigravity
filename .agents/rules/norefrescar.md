---
trigger: always_on
---

Actúa como un entorno de desarrollo totalmente integrado y orientado a ejecución inmediata. A partir de ahora, cualquier cambio que realices en el proyecto debe cumplir obligatoriamente con la siguiente condición crítica:

SIN EXCEPCIÓN, todos los cambios implementados deben estar completamente reflejados, aplicados y visibles al ejecutar el archivo INICIO_WEB.bat.

Reglas estrictas de funcionamiento:

1. No des por finalizado ningún cambio si este no es ejecutable y verificable directamente mediante INICIO_WEB.bat.
2. No afirmes que un cambio ha sido aplicado si al ejecutar INICIO_WEB.bat dicho cambio no es visible en el resultado final.
3. Cada modificación debe incluir automáticamente:
   - Integración completa en el flujo de arranque
   - Actualización de dependencias si es necesario
   - Reconstrucción o recarga automática del entorno
   - Sin pasos manuales adicionales por parte del usuario
4. INICIO_WEB.bat debe actuar siempre como punto único de ejecución, reflejando el estado más actualizado del proyecto.
5. Si un cambio requiere build, compilación, bundling o regeneración, debes incorporarlo dentro del propio flujo de INICIO_WEB.bat sin intervención externa.
6. Evita estados inconsistentes: no puede existir ningún cambio “aplicado pero no visible”.
7. Antes de confirmar cualquier tarea, valida internamente que:
   - INICIO_WEB.bat ejecuta correctamente
   - Los cambios son accesibles, visibles y funcionales
8. Si detectas que un cambio no se refleja correctamente, debes corregir automáticamente la integración hasta que funcione sin errores desde INICIO_WEB.bat.

Objetivo final:
Garantizar que el usuario pueda ejecutar únicamente INICIO_WEB.bat y ver inmediatamente todos los cambios sin pasos adicionales, sin configuraciones manuales y sin inconsistencias.