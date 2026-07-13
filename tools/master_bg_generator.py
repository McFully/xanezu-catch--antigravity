import os
import random
import math
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter

# ================================================================
# MASTER UNIFIED BACKGROUND GENERATOR v1.0
# Genera fondo_intermedio.webp para todos los niveles/capítulos
# Relación de aspecto 30:9 (3000x900)
# ================================================================

PROJECT_ROOT = Path(r"c:\Users\Aritz\Desktop\Proyectos Antigravity\XANEZU CATCH  ANTIGRAVITY 01-03-026")
ASSETS_DIR = PROJECT_ROOT / "assets"
WIDTH, HEIGHT = 3000, 900  # 30:9 Ratio

CHAPTER_CONFIGS = {
    1: {"dir": "1-selva-tropical", "theme": "jungle", "colors": [(20, 60, 20), (40, 100, 40), (80, 160, 80)]},
    2: {"dir": "2-desierto-dorado", "theme": "desert", "colors": [(180, 100, 40), (230, 180, 80), (255, 210, 120)]},
    3: {"dir": "3-japon-feudal", "theme": "japan", "colors": [(60, 20, 30), (140, 40, 60), (230, 160, 180)]},
    4: {"dir": "4-bosque-encantado", "theme": "enchanted", "colors": [(40, 20, 80), (100, 50, 180), (180, 120, 255)]},
    5: {"dir": "5-pantano-maldito", "theme": "swamp", "colors": [(20, 40, 20), (50, 80, 30), (100, 110, 40)]},
    6: {"dir": "6-fabrica-de-juguetes", "theme": "factory", "colors": [(30, 50, 80), (60, 100, 150), (180, 200, 50)]},
    7: {"dir": "7-fiesta-mexicana", "theme": "mexico", "colors": [(80, 10, 20), (200, 50, 30), (255, 200, 40)]},
    8: {"dir": "8-reino-glacial", "theme": "ice", "colors": [(20, 60, 100), (60, 140, 200), (220, 245, 255)]},
    9: {"dir": "9-neon-arcade", "theme": "arcade", "colors": [(20, 10, 40), (60, 20, 120), (0, 255, 255)]},
    10: {"dir": "10-cosmos-pop", "theme": "space", "colors": [(10, 5, 30), (40, 20, 90), (255, 80, 120)]},
    11: {"dir": "11-volcano-rush", "theme": "lava", "colors": [(40, 10, 0), (150, 30, 10), (255, 200, 60)]},
    12: {"dir": "12-retro-speedway", "theme": "retro", "colors": [(10, 20, 60), (30, 60, 150), (255, 0, 160)]},
    13: {"dir": "13-ruinas-sumergidas", "theme": "underwater", "colors": [(5, 20, 40), (20, 60, 100), (120, 200, 255)]},
    14: {"dir": "14-valle-lunar", "theme": "moon", "colors": [(15, 15, 30), (40, 45, 80), (210, 215, 235)]},
    15: {"dir": "15-catedral-de-cristal", "theme": "cathedral", "colors": [(20, 25, 60), (80, 100, 180), (180, 210, 255)]},
    16: {"dir": "16-ciudad-nocturna", "theme": "night_city", "colors": [(10, 15, 35), (35, 55, 95), (120, 190, 255)]}
}

def lerp_color(c1, c2, t):
    return tuple(int(a + (b - a) * t) for a, b in zip(c1, c2))

def create_gradient(draw, colors):
    for y in range(HEIGHT):
        t = y / (HEIGHT - 1)
        if t < 0.5:
            col = lerp_color(colors[0], colors[1], t * 2)
        else:
            col = lerp_color(colors[1], colors[2], (t - 0.5) * 2)
        draw.line([(0, y), (WIDTH, y)], fill=col)

def generate_background(chapter_id, level_num, out_path):
    config = CHAPTER_CONFIGS[chapter_id]
    colors = config["colors"]
    theme = config["theme"]
    
    # Generador con semilla única por nivel/capítulo para consistencia
    rng = random.Random(chapter_id * 1000 + level_num)
    
    img = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 255))
    draw = ImageDraw.Draw(img)
    
    # 1. Cielo/Fondo Base
    create_gradient(draw, colors)
    
    # 2. Elementos Distantes (Atmósfera)
    overlay = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    d_overlay = ImageDraw.Draw(overlay)
    
    if theme in ["space", "arcade"]:
        for _ in range(200):
            x, y = rng.randint(0, WIDTH), rng.randint(0, HEIGHT)
            r = rng.randint(1, 3)
            alpha = rng.randint(100, 255)
            d_overlay.ellipse([x-r, y-r, x+r, y+r], fill=(255, 255, 255, alpha))
            
    # 3. Siluetas de Terreno (Simulando profundidad integrada)
    for i in range(2): # Dibujamos un par de capas de terreno
        pts = [(0, HEIGHT)]
        y_base = HEIGHT * (0.5 + i * 0.2)
        amp = HEIGHT * 0.15
        freq = 0.002
        
        for x in range(0, WIDTH + 100, 100):
            y = y_base + math.sin(x * freq + rng.random()) * amp
            pts.append((x, int(y)))
        pts.append((WIDTH, HEIGHT))
        
        fill_col = lerp_color(colors[1], colors[0], 0.5 + i * 0.3)
        d_overlay.polygon(pts, fill=(*fill_col, 180))

    # 4. Elementos Temáticos Específicos (Stamps procedimentales)
    for _ in range(5 + level_num // 2):
        x = rng.randint(0, WIDTH)
        y = HEIGHT * 0.8 + rng.randint(-50, 50)
        size = rng.randint(100, 300)
        
        if theme == "jungle":
            d_overlay.ellipse([x-size//2, y-size, x+size//2, y], fill=(10, 40, 10, 150))
        elif theme == "desert":
            d_overlay.polygon([(x, y-size), (x-size//2, y), (x+size//2, y)], fill=(80, 40, 10, 150))
        elif theme == "japan":
            d_overlay.rectangle([x-size//4, y-size, x+size//4, y], fill=(100, 20, 20, 150))
        elif theme == "ice":
            d_overlay.polygon([(x, y-size), (x-size//3, y), (x+size//3, y)], fill=(200, 240, 255, 150))
        # ... se pueden añadir más formas para otros temas
    
    img = Image.alpha_composite(img, overlay)
    
    # Aplicar un ligero blur para suavizar formas procedimentales (estilo pintoresco)
    img = img.filter(ImageFilter.GaussianBlur(radius=1.5))
    
    # Guardar como WEBP optimizado
    out_path.parent.mkdir(parents=True, exist_ok=True)
    img.save(out_path, "WEBP", quality=85)
    print(f"Generado: {out_path.relative_to(PROJECT_ROOT)}")

def cleanup_old_files(level_dir):
    # Eliminar cualquier PNG residual como pide el usuario
    for file in level_dir.glob("*.png"):
        try:
            file.unlink()
            print(f"Eliminado residual: {file.name}")
        except:
            pass

def main():
    print(f"Iniciando Generador Maestro de Fondos (30:9) para {len(CHAPTER_CONFIGS)} capítulos...")
    
    for ch_id, config in CHAPTER_CONFIGS.items():
        ch_dir = ASSETS_DIR / config["dir"] / "fondos"
        
        for lvl in range(1, 31):
            lvl_dir = ch_dir / f"nivel_{lvl}"
            out_file = lvl_dir / "fondo_intermedio.webp"
            
            generate_background(ch_id, lvl, out_file)
            cleanup_old_files(lvl_dir)

    print("\nProceso de generación completado con éxito.")

if __name__ == "__main__":
    main()
