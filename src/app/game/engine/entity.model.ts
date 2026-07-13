export interface IEntity {
    x: number;
    y: number;
    w: number;
    h: number;
    update(dt: number): void;
    draw(ctx: CanvasRenderingContext2D, biomeRenderer?: any, ...args: any[]): void;
}

export abstract class BaseEntity implements IEntity {
    public x: number = 0;
    public y: number = 0;
    public w: number = 64;
    public h: number = 64;

    abstract update(dt: number): void;
    abstract draw(ctx: CanvasRenderingContext2D, biomeRenderer?: any, ...args: any[]): void;
}
