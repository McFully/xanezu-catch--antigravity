import { LOGICAL_WIDTH } from '../engine/engine.constants';

export class AbliaPrimitives {
  public static drawStructureByCivilization(
    ctx: CanvasRenderingContext2D,
    civilization: string,
    w: number,
    h: number
  ): void {
    switch (civilization) {
      case 'maya':
      case 'azteca':
      case 'inca':
        this.drawPyramid(ctx, w, h);
        break;
      case 'egipto':
      case 'sumeria':
      case 'fenicia':
        this.drawObelisk(ctx, w * 0.4, h * 1.2);
        break;
      case 'grecia':
      case 'roma':
      case 'persa':
        this.drawParthenon(ctx, w, h);
        break;
      case 'nordica':
      case 'nordico':
        this.drawLonghouse(ctx, w, h * 0.7);
        break;
      case 'japonesa':
      case 'hindu':
        this.drawPagoda(ctx, w * 0.8, h);
        break;
      case 'babilonia':
        this.drawZiggurat(ctx, w, h);
        break;
      case 'china':
        this.drawGreatWall(ctx, w, h * 0.5);
        break;
      default:
        this.drawMonolith(ctx, w, h);
        break;
    }
  }

  public static drawPyramid(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    ctx.beginPath();
    ctx.moveTo(-w / 2, 0);
    ctx.lineTo(0, -h);
    ctx.lineTo(w / 2, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    for (let i = 1; i < 5; i++) {
      const stepY = -h * (i / 5);
      const stepW = w * (1 - i / 5);
      ctx.moveTo(-stepW / 2, stepY);
      ctx.lineTo(stepW / 2, stepY);
    }
    ctx.stroke();
  }

  public static drawObelisk(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    ctx.beginPath();
    ctx.moveTo(-w / 2, 0);
    ctx.lineTo(-w / 2, -h + w);
    ctx.lineTo(0, -h);
    ctx.lineTo(w / 2, -h + w);
    ctx.lineTo(w / 2, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  public static drawParthenon(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    ctx.fillRect(-w / 2, -20, w, 20);
    ctx.strokeRect(-w / 2, -20, w, 20);

    const colW = w / 8;
    for (let i = 0; i < 4; i++) {
      const cx = -w / 2 + (i + 1) * (w / 5);
      ctx.fillRect(cx - colW / 2, -h, colW, h - 20);
      ctx.strokeRect(cx - colW / 2, -h, colW, h - 20);
    }

    ctx.beginPath();
    ctx.moveTo(-w / 2 - 10, -h);
    ctx.lineTo(w / 2 + 10, -h);
    ctx.lineTo(0, -h - 40);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  public static drawMonolith(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    ctx.beginPath();
    ctx.roundRect(-w / 2, -h, w, h, 20);
    ctx.fill();
    ctx.stroke();
  }

  public static drawLonghouse(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    ctx.beginPath();
    ctx.moveTo(-w / 2, 0);
    ctx.lineTo(-w / 2, -h * 0.4);
    ctx.lineTo(0, -h);
    ctx.lineTo(w / 2, -h * 0.4);
    ctx.lineTo(w / 2, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-w / 2 - 10, -h * 0.4);
    ctx.lineTo(10, -h - 10);
    ctx.moveTo(w / 2 + 10, -h * 0.4);
    ctx.lineTo(-10, -h - 10);
    ctx.stroke();
  }

  public static drawPagoda(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    const stories = 3;
    for (let i = 0; i < stories; i++) {
      const sw = w * (1 - i * 0.2);
      const sh = -h * (i / stories);
      ctx.fillRect(-sw / 2, sh - h / stories, sw, h / stories);
      ctx.strokeRect(-sw / 2, sh - h / stories, sw, h / stories);
      ctx.beginPath();
      ctx.moveTo(-sw / 2 - 20, sh - h / stories);
      ctx.quadraticCurveTo(0, sh - h / stories - 20, sw / 2 + 20, sh - h / stories);
      ctx.stroke();
    }
  }

  public static drawZiggurat(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    const steps = 4;
    for (let i = 0; i < steps; i++) {
      const sw = w * (1 - i * 0.2);
      const sy = -h * (i / steps);
      ctx.fillRect(-sw / 2, sy - h / steps, sw, h / steps);
      ctx.strokeRect(-sw / 2, sy - h / steps, sw, h / steps);
    }
  }

  public static drawGreatWall(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    ctx.fillRect(-w / 2, -h, w, h);
    ctx.strokeRect(-w / 2, -h, w, h);
    const count = 5;
    for (let i = 0; i < count; i++) {
      ctx.fillRect(-w / 2 + (i * w) / count, -h - 20, w / (count * 2), 20);
      ctx.strokeRect(-w / 2 + (i * w) / count, -h - 20, w / (count * 2), 20);
    }
  }

  public static drawCartoonGlyph(ctx: CanvasRenderingContext2D, size: number, color: string): void {
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
    ctx.moveTo(-size / 3, 0);
    ctx.lineTo(size / 3, 0);
    ctx.moveTo(0, -size / 3);
    ctx.lineTo(0, size / 3);
    ctx.stroke();

    ctx.globalAlpha = 0.3;
    ctx.shadowBlur = 10;
    ctx.shadowColor = color;
    ctx.stroke();
  }

  public static drawDragon(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, t: number, accent: string): void {
    ctx.save();
    ctx.translate(x, y);
    ctx.strokeStyle = accent;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    for (let i = 0; i < size; i += 10) {
      ctx.lineTo(i, Math.sin(t + i * 0.05) * 20);
    }
    ctx.stroke();
    ctx.restore();
  }

  public static drawBird(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, t: number): void {
    const wing = Math.sin(t * 10 + x * 0.1) * 5;
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - size, y + wing);
    ctx.lineTo(x, y);
    ctx.lineTo(x + size, y + wing);
    ctx.stroke();
  }

  public static drawAurora(ctx: CanvasRenderingContext2D, t: number): void {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 3; i++) {
      const grad = ctx.createLinearGradient(0, 0, 0, 300);
      grad.addColorStop(0, 'rgba(0, 255, 150, 0)');
      grad.addColorStop(0.5, 'rgba(0, 255, 150, 0.2)');
      grad.addColorStop(1, 'rgba(0, 255, 150, 0)');

      ctx.fillStyle = grad;
      const y = 50 + Math.sin(t * 0.2 + i) * 30;
      ctx.beginPath();
      ctx.moveTo(0, y);
      for (let x = 0; x < LOGICAL_WIDTH; x += 50) {
        ctx.lineTo(x, y + Math.sin(x * 0.01 + t * 0.5 + i) * 60);
      }
      ctx.lineTo(LOGICAL_WIDTH, 400);
      ctx.lineTo(0, 400);
      ctx.fill();
    }
    ctx.restore();
  }
}
