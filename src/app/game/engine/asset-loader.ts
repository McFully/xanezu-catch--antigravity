export class AssetLoader {
  public cache: Map<string, HTMLImageElement> = new Map();
  public onProgress: ((progress: number) => void) | null = null;
  public onAssetLoaded: ((name: string) => void) | null = null;

  public loadImage(url: string): Promise<HTMLImageElement | null> {
    const cached = this.cache.get(url);
    if (cached) return Promise.resolve(cached);

    return new Promise((resolve) => {
      const img = new Image();
      const timeout = setTimeout(() => resolve(null), 5000);

      img.onload = () => {
        clearTimeout(timeout);
        this.cache.set(url, img);
        resolve(img);
      };
      img.onerror = () => {
        clearTimeout(timeout);
        resolve(null);
      };
      img.src = url;
    });
  }

  public async loadBatch(
    items: { key: string; url: string; fallbackUrl?: string; label?: string }[],
    targetMap: Map<string, HTMLImageElement>,
    onItemLoaded?: (label: string) => void
  ): Promise<void> {
    const total = items.length;
    if (total === 0) {
      if (this.onProgress) this.onProgress(100);
      return;
    }

    let completed = 0;
    const tasks = items.map(async (entry) => {
      let img = await this.loadImage(entry.url);
      let usedFallback = false;
      if (!img && entry.fallbackUrl) {
        img = await this.loadImage(entry.fallbackUrl);
        usedFallback = true;
      }

      if (img) {
        targetMap.set(entry.key, img);
      }

      completed++;
      const label = entry.label || entry.key;
      const finalLabel = usedFallback ? `${label} (FALLBACK)` : label;
      if (this.onAssetLoaded) this.onAssetLoaded(finalLabel);
      if (onItemLoaded) onItemLoaded(finalLabel);
      if (this.onProgress) {
        this.onProgress(Math.floor((completed / total) * 100));
      }
    });

    await Promise.all(tasks);
  }

  public clearAll(): void {
    this.cache.clear();
  }
}
