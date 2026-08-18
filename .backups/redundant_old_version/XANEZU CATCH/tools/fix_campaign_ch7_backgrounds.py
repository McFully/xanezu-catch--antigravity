from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageEnhance
import random


ROOT = Path('assets/7-fiesta-mexicana/fondos')


def make_layers(level_dir: Path, seed: int, fallback_far: Image.Image | None = None):
    far_path = level_dir / 'fondo_lejano.webp'
    if far_path.exists():
        far = Image.open(far_path).convert('RGB')
    elif fallback_far is not None:
        far = fallback_far.copy()
        far.save(far_path, 'WEBP', quality=86)
    else:
        return False
    w, h = far.size
    rng = random.Random(seed)

    # Mid layer: slightly richer color + subtle glow dots
    mid = far.copy()
    mid = ImageEnhance.Color(mid).enhance(1.15)
    mid = ImageEnhance.Contrast(mid).enhance(1.05)
    d_mid = ImageDraw.Draw(mid, 'RGBA')
    for _ in range(80):
        x = rng.randint(0, w - 1)
        y = rng.randint(0, h - 1)
        r = rng.randint(2, 7)
        c = rng.choice([(255, 60, 120, 80), (0, 255, 240, 80), (255, 205, 40, 70)])
        d_mid.ellipse((x - r, y - r, x + r, y + r), fill=c)
    mid.save(level_dir / 'fondo_intermedio.webp', 'WEBP', quality=86)

    # Foreground: dark lower vignette + festive banderines
    fg = mid.convert('RGBA')
    d_fg = ImageDraw.Draw(fg, 'RGBA')
    for y in range(h):
        alpha = max(0, int((y / h - 0.58) * 220))
        if alpha > 0:
            d_fg.line((0, y, w, y), fill=(10, 8, 18, min(170, alpha)))

    for row in range(3):
        y0 = int(h * (0.14 + row * 0.09))
        colors = [(255, 52, 113, 180), (40, 220, 255, 180), (255, 208, 58, 180), (132, 94, 247, 180)]
        step = max(34, w // 28)
        for x in range(0, w + step, step):
            c = colors[(x // step + row) % len(colors)]
            d_fg.polygon([(x, y0), (x + step // 2, y0 + 16), (x + step, y0)], fill=c)

    fg.convert('RGB').save(level_dir / 'primer_plano.webp', 'WEBP', quality=84)

    # Decorations overlay
    dec = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    d_dec = ImageDraw.Draw(dec, 'RGBA')
    for _ in range(160):
        x = rng.randint(0, w - 1)
        y = rng.randint(0, h - 1)
        sz = rng.randint(2, 6)
        c = rng.choice([(255, 80, 130, 120), (0, 245, 255, 120), (255, 215, 70, 115)])
        d_dec.rectangle((x, y, x + sz, y + sz), fill=c)
    dec.save(level_dir / 'decoraciones.webp', 'WEBP', lossless=True)

    # Mist effect
    mist = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    d_mist = ImageDraw.Draw(mist, 'RGBA')
    for _ in range(18):
        cx = rng.randint(-w // 6, w + w // 6)
        cy = rng.randint(h // 3, h)
        rx = rng.randint(w // 8, w // 3)
        ry = rng.randint(h // 18, h // 8)
        c = rng.choice([(255, 60, 120, 22), (20, 230, 255, 24), (255, 210, 80, 18)])
        d_mist.ellipse((cx - rx, cy - ry, cx + rx, cy + ry), fill=c)
    mist = mist.filter(ImageFilter.GaussianBlur(16))
    fx_dir = level_dir / 'efectos'
    fx_dir.mkdir(exist_ok=True)
    mist.save(fx_dir / 'bruma.webp', 'WEBP', lossless=True)
    return True


def main():
    levels = sorted([p for p in ROOT.glob('nivel_*') if p.is_dir()], key=lambda p: int(p.name.split('_')[1]))
    fallback_by_idx = {}
    for level_dir in levels:
        idx = int(level_dir.name.split('_')[1])
        far_path = level_dir / 'fondo_lejano.webp'
        if far_path.exists():
            fallback_by_idx[idx] = Image.open(far_path).convert('RGB')

    done = 0
    for i, level_dir in enumerate(levels, start=1):
        idx = int(level_dir.name.split('_')[1])
        fb = fallback_by_idx.get(idx)
        if fb is None:
            for src in (idx - 20, idx - 10, idx - 1, 20, 10, 1):
                if src in fallback_by_idx:
                    fb = fallback_by_idx[src]
                    break
        if make_layers(level_dir, 7000 + i, fb):
            done += 1
    print(f'Regenerated chapter 7 campaign background layers for {done} levels.')


if __name__ == '__main__':
    main()
