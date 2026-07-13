from PIL import Image, ImageDraw, ImageFilter
from pathlib import Path
import argparse
import random
import math

root = Path('assets')
chapters = {
    9: dict(dir='9-neon-arcade', style='arcade', top=(10, 20, 50), bot=(40, 90, 170), accent=(0, 255, 255), accent2=(255, 0, 220)),
    10: dict(dir='10-cosmos-pop', style='arcade', top=(20, 10, 45), bot=(90, 40, 140), accent=(255, 120, 80), accent2=(90, 220, 255)),
    11: dict(dir='11-volcano-rush', style='arcade', top=(40, 8, 6), bot=(130, 35, 10), accent=(255, 200, 70), accent2=(255, 90, 40)),
    12: dict(dir='12-retro-speedway', style='arcade', top=(8, 14, 30), bot=(20, 40, 85), accent=(0, 230, 255), accent2=(255, 0, 170)),
    13: dict(dir='13-ruinas-sumergidas', style='cinematic', top=(8, 24, 38), bot=(28, 66, 94), accent=(140, 220, 240), accent2=(110, 170, 210)),
    14: dict(dir='14-valle-lunar', style='cinematic', top=(10, 12, 24), bot=(45, 52, 85), accent=(210, 210, 230), accent2=(165, 175, 215)),
    15: dict(dir='15-catedral-de-cristal', style='cinematic', top=(14, 16, 44), bot=(66, 88, 132), accent=(185, 220, 255), accent2=(170, 140, 245)),
    16: dict(dir='16-ciudad-nocturna', style='cinematic', top=(6, 10, 22), bot=(26, 40, 70), accent=(120, 210, 255), accent2=(90, 150, 210)),
}

W, H = 640, 360


def lerp(a, b, t):
    return int(a * (1 - t) + b * t)


def gradient(top, bot):
    strip = Image.new('RGB', (1, H))
    for y in range(H):
        t = y / (H - 1)
        strip.putpixel((0, y), (lerp(top[0], bot[0], t), lerp(top[1], bot[1], t), lerp(top[2], bot[2], t)))
    return strip.resize((W, H), resample=Image.Resampling.BILINEAR)


def chapter_seed(chapter_dir):
    return sum((idx + 1) * ord(ch) for idx, ch in enumerate(chapter_dir))


def level_complete(level_dir):
    required = [
        level_dir / 'fondo_intermedio.webp',
        level_dir / 'efectos' / 'bruma.webp',
    ]
    return all(path.exists() for path in required)


def make_bg(cfg, level, out_dir):
    r = random.Random(level * 7919 + chapter_seed(cfg['dir']))
    top, bot = cfg['top'], cfg['bot']
    accent, accent2 = cfg['accent'], cfg['accent2']

    # Crear una única imagen que combine todas las profundidades
    # (Simulamos lo que antes eran capas separadas en una sola imagen)
    final_img = gradient(top, bot).convert('RGBA')
    d = ImageDraw.Draw(final_img, 'RGBA')

    # Elementos Lejanos (Estrellas/Nebulosas)
    stars = 140 if cfg['style'] == 'arcade' else 75
    for _ in range(stars):
        x = r.randint(0, W - 1)
        y = r.randint(0, int(H * 0.6))
        s = r.randint(1, 3 if cfg['style'] == 'arcade' else 2)
        col = 220 + r.randint(0, 35)
        d.ellipse((x - s, y - s, x + s, y + s), fill=(col, col, col, 180))

    # Formas de fondo (Montañas/Estructuras distantes)
    for i in range(3):
        pts = []
        phase = r.random() * 6.28
        y0 = 120 + i * 90 + r.randint(-20, 20)
        amp = 45 if cfg['style'] == 'arcade' else 28
        for x in range(0, W + 32, 32):
            y = y0 + int(math.sin((x / W) * math.pi * 2 * (1.1 + i * 0.23) + phase) * amp)
            pts.append((x, y))
        poly = pts + [(W, int(H * 0.56)), (0, int(H * 0.56))]
        col = accent if i % 2 == 0 else accent2
        alpha = 55 if cfg['style'] == 'arcade' else 38
        d.polygon(poly, fill=(*col, alpha))

    # Base del mundo
    base = int(H * (0.78 if cfg['style'] == 'arcade' else 0.84))
    pts = [(0, base + r.randint(-20, 20))]
    x = 0
    while x < W:
        x += r.randint(70, 140)
        pts.append((min(x, W), base + r.randint(-95, 55)))
    pts += [(W, H), (0, H)]
    mcol = (max(0, bot[0] - 15), max(0, bot[1] - 15), max(0, bot[2] - 15), 240)
    d.polygon(pts, fill=mcol)

    # Elementos de Superficie (Suelo/Obstáculos decorativos integrados)
    ov = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    dm = ImageDraw.Draw(ov, 'RGBA')
    base2 = int(H * 0.9)
    pts2 = [(0, base2 + r.randint(-20, 20))]
    x = 0
    while x < W:
        x += r.randint(95, 175)
        pts2.append((min(x, W), base2 + r.randint(-120, 70)))
    pts2 += [(W, H), (0, H)]
    mc2 = (min(255, bot[0] + 40), min(255, bot[1] + 40), min(255, bot[2] + 40), 220)
    dm.polygon(pts2, fill=mc2)
    for i in range(0, len(pts2) - 3, 2):
        p1, p2 = pts2[i], pts2[i + 1]
        mx = (p1[0] + p2[0]) // 2
        my = min(p1[1], p2[1])
        dm.polygon([(p1[0], p1[1] + 8), (mx, my - 16), (p2[0], p2[1] + 8)], fill=(220, 235, 250, 150))

    # Primer plano (suelo y picos)
    floor = int(H * 0.9) + r.randint(-8, 8)
    ground = (180, 200, 220) if cfg['style'] == 'cinematic' else (160, 190, 230)
    dm.rectangle((0, floor, W, H), fill=(*ground, 255))
    spikes = 28 if cfg['style'] == 'arcade' else 20
    for _ in range(spikes):
        x1 = r.randint(0, W - 40)
        ww = r.randint(25, 130)
        hh = r.randint(16, 90)
        dm.polygon([(x1, floor), (x1 + ww // 2, floor - hh), (x1 + ww, floor)], fill=(205, 225, 245, 170))

    # Cristales/Detalles finales
    crystals = 26 if cfg['style'] == 'arcade' else 16
    for _ in range(crystals):
        x = r.randint(0, W)
        y = r.randint(int(H * 0.36), H - 40)
        s = r.randint(8, 22)
        col = accent if r.random() < 0.5 else accent2
        dm.polygon([(x, y - s), (x + s, y), (x, y + s), (x - s, y)], fill=(*col, 120 if cfg['style'] == 'arcade' else 80))
    if cfg['style'] == 'arcade':
        for _ in range(14):
            x = r.randint(0, W - 80)
            y = r.randint(int(H * 0.34), H - 120)
            dm.rectangle((x, y, x + r.randint(14, 40), y + r.randint(6, 16)), fill=(*accent2, 90))

    ov = ov.filter(ImageFilter.GaussianBlur(radius=0.5))
    final_img.alpha_composite(ov)
    
    # GUARDAR ÚNICAMENTE como fondo_intermedio.webp
    final_img.save(out_dir / 'fondo_intermedio.webp', 'WEBP', quality=85)

    # bruma
    mist = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    ms = ImageDraw.Draw(mist, 'RGBA')
    for i in range(7):
        y = int(H * 0.58) + i * 24 + r.randint(-8, 8)
        a = 24 + i * 4
        ms.ellipse((-150, y - 40, W + 150, y + 56), fill=(220, 245, 255, a))
    mist = mist.filter(ImageFilter.GaussianBlur(radius=7))
    (out_dir / 'efectos').mkdir(parents=True, exist_ok=True)
    mist.save(out_dir / 'efectos' / 'bruma.webp', 'WEBP', quality=70)


def parse_args():
    parser = argparse.ArgumentParser(description='Generate assets for chapters 9-16')
    parser.add_argument(
        '--chapters',
        default='all',
        help='Comma-separated chapter numbers (e.g. 9,10,16) or all',
    )
    parser.add_argument(
        '--force',
        action='store_true',
        help='Regenerate all levels and obstacles even if files already exist',
    )
    return parser.parse_args()


def selected_chapters(selection):
    if selection.strip().lower() == 'all':
        return sorted(chapters.keys())
    picked = []
    for token in selection.split(','):
        token = token.strip()
        if not token:
            continue
        num = int(token)
        if num not in chapters:
            raise ValueError(f'Chapter {num} is not in 9-16 range')
        picked.append(num)
    return sorted(set(picked))


def obstacle_svg(c1, c2):
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="128" height="256" viewBox="0 0 128 256">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="{c1}"/>
      <stop offset="100%" stop-color="{c2}"/>
    </linearGradient>
  </defs>
  <rect x="14" y="10" width="100" height="236" rx="16" fill="url(#g)" stroke="#0a0f1a" stroke-width="4"/>
  <path d="M24 40 L104 40 M24 80 L104 80 M24 120 L104 120 M24 160 L104 160 M24 200 L104 200" stroke="rgba(255,255,255,0.18)" stroke-width="3"/>
  <circle cx="34" cy="28" r="5" fill="rgba(255,255,255,0.45)"/>
  <circle cx="94" cy="228" r="5" fill="rgba(255,255,255,0.35)"/>
</svg>'''


def obstacle_top_svg(c1, c2):
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="128" height="256" viewBox="0 0 128 256">
  <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="{c1}"/><stop offset="100%" stop-color="{c2}"/></linearGradient></defs>
  <rect x="14" y="10" width="100" height="236" rx="16" fill="url(#g)" stroke="#0a0f1a" stroke-width="4"/>
  <path d="M22 246 L34 218 L46 246 L58 218 L70 246 L82 218 L94 246 L106 218" fill="rgba(230,245,255,0.85)"/>
</svg>'''


def obstacle_bot_svg(c1, c2):
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="128" height="256" viewBox="0 0 128 256">
  <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="{c1}"/><stop offset="100%" stop-color="{c2}"/></linearGradient></defs>
  <rect x="14" y="10" width="100" height="236" rx="16" fill="url(#g)" stroke="#0a0f1a" stroke-width="4"/>
  <path d="M22 10 L34 38 L46 10 L58 38 L70 10 L82 38 L94 10 L106 38" fill="rgba(230,245,255,0.85)"/>
</svg>'''


def main():
    args = parse_args()
    nums = selected_chapters(args.chapters)

    for chapter_num in nums:
        cfg = chapters[chapter_num]
        cdir = root / cfg['dir']
        (cdir / 'fondos').mkdir(parents=True, exist_ok=True)
        (cdir / 'obstaculos').mkdir(parents=True, exist_ok=True)
        (cdir / 'personaje').mkdir(parents=True, exist_ok=True)
        (cdir / 'audios').mkdir(parents=True, exist_ok=True)

        # Character and chapter music are generated by tools/gen_chapters_9_16_audio_chars.py

        # Backgrounds 1..30
        for lvl in range(1, 31):
            out = cdir / 'fondos' / f'nivel_{lvl}'
            out.mkdir(parents=True, exist_ok=True)
            if args.force or not level_complete(out):
                make_bg(cfg, lvl, out)

        # Obstacles
        a1 = '#%02x%02x%02x' % cfg['accent']
        a2 = '#%02x%02x%02x' % cfg['accent2']

        for i in range(1, 7):
            tag = f"l0{i}"
            root_obs = cdir / 'obstaculos' / f'obs_{tag}.svg'
            root_top = cdir / 'obstaculos' / f'obs_top_{tag}.svg'
            root_bot = cdir / 'obstaculos' / f'obs_bot_{tag}.svg'
            if args.force or not root_obs.exists():
                root_obs.write_text(obstacle_svg(a1, a2), encoding='utf-8')
            if args.force or not root_top.exists():
                root_top.write_text(obstacle_top_svg(a1, a2), encoding='utf-8')
            if args.force or not root_bot.exists():
                root_bot.write_text(obstacle_bot_svg(a1, a2), encoding='utf-8')

        for lvl in range(1, 31):
            ld = cdir / 'obstaculos' / f'nivel_{lvl}'
            ld.mkdir(parents=True, exist_ok=True)
            for i in range(1, 7):
                tag = f"l0{i}"
                obs_path = ld / f'obs_{tag}.svg'
                if args.force or not obs_path.exists():
                    obs_path.write_text(obstacle_svg(a1, a2), encoding='utf-8')

    print(f'Generated/updated chapters: {", ".join(str(n) for n in nums)}')


if __name__ == '__main__':
    main()
