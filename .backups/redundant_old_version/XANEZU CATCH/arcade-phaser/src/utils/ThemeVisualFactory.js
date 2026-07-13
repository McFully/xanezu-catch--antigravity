import { getChapterById } from '../config/chaptersConfig.js';

export function chapterPalette(chapterId) {
  const chapter = getChapterById(chapterId);
  return chapter.palette || [0x4f46e5, 0x60a5fa, 0xfacc15];
}

export function ensureChapterTextures(scene, chapterId) {
  const [c1, c2, c3] = chapterPalette(chapterId);
  const playerKey = `abl_player_${chapterId}`;
  const obstacleKey = `abl_obstacle_${chapterId}`;

  if (!scene.textures.exists(playerKey)) {
    const g = scene.add.graphics();
    g.clear();
    g.fillStyle(c1, 1);
    g.fillCircle(26, 26, 24);
    g.fillStyle(c2, 0.85);
    g.fillCircle(18, 20, 7);
    g.fillCircle(34, 20, 7);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(18, 20, 3);
    g.fillCircle(34, 20, 3);
    g.fillStyle(c3, 0.7);
    g.fillRoundedRect(12, 34, 28, 10, 5);
    g.generateTexture(playerKey, 52, 52);
    g.destroy();
  }

  if (!scene.textures.exists(obstacleKey)) {
    const g = scene.add.graphics();
    g.clear();
    g.fillStyle(c2, 1);
    g.fillRoundedRect(3, 3, 50, 50, 10);
    g.fillStyle(c1, 0.8);
    g.fillTriangle(28, 8, 42, 34, 14, 34);
    g.fillStyle(c3, 0.85);
    g.fillRect(8, 40, 40, 7);
    g.generateTexture(obstacleKey, 56, 56);
    g.destroy();
  }

  return { playerKey, obstacleKey, palette: [c1, c2, c3] };
}
