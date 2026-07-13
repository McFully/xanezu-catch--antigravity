# Problemas Conocidos

A continuación se listan algunas limitaciones o problemas conocidos identificados en el sistema:

1. **Bloqueo Inicial de Audio en Navegadores**:
   - Los navegadores modernos prohíben la reproducción de audio sintético o archivos de música antes de que el usuario realice una interacción física (clic/toque). El juego maneja esto mostrando un aviso interactivo para desbloquear el audio limpiamente.
2. **Pérdida de Foco en Electron**:
   - Al cambiar de ventana en Windows (Alt+Tab), la música sintetizada puede pausarse abruptamente o acelerarse al reanudar el foco debido a cómo el navegador web y Electron gestionan los contadores de tiempo en segundo plano. Se recomienda pausar el juego antes de cambiar de ventana.
3. **Persistencia Compartida**:
   - Ejecutar la versión web y de escritorio en la misma máquina no comparte el progreso, dado que Electron posee su propio almacén de LocalStorage aislado del navegador web del usuario.\n