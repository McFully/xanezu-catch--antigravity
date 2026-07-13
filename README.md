# 🐸 XANEZU CATCH - Premium Arcade Experience

**Xanezu Catch** es un juego de arcade de alto rendimiento desarrollado con una arquitectura moderna que combina **Angular 21** para la interfaz y un motor de **Canvas nativo en TypeScript** para el gameplay. Ofrece una experiencia visual premium con efectos cinematográficos, un sistema de progresión profundo y una banda sonora sintetizada dinámicamente.

## 🌟 Características Principales

- **Arquitectura Híbrida**: UI gestionada por Angular (DOM) y gameplay renderizado en Canvas para máximo rendimiento.
- **Gráficos AAA**: Efectos de neón, biomas procedimentales, avisos de jefe con estilo glitch y micro-animaciones fluidas.
- **Sistema de Progresión**: Desbloquea capítulos, skins exclusivas y sube de rango recolectando XP y gemas.
- **Audio Sintetizado**: Música y efectos generados por síntesis web en tiempo real, adaptándose al bioma y nivel.
- **Modos de Juego**: 16 capítulos en modo Historia, 16 en Arcade y 16 en modo Habla (Total: 48 niveles únicos).

## 🎮 Controles

| Acción | Tecla |
| :--- | :--- |
| **Moverse** | Flechas `Izquierda` / `Derecha` |
| **Saltar** | Flecha `Arriba` o `Espacio` |
| **Pausa** | Tecla `P` o `Esc` |
| **Acción Especial** | Tecla `Z` |

---

## 🚀 Instalación y Desarrollo

### Requisitos
- **Node.js**: v18.x o superior.
- **Angular CLI**: v21.x (o npm run ng).
- **Electron**: Incluido en las dependencias.

### Ejecución en Desarrollo
```bash
# Iniciar con Electron (Recomendado)
npm start

# Iniciar servidor Angular (Browser mode)
npm run ng:start
```

### Generación de Instalador
```bash
# Generar el build completo e instalador
npm run build
```

---

## 🛠️ Tecnologías

- **Core**: Angular (v21+), TypeScript.
- **Engine**: Custom Canvas Engine en TS.
- **Estilos**: Vanilla CSS, Glassmorphism.
- **Entorno**: Electron.
- **Packaging**: Electron-Builder + Inno Setup.

## 📜 Licencia

Este proyecto está bajo la Licencia **ISC**. Consulta el archivo `LICENSE` para más detalles.

---
© 2026 **XANEZU GAMES** - *Captura el futuro.*
