const fs = require('fs');
const path = require('path');

const replacements = [
    [/Ã¡/g, 'á'], [/Ã©/g, 'é'], [/Ã­/g, 'í'], [/Ã³/g, 'ó'], [/Ãº/g, 'ú'],
    [/Ã±/g, 'ñ'], [/Ã¡/g, 'á'], [/Ã³/g, 'ó'], [/Ã­/g, 'í'], [/Ã±/g, 'ñ'],
    [/Ã“/g, 'Ó'], [/Ã‰/g, 'É'], [/Ã /g, 'Á'], [/Ãš/g, 'Ú'], [/Ã‘/g, 'Ñ'],
    [/Ã‚Â¡/g, '¡'], [/Ã‚Â¿/g, '¿'],
    [/ÃƒÆ’Ã‚Â³/g, 'ó'], [/ÃƒÆ’Ã‚Â­/g, 'í'], [/ÃƒÆ’Ã‚Â±/g, 'ñ'], [/ÃƒÆ’Ã‚Â¡/g, 'á'],
    [/ÃƒÂ¢Ã¢â‚¬Â¢/g, '•'], [/ÃƒÂ¢Ã¢â‚¬Â Ã¢â€€Â¬/g, '←'],
    [/Ãƒâ€šÃ‚Â¡/g, '¡'], [/ÃƒÂ°Ã…Â¸Ã¢â‚¬Â Ã¢â‚¬â„¢/g, '🔄'],
    [/âœ”/g, '✔'], [/â Œ/g, '❌'], [/ðŸš€/g, '🚀'], [/ðŸ”Š/g, '🔊'], [/ðŸŽ®/g, '🎮'],
    [/Ã³/g, 'ó'], [/Ã­/g, 'í'], [/Ã¡/g, 'á'], [/Ã±/g, 'ñ'], [/Ãº/g, 'ú'],
    [/Ã¦/g, 'æ'], // A veces aparece para 'é' en ciertas corrupciones
    [/sÃ³lo/g, 'sólo'], [/mÃºsica/g, 'música'], [/configuraciÃ³n/g, 'configuración'],
    [/diseÃ±o/g, 'diseño'], [/capÃ­tulo/g, 'capítulo'], [/selecciÃ³n/g, 'selección'],
    [/optimizaciÃ³n/g, 'optimización'], [/grÃ¡ficas/g, 'gráficas'], [/menÃº/g, 'menú']
];

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;
    
    replacements.forEach(([regex, replacement]) => {
        content = content.replace(regex, replacement);
    });
    
    if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`[FIXED] ${filePath}`);
    }
}

function walkDir(dir) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            walkDir(filePath);
        } else if (filePath.endsWith('.js') || filePath.endsWith('.html') || filePath.endsWith('.css')) {
            processFile(filePath);
        }
    });
}

const targetDir = process.argv[2] || './js';
console.log(`Iniciando limpieza de codificación en: ${targetDir}`);
walkDir(targetDir);
console.log('Limpieza completada.');
