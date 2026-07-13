from pathlib import Path
from array import array
import math
import wave


ROOT = Path('assets')


CHAPTERS = {
    9: {
        'dir': '9-neon-arcade',
        'name': 'Neon Arcade',
        'palette': ('#1de9ff', '#ff2bd6', '#120a2a', '#f8ffff'),
        'motif': 'neon',
        'music': {
            'duration': 22.0,
            'bpm': 136,
            'root': 64,
            'scale': [0, 2, 4, 7, 9],
            'melody': [0, 2, 4, 2, 3, 4, 2, 1],
            'bass': [0, 0, 3, 0],
            'prog': [0, 3, 4, 3],
            'wave': 'square',
            'echo': 0.22,
            'noise': 0.02,
            'kick_pattern': '1000100010001010',
            'snare_pattern': '0000100000001000',
            'hat_pattern': '1010101010101010',
            'swing': 0.06,
        },
    },
    10: {
        'dir': '10-cosmos-pop',
        'name': 'Cosmos Pop',
        'palette': ('#ff6a88', '#63e6ff', '#1a1035', '#f6f0ff'),
        'motif': 'cosmos',
        'music': {
            'duration': 24.0,
            'bpm': 124,
            'root': 62,
            'scale': [0, 2, 3, 5, 7, 9, 10],
            'melody': [0, 2, 4, 6, 4, 2, 1, 2],
            'bass': [0, 4, 3, 2],
            'prog': [0, 5, 3, 4],
            'wave': 'triangle',
            'echo': 0.30,
            'noise': 0.01,
            'kick_pattern': '1000100010001000',
            'snare_pattern': '0000100000001000',
            'hat_pattern': '1010111010101110',
            'swing': 0.03,
            'shimmer': 0.14,
        },
    },
    11: {
        'dir': '11-volcano-rush',
        'name': 'Volcano Rush',
        'palette': ('#ff7a00', '#ff3131', '#2b0b04', '#fff1d0'),
        'motif': 'volcano',
        'music': {
            'duration': 21.0,
            'bpm': 144,
            'root': 52,
            'scale': [0, 1, 3, 5, 7, 8, 10],
            'melody': [0, 1, 3, 1, 4, 5, 4, 2],
            'bass': [0, 0, 2, 0],
            'prog': [0, 2, 5, 1],
            'wave': 'saw',
            'echo': 0.16,
            'noise': 0.035,
            'kick_pattern': '1010101010101010',
            'snare_pattern': '0000100000001000',
            'hat_pattern': '0010001000100010',
            'drive': 1.18,
        },
    },
    12: {
        'dir': '12-retro-speedway',
        'name': 'Retro Speedway',
        'palette': ('#00e8ff', '#ff00a8', '#0d1636', '#ffffff'),
        'motif': 'retro',
        'music': {
            'duration': 22.0,
            'bpm': 138,
            'root': 59,
            'scale': [0, 2, 3, 5, 7, 8, 10],
            'melody': [0, 3, 5, 3, 4, 2, 1, 2],
            'bass': [0, 0, 4, 3],
            'prog': [0, 3, 4, 5],
            'wave': 'pulse',
            'echo': 0.24,
            'noise': 0.012,
            'kick_pattern': '1000100010001000',
            'snare_pattern': '0000100000001000',
            'hat_pattern': '1110111011101110',
            'swing': 0.08,
            'drive': 1.1,
        },
    },
    13: {
        'dir': '13-ruinas-sumergidas',
        'name': 'Ruinas Sumergidas',
        'palette': ('#8ad6ff', '#2f7a9c', '#082433', '#dbf4ff'),
        'motif': 'ruins',
        'music': {
            'duration': 28.0,
            'bpm': 92,
            'root': 57,
            'scale': [0, 2, 3, 5, 7, 8, 10],
            'melody': [0, 2, 1, 3, 4, 3, 2, 1],
            'bass': [0, 3, 2, 1],
            'prog': [0, 5, 3, 4],
            'wave': 'sine',
            'echo': 0.35,
            'noise': 0.008,
            'kick_pattern': '1000000010000000',
            'snare_pattern': '0000000000001000',
            'hat_pattern': '1000100010001000',
            'sub': 0.22,
        },
    },
    14: {
        'dir': '14-valle-lunar',
        'name': 'Valle Lunar',
        'palette': ('#d6d9ea', '#8b90b8', '#171b30', '#f3f6ff'),
        'motif': 'moon',
        'music': {
            'duration': 30.0,
            'bpm': 80,
            'root': 55,
            'scale': [0, 2, 4, 7, 9],
            'melody': [0, 1, 2, 1, 3, 2, 1, 0],
            'bass': [0, 2, 1, 0],
            'prog': [0, 2, 4, 1],
            'wave': 'triangle',
            'echo': 0.42,
            'noise': 0.006,
            'kick_pattern': '1000000010000000',
            'snare_pattern': '0000000000000000',
            'hat_pattern': '1000000010000000',
            'sub': 0.28,
            'shimmer': 0.08,
        },
    },
    15: {
        'dir': '15-catedral-de-cristal',
        'name': 'Catedral de Cristal',
        'palette': ('#c9e9ff', '#9b7dff', '#1c1d4d', '#f6fcff'),
        'motif': 'crystal',
        'music': {
            'duration': 28.0,
            'bpm': 88,
            'root': 60,
            'scale': [0, 2, 4, 7, 9, 11],
            'melody': [0, 2, 4, 5, 4, 2, 1, 2],
            'bass': [0, 4, 3, 1],
            'prog': [0, 4, 5, 3],
            'wave': 'bell',
            'echo': 0.38,
            'noise': 0.004,
            'kick_pattern': '1000000010000000',
            'snare_pattern': '0000000000001000',
            'hat_pattern': '1000100010001000',
            'shimmer': 0.20,
        },
    },
    16: {
        'dir': '16-ciudad-nocturna',
        'name': 'Ciudad Nocturna',
        'palette': ('#7dd3fc', '#335a88', '#0a1328', '#e9f7ff'),
        'motif': 'city',
        'music': {
            'duration': 26.0,
            'bpm': 98,
            'root': 50,
            'scale': [0, 2, 3, 5, 7, 8, 10],
            'melody': [0, 2, 3, 2, 4, 3, 2, 1],
            'bass': [0, 0, 3, 2],
            'prog': [0, 3, 5, 4],
            'wave': 'sine',
            'echo': 0.28,
            'noise': 0.02,
            'kick_pattern': '1000100010001000',
            'snare_pattern': '0000100000001000',
            'hat_pattern': '1010101010101010',
            'sub': 0.16,
            'drive': 1.05,
        },
    },
}


def note_to_freq(midi_note):
    return 440.0 * (2.0 ** ((midi_note - 69.0) / 12.0))


def frac(x):
    return x - math.floor(x)


def osc(kind, freq, t):
    p = 2.0 * math.pi * freq * t
    if kind == 'square':
        return 1.0 if math.sin(p) >= 0 else -1.0
    if kind == 'triangle':
        return (2.0 / math.pi) * math.asin(math.sin(p))
    if kind == 'saw':
        return 2.0 * frac(freq * t) - 1.0
    if kind == 'pulse':
        return 1.0 if frac(freq * t) < 0.25 else -1.0
    if kind == 'bell':
        return math.sin(p) * 0.6 + math.sin(2.4 * p) * 0.25 + math.sin(3.7 * p) * 0.15
    return math.sin(p)


def pseudo_noise(index, seed):
    v = math.sin((index + seed * 97) * 12.9898) * 43758.5453
    return (v - math.floor(v)) * 2.0 - 1.0


def make_wav(path, cfg, duration=20.0, sample_rate=22050, seed=0):
    m = cfg['music']
    duration = float(m.get('duration', duration))
    bpm = float(m['bpm'])
    root = int(m['root'])
    scale = m['scale']
    melody = m['melody']
    bass_line = m['bass']
    progression = m['prog']
    wave_kind = m['wave']
    echo_amount = float(m['echo'])
    noise_amount = float(m['noise'])
    kick_pattern = m.get('kick_pattern', '1000100010001000')
    snare_pattern = m.get('snare_pattern', '0000100000001000')
    hat_pattern = m.get('hat_pattern', '1010101010101010')
    swing = float(m.get('swing', 0.0))
    drive = float(m.get('drive', 1.0))
    shimmer_amount = float(m.get('shimmer', 0.0))
    sub_amount = float(m.get('sub', 0.0))

    total = int(duration * sample_rate)
    bps = bpm / 60.0
    delay = max(1, int(sample_rate * (60.0 / bpm) * 0.75))
    delay_buf = [0.0] * delay
    delay_idx = 0

    out = array('h')
    for i in range(total):
        t = i / sample_rate
        beat = t * bps
        beat_i = int(beat)
        half_i = int(beat * 2.0)
        bar_i = int(beat / 4.0)
        sixteenth_i = int(beat * 4.0)
        half_pos = frac(beat * 2.0)
        beat_pos = frac(beat)
        sixteenth_pos = frac(beat * 4.0)

        swing_shift = swing if (sixteenth_i % 2 == 1) else 0.0
        half_pos = min(0.9999, half_pos + swing_shift * 0.25)
        sixteenth_pos = min(0.9999, sixteenth_pos + swing_shift)

        mel_scale_idx = melody[half_i % len(melody)] % len(scale)
        mel_oct = 12 if ((half_i // 8) % 2 == 1) else 0
        mel_note = root + scale[mel_scale_idx] + mel_oct
        mel_freq = note_to_freq(mel_note)
        lead_env = max(0.0, 1.0 - (half_pos / 0.92))
        lead = osc(wave_kind, mel_freq, t) * lead_env * 0.34

        bass_idx = bass_line[beat_i % len(bass_line)] % len(scale)
        bass_note = root - 12 + scale[bass_idx]
        bass_freq = note_to_freq(bass_note)
        bass_env = max(0.0, 1.0 - (beat_pos / 0.78))
        bass = osc('triangle', bass_freq, t) * bass_env * 0.28

        chord_root_idx = progression[bar_i % len(progression)] % len(scale)
        chord_base = root - 5 + scale[chord_root_idx]
        chord = [chord_base, chord_base + 4, chord_base + 7]
        pad_lfo = 0.65 + 0.35 * math.sin(2.0 * math.pi * 0.15 * t)
        pad = 0.0
        for note in chord:
            pad += math.sin(2.0 * math.pi * note_to_freq(note) * t)
        pad = (pad / 3.0) * 0.20 * pad_lfo

        shimmer = 0.0
        if shimmer_amount > 0.0:
            shimmer_note = root + 24 + scale[mel_scale_idx]
            shimmer = math.sin(2.0 * math.pi * note_to_freq(shimmer_note) * t) * shimmer_amount * (0.35 + 0.65 * lead_env)

        sub = 0.0
        if sub_amount > 0.0:
            sub_freq = note_to_freq(root - 24 + scale[bass_idx])
            sub = math.sin(2.0 * math.pi * sub_freq * t) * sub_amount * (0.4 + 0.6 * bass_env)

        kick = 0.0
        if kick_pattern[sixteenth_i % len(kick_pattern)] == '1' and sixteenth_pos < 0.22:
            e = 1.0 - (sixteenth_pos / 0.22)
            kf = 45.0 + 85.0 * e
            kick = math.sin(2.0 * math.pi * kf * t) * (e * e) * 0.42
        elif beat_pos < 0.08:
            e = 1.0 - (beat_pos / 0.08)
            kf = 45.0 + 85.0 * e
            kick = math.sin(2.0 * math.pi * kf * t) * (e * e) * 0.16

        snare = 0.0
        if snare_pattern[sixteenth_i % len(snare_pattern)] == '1' and sixteenth_pos < 0.20:
            e = 1.0 - (sixteenth_pos / 0.20)
            snare = pseudo_noise(i, seed + 13) * e * 0.20

        hat = 0.0
        if hat_pattern[sixteenth_i % len(hat_pattern)] == '1' and sixteenth_pos < 0.12:
            e = 1.0 - (sixteenth_pos / 0.12)
            hat = pseudo_noise(i, seed + 29) * e * 0.08

        rain = pseudo_noise(i, seed + 41) * noise_amount

        dry = (lead + bass + pad + shimmer + sub + kick + snare + hat + rain) * drive
        delayed = delay_buf[delay_idx]
        sample = dry + delayed * echo_amount
        delay_buf[delay_idx] = dry + delayed * 0.46
        delay_idx = (delay_idx + 1) % delay

        sample = max(-1.0, min(1.0, sample * 0.88))
        out.append(int(sample * 32767.0))

    path.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(path), 'wb') as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sample_rate)
        wf.writeframes(out.tobytes())


def motif_svg(kind, c1, c2):
    if kind == 'neon':
        return f"<rect x='24' y='44' width='52' height='10' rx='5' fill='{c1}' opacity='0.5'/><rect x='30' y='22' width='40' height='6' rx='3' fill='{c2}' opacity='0.7'/>"
    if kind == 'cosmos':
        return f"<circle cx='20' cy='25' r='4' fill='{c1}'/><circle cx='78' cy='20' r='3' fill='{c2}'/><path d='M10 60 Q50 35 90 60' stroke='{c1}' stroke-width='2' fill='none' opacity='0.5'/>"
    if kind == 'volcano':
        return f"<path d='M30 68 L40 50 L50 68 Z' fill='{c1}' opacity='0.65'/><path d='M50 68 L60 48 L70 68 Z' fill='{c2}' opacity='0.65'/>"
    if kind == 'retro':
        return f"<path d='M10 66 L90 66' stroke='{c1}' stroke-width='2'/><path d='M18 58 L82 58' stroke='{c2}' stroke-width='1.5'/><path d='M26 50 L74 50' stroke='{c1}' stroke-width='1.2'/>"
    if kind == 'ruins':
        return f"<rect x='18' y='52' width='10' height='20' fill='{c2}' opacity='0.6'/><rect x='72' y='52' width='10' height='20' fill='{c2}' opacity='0.6'/><path d='M18 52 L28 52 L26 46 L20 46 Z' fill='{c1}' opacity='0.65'/>"
    if kind == 'moon':
        return f"<circle cx='24' cy='26' r='7' fill='{c1}' opacity='0.75'/><circle cx='28' cy='24' r='7' fill='#171b30' opacity='0.8'/><circle cx='74' cy='62' r='4' fill='{c2}' opacity='0.6'/>"
    if kind == 'crystal':
        return f"<polygon points='50,16 60,30 50,44 40,30' fill='{c1}' opacity='0.75'/><polygon points='30,58 38,68 30,78 22,68' fill='{c2}' opacity='0.6'/><polygon points='70,58 78,68 70,78 62,68' fill='{c2}' opacity='0.6'/>"
    if kind == 'city':
        return f"<rect x='20' y='52' width='8' height='20' fill='{c2}' opacity='0.65'/><rect x='30' y='46' width='9' height='26' fill='{c1}' opacity='0.6'/><rect x='42' y='50' width='7' height='22' fill='{c2}' opacity='0.7'/><rect x='54' y='44' width='9' height='28' fill='{c1}' opacity='0.62'/><rect x='66' y='48' width='8' height='24' fill='{c2}' opacity='0.7'/>"
    return ''


def frog_svg(ch_name, palette, motif, state):
    c1, c2, c3, c4 = palette
    state_cfg = {
        'frog': {'body_y': 56, 'eye_y': 37, 'mouth': "<path d='M36 62 Q50 70 64 62' stroke='#0a0a12' stroke-width='3' fill='none' stroke-linecap='round'/>"},
        'frog_up': {'body_y': 46, 'eye_y': 25, 'mouth': "<circle cx='50' cy='55' r='4' fill='#8b1a1a'/>"},
        'frog_dn': {'body_y': 62, 'eye_y': 43, 'mouth': "<path d='M38 66 Q50 72 62 66' stroke='#0a0a12' stroke-width='3' fill='none' stroke-linecap='round'/>"},
        'frog_c': {'body_y': 56, 'eye_y': 37, 'mouth': "<ellipse cx='50' cy='64' rx='10' ry='7' fill='#8b1a1a'/><ellipse cx='50' cy='66' rx='6' ry='3' fill='#ff9a9a'/>"},
    }[state]

    motif_block = motif_svg(motif, c1, c2)
    return f"""<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'>
  <defs>
    <filter id='shadow'><feDropShadow dx='0' dy='4' stdDeviation='3' flood-color='#000' flood-opacity='0.35'/></filter>
    <linearGradient id='bodyG' x1='0' y1='0' x2='0' y2='1'>
      <stop offset='0%' stop-color='{c1}'/>
      <stop offset='100%' stop-color='{c2}'/>
    </linearGradient>
  </defs>
  <g filter='url(#shadow)'>
    <ellipse cx='30' cy='88' rx='12' ry='9' fill='{c3}' opacity='0.7'/>
    <ellipse cx='70' cy='88' rx='12' ry='9' fill='{c3}' opacity='0.7'/>
    <ellipse cx='50' cy='{state_cfg['body_y']}' rx='31' ry='28' fill='url(#bodyG)'/>
    <ellipse cx='50' cy='{state_cfg['body_y'] + 6}' rx='20' ry='15' fill='{c4}' opacity='0.22'/>
    <circle cx='34' cy='{state_cfg['eye_y']}' r='10' fill='#ffffff'/>
    <circle cx='66' cy='{state_cfg['eye_y']}' r='10' fill='#ffffff'/>
    <circle cx='35' cy='{state_cfg['eye_y']}' r='4' fill='#0a0a12'/>
    <circle cx='65' cy='{state_cfg['eye_y']}' r='4' fill='#0a0a12'/>
    {state_cfg['mouth']}
    {motif_block}
  </g>
  <text x='50' y='12' text-anchor='middle' font-size='7' fill='{c4}' opacity='0.8'>{ch_name}</text>
</svg>
"""


def companion_svg(palette, motif):
    c1, c2, c3, c4 = palette
    motif_block = motif_svg(motif, c1, c2)
    return f"""<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'>
  <defs>
    <linearGradient id='g' x1='0' y1='0' x2='0' y2='1'>
      <stop offset='0%' stop-color='{c1}'/>
      <stop offset='100%' stop-color='{c2}'/>
    </linearGradient>
  </defs>
  <ellipse cx='50' cy='54' rx='32' ry='24' fill='url(#g)'/>
  <circle cx='38' cy='50' r='5' fill='#fff'/>
  <circle cx='62' cy='50' r='5' fill='#fff'/>
  <circle cx='38' cy='50' r='2' fill='#0a0a12'/>
  <circle cx='62' cy='50' r='2' fill='#0a0a12'/>
  <path d='M42 62 Q50 68 58 62' stroke='{c4}' stroke-width='2' fill='none' stroke-linecap='round'/>
  {motif_block}
  <rect x='18' y='24' width='64' height='4' rx='2' fill='{c3}' opacity='0.5'/>
</svg>
"""


def generate_for_chapter(num, cfg):
    cdir = ROOT / cfg['dir']
    audio_dir = cdir / 'audios'
    char_dir = cdir / 'personaje'
    audio_dir.mkdir(parents=True, exist_ok=True)
    char_dir.mkdir(parents=True, exist_ok=True)

    for ogg in audio_dir.glob('*.ogg'):
        try:
            ogg.unlink()
        except PermissionError:
            print(f"Warning: could not remove {ogg} (file is in use)")

    wav_path = audio_dir / f"{cfg['dir']}.wav"
    make_wav(wav_path, cfg, duration=20.0, sample_rate=22050, seed=num)

    for state in ('frog', 'frog_up', 'frog_dn', 'frog_c'):
        (char_dir / f"{state}.svg").write_text(
            frog_svg(cfg['name'], cfg['palette'], cfg['motif'], state),
            encoding='utf-8',
        )

    (char_dir / 'comp.svg').write_text(
        companion_svg(cfg['palette'], cfg['motif']),
        encoding='utf-8',
    )


def main():
    for chapter_num, chapter_cfg in CHAPTERS.items():
        generate_for_chapter(chapter_num, chapter_cfg)
        print(f"Generated audio+characters for chapter {chapter_num}: {chapter_cfg['dir']}")


if __name__ == '__main__':
    main()
