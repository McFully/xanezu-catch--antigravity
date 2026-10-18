import { EngineState, LOGICAL_WIDTH, LOGICAL_HEIGHT } from '../engine/engine.constants';
import { Obstacle } from '../entities/obstacle';
import { IEntity } from '../engine/entity.model';
import { Player } from '../entities/player';
import { ParticleSystem } from '../engine/particle-system';
import { BiomeRenderer } from './biome-renderer';
import { AbliaRenderer } from './ablia-renderer';
import { LoadingRenderer } from './loading-renderer';

export interface SceneRenderState {
  ctx: CanvasRenderingContext2D;
  canvasWidth: number;
  canvasHeight: number;
  state: EngineState;
  mode: string;
  level: number;
  bgScrollX: number;
  trauma: number;
  flashT: number;
  flashColor: string;
  entities: IEntity[];
  player: Player;
  particles: ParticleSystem;
  biomeRenderer: BiomeRenderer;
  abliaRenderer: AbliaRenderer;
  loadingRenderer: LoadingRenderer;
}

export class SceneRenderer {
  public static render(s: SceneRenderState): void {
    const { ctx } = s;
    ctx.save();
    ctx.scale(s.canvasWidth / LOGICAL_WIDTH, s.canvasHeight / LOGICAL_HEIGHT);
    const isStory = s.mode.toLowerCase() === 'story';
    const isAblia = s.mode.toUpperCase() === 'ABLIA';

    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);

    // En modo Story (fondos.md), el fondo se dibuja fijo e inalterable antes de cualquier shake
    if (isStory) {
      s.biomeRenderer.drawBackground(ctx, 0, s.mode);
    }

    let shakeX = 0;
    let shakeY = 0;
    if (s.trauma > 0) {
      const shake = Math.pow(s.trauma, 2) * 12;
      shakeX += (Math.random() - 0.5) * shake;
      shakeY += (Math.random() - 0.5) * shake;
    }
    if (isAblia) {
      const time = performance.now() * 0.0005;
      shakeX += Math.sin(time * 0.5) * 0.8;
      shakeY += Math.cos(time * 0.4) * 0.4;
    }
    ctx.translate(shakeX, shakeY);

    if (!isStory) {
      if (isAblia) s.abliaRenderer.drawBackground(ctx, s.bgScrollX);
      else s.biomeRenderer.drawBackground(ctx, s.bgScrollX, s.mode);
    }

    if (s.state === EngineState.LOADING) {
      s.loadingRenderer.draw(ctx, performance.now());
    } else {
      for (const ent of s.entities) {
        if (ent instanceof Obstacle) ent.draw(ctx, s.biomeRenderer, s.level);
        else ent.draw(ctx, s.biomeRenderer);
      }
      s.player.draw(ctx, s.biomeRenderer);
      s.particles.draw(ctx);

      if (isAblia) s.abliaRenderer.drawForeground(ctx, s.bgScrollX);
      else if (!isStory) s.biomeRenderer.drawForeground(ctx, s.bgScrollX, s.mode);
    }

    if (!isStory && s.flashT > 0) {
      ctx.globalAlpha = Math.min(0.3, s.flashT / 10);
      ctx.fillStyle = s.flashColor;
      ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
    }
    ctx.restore();
  }
}
