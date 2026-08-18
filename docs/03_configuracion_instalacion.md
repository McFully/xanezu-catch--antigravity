# Configuración e Instalación

Sigue estos pasos para preparar el entorno de desarrollo y ejecutar o compilar el proyecto.

## Requisitos Previos
- **Node.js** v18.x o superior.
- **npm** (incluido con Node.js).

## Instalación de Dependencias
Ejecuta el siguiente comando en la raíz del proyecto para instalar las dependencias necesarias:
```bash
npm install
```

## Comandos de Ejecución

### Ejecución en Modo Web (Desarrollo)
Inicia el servidor de desarrollo de Angular en el puerto 3000 con recarga automática:
```bash
npm run ng:start
```
Abre tu navegador en [http://localhost:3000](http://localhost:3000).

### Ejecución en Modo Desktop (Electron)
Para iniciar el juego en la ventana nativa de Electron:
```bash
npm start
```

### Scripts Automatizados (Windows)
- `INICIO_WEB.bat`: Compila y lanza la versión web local.
- `INICIO_DESKTOP.bat`: Lanza la aplicación nativa a través de Electron en modo de desarrollo.
- `MODO_DESARROLLADOR.bat`: Inicia el entorno con herramientas y configuraciones de depuración activas.

## Compilación y Empaquetado
Para generar el ejecutable e instalador de Windows:
```bash
npm run build
```
El instalador generado se ubicará en la carpeta `dist/` con el nombre `Xanezu_Catch_Setup_v1.8.0.exe`.\n