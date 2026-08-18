# Resumen General

**Xanezu Catch** es una experiencia arcade premium de alto rendimiento que combina tecnologías modernas de desarrollo web con un motor de renderizado personalizado en 2D basado en HTML5 Canvas.

## Propósito
El objetivo del proyecto es ofrecer un juego ágil, visualmente atractivo (estilo neón y retro-arcade futurista) con mecánicas clásicas de recolección y esquiva, pero potenciado por un motor de física propio, generación de audio por síntesis en tiempo real y una arquitectura moderna e híbrida que separa la interfaz (DOM) de la lógica y renderizado del juego (Canvas).

## Problema que Resuelve
1. **Rendimiento e Interactividad en Web/Desktop**: Separar completamente la interfaz basada en menús complejos del renderizado de alta tasa de refresco (60 FPS) del gameplay, evitando la sobrecarga del DOM tradicional para renderizar cientos de entidades.
2. **Experiencia Desktop y Web Unificada**: Integración con Electron para distribución de instaladores nativos de Windows, manteniendo la capacidad de ejecutarse en navegadores web sin cambios de código.
3. **Persistencia y Progresión Profunda**: Proporciona un sistema de progresión robusto que desbloquea capítulos, skins y recompensas mediante XP y gemas, motivando al usuario a continuar jugando.\n