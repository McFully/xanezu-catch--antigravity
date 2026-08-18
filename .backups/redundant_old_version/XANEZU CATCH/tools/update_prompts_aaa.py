import os
from pathlib import Path

# ================================================================
# PROMPTS REPLACEMENT SCRIPT v1.0
# Reemplaza todos los PROMPTS.md con la nueva estructura AAA
# ================================================================

PROJECT_ROOT = Path(r"c:\Users\Aritz\Desktop\Proyectos Antigravity\XANEZU CATCH  ANTIGRAVITY 01-03-026")
ASSETS_DIR = PROJECT_ROOT / "assets"

CHAPTER_MAP = {
    "1-selva-tropical": {"name": "Selva Tropical", "ambient": "Humid Day"},
    "2-desierto-dorado": {"name": "Desierto Dorado", "ambient": "Golden Sunset"},
    "3-japon-feudal": {"name": "Japón Feudal", "ambient": "Zen Morning"},
    "4-bosque-encantado": {"name": "Bosque Encantado", "ambient": "Magical Twilight"},
    "5-pantano-maldito": {"name": "Pantano Maldito", "ambient": "Toxic Night"},
    "6-fabrica-de-juguetes": {"name": "Fábrica de Juguetes", "ambient": "Industrial Overdrive"},
    "7-fiesta-mexicana": {"name": "Fiesta Mexicana", "ambient": "Vibrant Celebration"},
    "8-reino-glacial": {"name": "Reino Glacial", "ambient": "Glacial Arctic"},
    "9-neon-arcade": {"name": "Neon Arcade", "ambient": "Cyberpunk Night"},
    "10-cosmos-pop": {"name": "Cosmos Pop", "ambient": "Galactic Pop"},
    "11-volcano-rush": {"name": "Volcano Rush", "ambient": "Volcanic Heat"},
    "12-retro-speedway": {"name": "Retro Speedway", "ambient": "Synthwave"},
    "13-ruinas-sumergidas": {"name": "Ruinas Sumergidas", "ambient": "Underwater Abyss"},
    "14-valle-lunar": {"name": "Valle Lunar", "ambient": "Lunar Surface"},
    "15-catedral-de-cristal": {"name": "Catedral de Cristal", "ambient": "Sacred Light"},
    "16-ciudad-nocturna": {"name": "Ciudad Nocturna", "ambient": "Rainy Noir"},
}

TEMPLATE = """# Prompts de Generación AAA - {chapter_name} (Nivel {level})

**Estilo:** Rayman Legends, Adorable Cartoon, Pintoresco, 4K, Alta Fidelidad
**Ambiente:** {ambient}

## Capas de Fondo

* **Fondo Intermedio (fondos/fondo_intermedio.webp)**

* Prompt: Rayman Legends style intermediate background for {chapter_name} level {level}. {ambient}. Layers of scenery consistent with the thematic style, appropriate color palette, semi-transparent areas for parallax depth. Painterly textures, 4K. Guardar en la carpeta `fondos` de cada nivel de cada capítulo. Formato final: `.webp`.

* **Decoraciones (assets/decoraciones/decoraciones.webp)**

* Prompt: Rayman Legends style floating or background decorative elements for {chapter_name} level {level} (vines, rocks, props, thematic elements). {ambient}. Vibrant colors, painterly detail, 4K, transparent background. Guardar en la carpeta `decoraciones` de cada nivel de cada capítulo. Formato final: `.webp`.

## Efectos

* **Efectos (assets/efectos/efectos.webp)**

* Prompt: Rayman Legends style atmospheric effects (fog, mist, particles) for {chapter_name} level {level}. Color tint, semi-transparent smoky textures, soft edges, painterly detail, 4K, transparent background. Guardar en la carpeta `efectos` de cada nivel de cada capítulo. Formato final: `.webp`.

---

## Notas importantes

1. No generar: fondo_lejano, primer_plano, ni ninguna otra capa de fondo.
2. Solo `fondo_intermedio.webp` será el fondo principal de cada nivel.
3. Cada prompt debe generar la imagen en `.webp`. Si el sistema genera `.png`, convertir automáticamente a `.webp` y eliminar el `.png`.
4. Mantener coherencia temática de cada capítulo en todos los niveles.
5. Cada archivo debe guardarse en su carpeta correspondiente (`fondos`, `decoraciones`, `efectos`) dentro de `assets` para cada nivel y capítulo.

---

**Resultado:**
Cada carpeta de nivel tendrá un único `prompts.md` actualizado siguiendo esta plantilla, asegurando que solo existan:

* fondo_intermedio.webp
* decoraciones.webp
* efectos.webp

Nada más.
"""

def main():
    updated_count = 0
    created_count = 0
    
    print("Iniciando reemplazo masivo de PROMPTS.md...")
    
    for chapter_dir, info in CHAPTER_MAP.items():
        chapter_path = ASSETS_DIR / chapter_dir
        if not chapter_path.exists():
            print(f"Skipping {chapter_dir}: directory not found.")
            continue
            
        fondos_path = chapter_path / "fondos"
        if not fondos_path.exists():
            fondos_path.mkdir(parents=True, exist_ok=True)
            
        for level in range(1, 31):
            level_dir = fondos_path / f"nivel_{level}"
            if not level_dir.exists():
                level_dir.mkdir(parents=True, exist_ok=True)
                created_count += 1
                
            prompt_file = level_dir / "PROMPTS.md"
            
            content = TEMPLATE.format(
                chapter_name=info["name"],
                level=level,
                ambient=info["ambient"]
            )
            
            with open(prompt_file, "w", encoding="utf-8") as f:
                f.write(content)
            
            updated_count += 1
            
    print(f"\nProceso completado.")
    print(f"Archivos PROMPTS.md actualizados/creados: {updated_count}")
    print(f"Carpetas de nivel creadas: {created_count}")

if __name__ == "__main__":
    main()
