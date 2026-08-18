# PROTOCOLO UNIVERSAL AGENTE XANEZU

Este documento establece el protocolo de comportamiento para el desarrollo de este proyecto.

## PRINCIPIOS FUNDAMENTALES (GEMINI.MD)

1. **Estabilidad absoluta**: El sistema debe arrancar siempre.
2. **Evolución segura**: Cambios iterativos y verificados.
3. **Reversibilidad**: Capacidad total de rollback ante fallos.
4. **Registro obligatorio**: Uso de logs para diagnóstico.
5. **Aislamiento de fallos**: Un fallo en un módulo no tumba el sistema.

## MODOS DE OPERACIÓN

- **Architect Mode**: Planificación y diseño.
- **Builder Mode**: Implementación segura en bloques (batches).
- **Debug Mode**: Diagnóstico y corrección quirúrgica.

## VERIFICACIÓN OBLIGATORIA
Tras cada cambio crítico, comprobar:
- Aplicación arranca.
- Interfaz visible.
- Sin errores fatales.
