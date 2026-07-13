from pathlib import Path


ROOT = Path('assets')


CHAPTERS = {
    1: ('1-selva-tropical', ('#00FF66', '#00CC99', '#103d1f', '#f8ffcf'), 'leaf'),
    2: ('2-desierto-dorado', ('#61F2FF', '#6C63FF', '#1f2048', '#fff3c4'), 'crown'),
    3: ('3-japon-feudal', ('#FFA94D', '#C06C3E', '#42271d', '#ffe7cf'), 'gear'),
    4: ('4-bosque-encantado', ('#FFB703', '#FF6B35', '#4b220e', '#fff2cf'), 'sun'),
    5: ('5-pantano-maldito', ('#B5179E', '#4CC9F0', '#2b123b', '#f3d8ff'), 'ghost'),
    6: ('6-fabrica-de-juguetes', ('#7CFC00', '#00F5D4', '#12341e', '#f3ffd1'), 'atom'),
    7: ('7-fiesta-mexicana', ('#00E5FF', '#FF006E', '#101a43', '#f2f6ff'), 'sword'),
    8: ('8-reino-glacial', ('#67E8F9', '#A78BFA', '#111f3f', '#e8f7ff'), 'crystal'),
    9: ('9-neon-arcade', ('#FF3CAC', '#00F5FF', '#350b33', '#fff0f8'), 'star'),
    10: ('10-cosmos-pop', ('#FF6B6B', '#4D96FF', '#2e1548', '#fff7d2'), 'toy'),
    11: ('11-volcano-rush', ('#9D4EDD', '#00F5D4', '#2c0f3e', '#f7eaff'), 'glitch'),
    12: ('12-retro-speedway', ('#FF1744', '#00E5FF', '#2a102f', '#fff0dc'), 'mask'),
}


def motif(kind, c1, c2):
    if kind == 'leaf':
        return f"<path d='M28 56 Q50 28 72 56 Q50 52 28 56' fill='{c1}' opacity='0.55'/>"
    if kind == 'crown':
        return f"<path d='M28 28 L40 42 L50 30 L60 42 L72 28 L72 38 L28 38 Z' fill='{c2}' opacity='0.65'/>"
    if kind == 'gear':
        return f"<circle cx='50' cy='52' r='9' fill='{c2}' opacity='0.55'/><rect x='48' y='40' width='4' height='6' fill='{c2}'/><rect x='48' y='58' width='4' height='6' fill='{c2}'/>"
    if kind == 'sun':
        return f"<circle cx='50' cy='48' r='8' fill='{c1}' opacity='0.65'/><path d='M50 34 L50 22 M50 74 L50 62 M36 48 L24 48 M76 48 L64 48' stroke='{c2}' stroke-width='2'/>"
    if kind == 'ghost':
        return f"<path d='M34 62 Q34 48 50 46 Q66 48 66 62 L62 58 L58 62 L54 58 L50 62 L46 58 L42 62 Z' fill='{c1}' opacity='0.55'/>"
    if kind == 'atom':
        return f"<ellipse cx='50' cy='52' rx='16' ry='7' fill='none' stroke='{c1}' stroke-width='2'/><ellipse cx='50' cy='52' rx='16' ry='7' fill='none' stroke='{c2}' stroke-width='2' transform='rotate(60 50 52)'/>"
    if kind == 'sword':
        return f"<path d='M50 32 L56 44 L52 48 L48 48 L44 44 Z' fill='{c2}' opacity='0.7'/><rect x='47' y='48' width='6' height='14' fill='{c1}' opacity='0.6'/>"
    if kind == 'crystal':
        return f"<polygon points='50,30 60,44 50,58 40,44' fill='{c1}' opacity='0.6'/>"
    if kind == 'star':
        return f"<path d='M50 30 L54 42 L67 42 L56 50 L60 62 L50 54 L40 62 L44 50 L33 42 L46 42 Z' fill='{c1}' opacity='0.55'/>"
    if kind == 'toy':
        return f"<rect x='34' y='42' width='32' height='14' rx='5' fill='{c2}' opacity='0.58'/><circle cx='40' cy='49' r='2' fill='#fff'/><circle cx='60' cy='49' r='2' fill='#fff'/>"
    if kind == 'glitch':
        return f"<rect x='33' y='44' width='28' height='5' fill='{c1}' opacity='0.6'/><rect x='40' y='52' width='26' height='4' fill='{c2}' opacity='0.6'/>"
    if kind == 'mask':
        return f"<path d='M34 48 Q50 34 66 48 Q66 56 58 62 Q50 66 42 62 Q34 56 34 48 Z' fill='{c2}' opacity='0.58'/>"
    return ''


def sprite(name, palette, kind, state):
    c1, c2, c3, c4 = palette
    body_y = {'frog': 56, 'frog_up': 46, 'frog_dn': 62, 'frog_c': 56}[state]
    eye_y = {'frog': 38, 'frog_up': 26, 'frog_dn': 44, 'frog_c': 38}[state]
    mouth = {
        'frog': "<path d='M36 62 Q50 70 64 62' stroke='#0a0a12' stroke-width='3' fill='none' stroke-linecap='round'/>",
        'frog_up': "<circle cx='50' cy='56' r='4' fill='#8b1a1a'/>",
        'frog_dn': "<path d='M38 66 Q50 72 62 66' stroke='#0a0a12' stroke-width='3' fill='none' stroke-linecap='round'/>",
        'frog_c': "<ellipse cx='50' cy='64' rx='10' ry='7' fill='#8b1a1a'/><ellipse cx='50' cy='66' rx='6' ry='3' fill='#ff9a9a'/>",
    }[state]
    mk = motif(kind, c1, c2)
    return f"""<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'>
  <defs>
    <linearGradient id='g' x1='0' y1='0' x2='0' y2='1'>
      <stop offset='0%' stop-color='{c1}'/>
      <stop offset='100%' stop-color='{c2}'/>
    </linearGradient>
    <filter id='sh'><feDropShadow dx='0' dy='4' stdDeviation='3' flood-color='#000' flood-opacity='0.35'/></filter>
  </defs>
  <g filter='url(#sh)'>
    <ellipse cx='30' cy='88' rx='12' ry='9' fill='{c3}' opacity='0.7'/>
    <ellipse cx='70' cy='88' rx='12' ry='9' fill='{c3}' opacity='0.7'/>
    <ellipse cx='50' cy='{body_y}' rx='31' ry='28' fill='url(#g)'/>
    <ellipse cx='50' cy='{body_y + 6}' rx='20' ry='15' fill='{c4}' opacity='0.2'/>
    <circle cx='34' cy='{eye_y}' r='10' fill='#fff'/>
    <circle cx='66' cy='{eye_y}' r='10' fill='#fff'/>
    <circle cx='35' cy='{eye_y}' r='4' fill='#0a0a12'/>
    <circle cx='65' cy='{eye_y}' r='4' fill='#0a0a12'/>
    {mouth}
    {mk}
  </g>
  <text x='50' y='12' text-anchor='middle' font-size='6' fill='{c4}' opacity='0.85'>{name}</text>
</svg>
"""


def companion(palette, kind):
    c1, c2, c3, c4 = palette
    mk = motif(kind, c1, c2)
    return f"""<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'>
  <defs><linearGradient id='cg' x1='0' y1='0' x2='0' y2='1'><stop offset='0%' stop-color='{c1}'/><stop offset='100%' stop-color='{c2}'/></linearGradient></defs>
  <ellipse cx='50' cy='54' rx='32' ry='24' fill='url(#cg)'/>
  <circle cx='38' cy='50' r='5' fill='#fff'/><circle cx='62' cy='50' r='5' fill='#fff'/>
  <circle cx='38' cy='50' r='2' fill='#0a0a12'/><circle cx='62' cy='50' r='2' fill='#0a0a12'/>
  <path d='M42 62 Q50 68 58 62' stroke='{c4}' stroke-width='2' fill='none' stroke-linecap='round'/>
  {mk}
  <rect x='18' y='24' width='64' height='4' rx='2' fill='{c3}' opacity='0.55'/>
</svg>
"""


def main():
    for chapter_id, (chapter_dir, palette, kind) in CHAPTERS.items():
        out = ROOT / chapter_dir / 'personaje'
        out.mkdir(parents=True, exist_ok=True)
        for st in ('frog', 'frog_up', 'frog_dn', 'frog_c'):
            (out / f'{st}.svg').write_text(sprite(chapter_dir, palette, kind, st), encoding='utf-8')
        (out / 'comp.svg').write_text(companion(palette, kind), encoding='utf-8')
        print(f'Generated arcade characters for chapter {chapter_id}: {chapter_dir}')


if __name__ == '__main__':
    main()
