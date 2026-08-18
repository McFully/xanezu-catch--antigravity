import os
import shutil
from pathlib import Path

# ================================================================
# FILE REALIGNMENT SCRIPT v1.0
# Renombra bruma.webp -> efectos.webp y limpia carpetas de nivel
# ================================================================

PROJECT_ROOT = Path(r"c:\Users\Aritz\Desktop\Proyectos Antigravity\XANEZU CATCH  ANTIGRAVITY 01-03-026")
ASSETS_DIR = PROJECT_ROOT / "assets"

def realign_files():
    moved_count = 0
    cleaned_count = 0
    
    print("Iniciando realineación de archivos de nivel...")
    
    # Recorrer todos los directorios en assets
    for chapter_dir in ASSETS_DIR.iterdir():
        if not chapter_dir.is_dir(): continue
        
        fondos_path = chapter_dir / "fondos"
        if not fondos_path.exists(): continue
        
        for level_dir in fondos_path.glob("nivel_*"):
            if not level_dir.is_dir(): continue
            
            # 1. Mover efectos/bruma.webp a nivel_N/efectos.webp
            old_mist_webp = level_dir / "efectos" / "bruma.webp"
            old_mist_png = level_dir / "efectos" / "bruma.png"
            new_efectos_webp = level_dir / "efectos.webp"
            
            if old_mist_webp.exists():
                shutil.move(str(old_mist_webp), str(new_efectos_webp))
                moved_count += 1
            elif old_mist_png.exists():
                # Si es PNG, lo movemos y el AssetLoader se encargará o lo convertiremos luego
                shutil.move(str(old_mist_png), str(level_dir / "efectos.png"))
                moved_count += 1
                
            # 2. Eliminar carpeta efectos/ si está vacía o solo tiene basura
            efectos_subdir = level_dir / "efectos"
            if efectos_subdir.exists():
                try:
                    # Intentar borrar subarchivos residuales
                    for f in efectos_subdir.iterdir():
                        if f.is_file(): f.unlink()
                    efectos_subdir.rmdir()
                    cleaned_count += 1
                except Exception as e:
                    print(f"No se pudo eliminar {efectos_subdir}: {e}")

            # 3. Eliminar archivos NO permitidos (fondo_lejano, primer_plano, nubes)
            # Aunque ya se hizo, lo reforzamos para cumplir con "Nada más"
            prohibited = ["fondo_lejano.webp", "primer_plano.webp", "nubes.webp", 
                          "fondo_lejano.png", "primer_plano.png", "nubes.png",
                          "decoraciones.svg", "fondo_intermedio.svg"]
            
            for p in prohibited:
                p_path = level_dir / p
                if p_path.exists():
                    p_path.unlink()

    print(f"\nRealineación completada.")
    print(f"Archivos de efectos movidos/renombrados: {moved_count}")
    print(f"Carpetas residuales eliminadas: {cleaned_count}")

if __name__ == "__main__":
    realign_files()
