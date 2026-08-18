
import os
import shutil
from PIL import Image

def optimize_assets():
    project_root = r"c:\Users\Aritz\Desktop\Proyectos Antigravity\XANEZU CATCH  ANTIGRAVITY 01-03-026"
    backup_dir = os.path.join(project_root, ".backup_png")
    log_file = os.path.join(project_root, "optimization_report.md")
    
    if not os.path.exists(backup_dir):
        os.makedirs(backup_dir)
        
    stats = {
        "converted": [],
        "deleted_existing": [],
        "errors": []
    }
    
    print("Starting conversion process...")
    
    for root, dirs, files in os.walk(project_root):
        # Skip node_modules and .git
        if "node_modules" in dirs:
            dirs.remove("node_modules")
        if ".git" in dirs:
            dirs.remove(".git")
        if ".backup_png" in dirs:
            dirs.remove(".backup_png")
            
        for file in files:
            if file.lower().endswith(".png"):
                png_path = os.path.join(root, file)
                base_name = os.path.splitext(file)[0]
                webp_path = os.path.join(root, base_name + ".webp")
                
                rel_path = os.path.relpath(png_path, project_root)
                
                # REGLA: Eliminar capas de fondo prohibidas
                prohibited = ['fondo_lejano', 'primer_plano', 'decoraciones', 'background_far', 'background_front']
                is_prohibited = any(p in base_name for p in prohibited)
                
                if is_prohibited:
                    try:
                        backup_subdir = os.path.join(backup_dir, os.path.relpath(root, project_root))
                        if not os.path.exists(backup_subdir):
                            os.makedirs(backup_subdir)
                        shutil.move(png_path, os.path.join(backup_subdir, file))
                        
                        # Si también existe su versión WebP, eliminarla/respaldarla
                        if os.path.exists(webp_path):
                            shutil.move(webp_path, os.path.join(backup_subdir, base_name + ".webp"))
                        
                        print(f"Removed prohibited background layer: {rel_path}")
                        stats["deleted_existing"].append(rel_path)
                        continue # Ir al siguiente archivo
                    except Exception as e:
                        stats["errors"].append(f"Error removing prohibited layer {rel_path}: {str(e)}")

                # Rule: If WebP already exists
                if os.path.exists(webp_path):
                    try:
                        # Move to backup
                        backup_subdir = os.path.join(backup_dir, os.path.relpath(root, project_root))
                        if not os.path.exists(backup_subdir):
                            os.makedirs(backup_subdir)
                        shutil.move(png_path, os.path.join(backup_subdir, file))
                        
                        stats["deleted_existing"].append(rel_path)
                        print(f"Deleted redundant PNG (WebP exists): {rel_path}")
                    except Exception as e:
                        stats["errors"].append(f"Error handling existing WebP for {rel_path}: {str(e)}")
                
                # Rule: If WebP does NOT exist, convert
                else:
                    try:
                        # Convert to WebP
                        with Image.open(png_path) as img:
                            # Save with quality 85 (standard high quality for web)
                            img.save(webp_path, "WEBP", quality=85, lossless=False)
                        
                        # Verify integrity
                        if os.path.exists(webp_path) and os.path.getsize(webp_path) > 0:
                            # Move to backup
                            backup_subdir = os.path.join(backup_dir, os.path.relpath(root, project_root))
                            if not os.path.exists(backup_subdir):
                                os.makedirs(backup_subdir)
                            shutil.move(png_path, os.path.join(backup_subdir, file))
                            
                            stats["converted"].append(rel_path)
                            print(f"Converted and backed up: {rel_path} -> {base_name}.webp")
                        else:
                            stats["errors"].append(f"Validation failed for {rel_path} (Empty WebP)")
                    except Exception as e:
                        stats["errors"].append(f"Error converting {rel_path}: {str(e)}")

    # Generate Report
    with open(log_file, "w", encoding="utf-8") as f:
        f.write("# Game Assets Optimization Report\n\n")
        f.write(f"- **Total Converted**: {len(stats['converted'])}\n")
        f.write(f"- **Total PNGs deleted (WebP was present)**: {len(stats['deleted_existing'])}\n")
        f.write(f"- **Total Errors**: {len(stats['errors'])}\n\n")
        
        f.write("## ✅ Converted Files\n")
        for item in stats["converted"]:
            f.write(f"- {item}\n")
            
        f.write("\n## 🗑️ Deleted Redundant Files\n")
        for item in stats["deleted_existing"]:
            f.write(f"- {item}\n")
            
        if stats["errors"]:
            f.write("\n## ❌ Errors\n")
            for item in stats["errors"]:
                f.write(f"- {item}\n")
                
    print(f"Process complete. Report generated at: {log_file}")
    print(f"Original PNGs backed up in: {backup_dir}")

if __name__ == "__main__":
    optimize_assets()
