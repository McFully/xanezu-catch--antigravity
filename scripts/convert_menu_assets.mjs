import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const inputDir = 'assets/menu/fondo';
const files = [
  'ablia_chapter_select.png',
  'arcade_chapter_select.png',
  'story_chapter_select.png'
];

async function convert() {
  console.log('🚀 Iniciando conversión de fondos de menú...');
  
  for (const file of files) {
    const inputPath = path.join(inputDir, file);
    const outputPath = inputPath.replace('.png', '.webp');
    
    if (fs.existsSync(inputPath)) {
      try {
        await sharp(inputPath)
          .webp({ quality: 85 })
          .toFile(outputPath);
        
        const statsIn = fs.statSync(inputPath);
        const statsOut = fs.statSync(outputPath);
        
        console.log(`✅ Convertido: ${file} `);
        console.log(`   Dimensiones: ${statsIn.size} bytes -> ${statsOut.size} bytes`);
      } catch (err) {
        console.error(`❌ Error convirtiendo ${file}:`, err);
      }
    } else {
      console.warn(`⚠️ Archivo no encontrado: ${inputPath}`);
    }
  }
}

convert();
