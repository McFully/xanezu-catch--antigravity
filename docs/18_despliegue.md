# Guía de Despliegue

El proyecto se puede desplegar tanto en servidores web estáticos como distribuirse en instaladores de escritorio nativos.

## Despliegue Web
1. Compila el proyecto Angular en modo producción:
   ```bash
   npm run ng:build
   ```
2. Los archivos resultantes se encontrarán en `dist/xanezu-app/browser/`.
3. Sube este directorio a cualquier servicio de alojamiento estático (Vercel, Netlify, GitHub Pages, Firebase Hosting, etc.).

## Despliegue de Escritorio (Windows)
1. Para generar el instalador ejecutable de Windows, corre:
   ```bash
   npm run build
   ```
2. El script compilará la aplicación Angular, empaquetará los assets usando Electron y luego invocará a `electron-builder` para generar el archivo de instalación autoejecutable.
3. El instalador resultante estará disponible en la raíz en la carpeta `dist/`.\n