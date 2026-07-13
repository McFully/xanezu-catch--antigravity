# Stack Tecnológico

El proyecto está construido utilizando herramientas y frameworks modernos que garantizan el rendimiento y la portabilidad:

1. **Angular 21**:
   - **Razón**: Permite construir interfaces web modulares, reactivas y fuertemente tipadas mediante componentes y Signals. Simplifica la gestión de rutas y estados complejos.
2. **TypeScript**:
   - **Razón**: Aporta tipado estático, previniendo errores en tiempo de compilación tanto para la lógica del framework como para el motor de físicas de juego.
3. **HTML5 Canvas (2D Context)**:
   - **Razón**: Proporciona un lienzo de dibujo de bajo nivel ideal para el gameplay a 60 FPS sin la sobrecarga del árbol DOM de los navegadores.
4. **Electron (v34+)**:
   - **Razón**: Permite empaquetar el juego web como una aplicación de escritorio nativa para Windows con acceso al sistema de archivos local y controles de ventana nativos.
5. **Web Audio API**:
   - **Razón**: Utilizada para la síntesis de sonido en tiempo real (`MusicSynth`), reduciendo el tamaño del paquete al no requerir archivos MP3/WAV pesados y permitiendo modular el audio según el estado del gameplay.
6. **Electron-Builder & Inno Setup**:
   - **Razón**: Automatizan la compilación y la empaquetadura en instaladores profesionales autoejecutables (.exe) para Windows.\n