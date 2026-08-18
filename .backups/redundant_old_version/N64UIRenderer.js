export class N64UIRenderer {
    constructor() {
        this.cache = new Map();
        this.frame = 0;
    }

    clearCache() {
        this.cache.clear();
    }

    createGradientPanel(w, h, options = {}) {
        const {
            colors = ['#2a1f4e', '#1a1030'],
            direction = 'vertical',
            borderRadius = 12,
            bevel = true,
            borderWidth = 3,
            borderColors = { light: '#6b5b9a', dark: '#0d0818' }
        } = options;

        const key = `panel_${w}_${h}_${colors.join('-')}_${borderRadius}`;
        if (this.cache.has(key)) return this.cache.get(key);

        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');

        ctx.save();
        
        if (borderRadius > 0) {
            this.roundRect(ctx, 0, 0, w, h, borderRadius);
            ctx.clip();
        }

        const gradient = direction === 'vertical'
            ? ctx.createLinearGradient(0, 0, 0, h)
            : ctx.createLinearGradient(0, 0, w, 0);
        
        colors.forEach((color, i) => {
            gradient.addColorStop(i / (colors.length - 1), color);
        });
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);

        if (bevel) {
            ctx.globalCompositeOperation = 'source-atop';
            this.drawBevel(ctx, w, h, borderRadius, borderWidth, borderColors);
        }

        ctx.restore();

        if (bevel) {
            this.drawBeveledBorder(ctx, w, h, borderRadius, borderWidth, borderColors);
        }

        this.cache.set(key, canvas);
        return canvas;
    }

    roundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    }

    drawBevel(ctx, w, h, r, bw, colors) {
        ctx.save();
        
        ctx.globalCompositeOperation = 'source-atop';
        
        const lightGrad = ctx.createLinearGradient(0, 0, 0, h * 0.4);
        lightGrad.addColorStop(0, colors.light + '60');
        lightGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = lightGrad;
        ctx.fillRect(0, 0, w, h * 0.5);

        const darkGrad = ctx.createLinearGradient(0, h * 0.6, 0, h);
        darkGrad.addColorStop(0, 'transparent');
        darkGrad.addColorStop(1, colors.dark + '80');
        ctx.fillStyle = darkGrad;
        ctx.fillRect(0, h * 0.5, w, h * 0.5);

        ctx.restore();
    }

    drawBeveledBorder(ctx, w, h, r, bw, colors) {
        ctx.save();
        
        ctx.lineWidth = bw;
        
        ctx.beginPath();
        ctx.moveTo(bw/2 + r, bw/2);
        ctx.lineTo(w - bw/2 - r, bw/2);
        ctx.quadraticCurveTo(w - bw/2, bw/2, w - bw/2, bw/2 + r);
        ctx.lineTo(w - bw/2, h - bw/2 - r);
        ctx.quadraticCurveTo(w - bw/2, h - bw/2, w - bw/2 - r, h - bw/2);
        ctx.lineTo(bw/2 + r, h - bw/2);
        ctx.quadraticCurveTo(bw/2, h - bw/2, bw/2, h - bw/2 - r);
        ctx.lineTo(bw/2, bw/2 + r);
        ctx.quadraticCurveTo(bw/2, bw/2, bw/2 + r, bw/2);
        ctx.closePath();
        ctx.strokeStyle = colors.light;
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(bw/2 + r, h - bw/2);
        ctx.lineTo(bw/2, h - bw/2 - r);
        ctx.quadraticCurveTo(bw/2, h - bw/2, bw/2 + r, h - bw/2);
        ctx.lineTo(w - bw/2 - r, h - bw/2);
        ctx.quadraticCurveTo(w - bw/2, h - bw/2, w - bw/2, h - bw/2 - r);
        ctx.lineTo(w - bw/2, bw/2 + r);
        ctx.quadraticCurveTo(w - bw/2, bw/2, w - bw/2 - r, bw/2);
        ctx.lineTo(bw/2 + r, bw/2);
        ctx.quadraticCurveTo(bw/2, bw/2, bw/2, bw/2 + r);
        ctx.closePath();
        ctx.strokeStyle = colors.dark;
        ctx.stroke();

        ctx.restore();
    }

    createN64Button(w, h, text, options = {}) {
        const {
            primary = true,
            hovered = false,
            pressed = false,
            icon = null
        } = options;

        const key = `btn_${w}_${h}_${text}_${primary}_${hovered}_${pressed}`;
        if (this.cache.has(key)) return this.cache.get(key);

        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');

        const baseColor = primary ? '#32CD32' : '#FFD700';
        const lightColor = primary ? '#7FFF00' : '#FFEC8B';
        const darkColor = primary ? '#228B22' : '#DAA520';
        const borderColors = { light: lightColor, dark: darkColor };

        const offset = pressed ? 3 : 0;
        const scale = pressed ? 0.98 : 1;
        
        ctx.save();
        ctx.translate(w/2, h/2);
        ctx.scale(scale, scale);
        ctx.translate(-w/2, -h/2);

        const panel = this.createGradientPanel(w, h - 8, {
            colors: hovered 
                ? [this.lightenColor(baseColor, 30), this.lightenColor(baseColor, -10)]
                : [baseColor, this.darkenColor(baseColor, 30)],
            borderRadius: 20,
            bevel: true,
            borderWidth: 4,
            borderColors
        });
        
        ctx.drawImage(panel, 0, offset);

        if (hovered && !pressed) {
            this.drawGlow(ctx, w, h, baseColor);
        }

        if (icon) {
            ctx.font = `${h * 0.4}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(icon, w * 0.15, h/2 + offset);
        }

        ctx.font = `bold ${h * 0.28}px "Press Start 2P", "Courier New", monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        ctx.fillStyle = '#000';
        ctx.fillText(text, w/2 + 2, h/2 + offset + 2);
        
        ctx.fillStyle = '#FFF';
        ctx.fillText(text, w/2, h/2 + offset);

        ctx.restore();

        this.cache.set(key, canvas);
        return canvas;
    }

    drawGlow(ctx, w, h, color) {
        ctx.save();
        ctx.globalAlpha = 0.3;
        ctx.shadowColor = color;
        ctx.shadowBlur = 30;
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, w, h);
        ctx.restore();
    }

    createN64Sphere(size, color1, color2) {
        const key = `sphere_${size}_${color1}_${color2}`;
        if (this.cache.has(key)) return this.cache.get(key);

        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        const cx = size / 2;
        const cy = size / 2;
        const r = size / 2 - 2;

        const gradient = ctx.createRadialGradient(
            cx - r * 0.3, cy - r * 0.3, r * 0.1,
            cx, cy, r
        );
        gradient.addColorStop(0, color1);
        gradient.addColorStop(0.5, color2);
        gradient.addColorStop(1, this.darkenColor(color2, 50));

        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(cx - r * 0.3, cy - r * 0.3, r * 0.25, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(cx - r * 0.15, cy - r * 0.15, r * 0.1, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.fill();

        this.cache.set(key, canvas);
        return canvas;
    }

    createStarfield(width, height, count = 50) {
        const key = `stars_${width}_${height}_${count}`;
        if (this.cache.has(key)) return this.cache.get(key);

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        for (let i = 0; i < count; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            const size = Math.random() * 3 + 1;
            const alpha = Math.random() * 0.7 + 0.3;
            
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.fill();
        }

        this.cache.set(key, canvas);
        return canvas;
    }

    createTitle(text, options = {}) {
        const {
            fontSize = 48,
            primaryColor = '#FFD700',
            secondaryColor = '#FF6B35'
        } = options;

        const key = `title_${text}_${fontSize}`;
        if (this.cache.has(key)) return this.cache.get(key);

        const padding = 20;
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        ctx.font = `bold ${fontSize}px "Press Start 2P", "Courier New", monospace`;
        const metrics = ctx.measureText(text);
        
        canvas.width = metrics.width + padding * 2;
        canvas.height = fontSize * 1.5 + padding * 2;

        ctx.font = `bold ${fontSize}px "Press Start 2P", "Courier New", monospace`;
        
        ctx.fillStyle = '#000';
        ctx.fillText(text, padding + 4, padding + fontSize + 4);
        
        ctx.fillStyle = secondaryColor;
        ctx.fillText(text, padding + 2, padding + fontSize + 2);
        
        ctx.fillStyle = primaryColor;
        ctx.fillText(text, padding, padding + fontSize);

        this.cache.set(key, canvas);
        return canvas;
    }

    createMenuGrid(items, options = {}) {
        const {
            columns = 2,
            itemWidth = 180,
            itemHeight = 60,
            spacing = 20
        } = options;

        const rows = Math.ceil(items.length / columns);
        const width = columns * itemWidth + (columns - 1) * spacing;
        const height = rows * itemHeight + (rows - 1) * spacing;

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        items.forEach((item, index) => {
            const col = index % columns;
            const row = Math.floor(index / columns);
            const x = col * (itemWidth + spacing);
            const y = row * (itemHeight + spacing);

            const btn = this.createN64Button(itemWidth, itemHeight, item.text, {
                primary: item.primary !== false,
                hovered: item.hovered || false,
                pressed: item.pressed || false,
                icon: item.icon || null
            });

            ctx.drawImage(btn, x, y);
        });

        return canvas;
    }

    createLoadingSpinner(size, color = '#FFD700') {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        const cx = size / 2;
        const cy = size / 2;
        const radius = size / 2 - 10;

        ctx.lineWidth = 8;
        ctx.lineCap = 'round';

        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2 - Math.PI / 2;
            const alpha = (i + this.frame) % 12 / 12;
            
            ctx.beginPath();
            ctx.arc(cx, cy, radius, angle, angle + 0.5);
            ctx.strokeStyle = this.hexToRgba(color, alpha);
            ctx.stroke();
        }

        this.frame++;
        return canvas;
    }

    createDecorativeSphere(x, y, radius, color1, color2, time) {
        const canvas = document.createElement('canvas');
        const size = radius * 2 + 20;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        const offsetX = Math.sin(time * 0.001) * 5;
        const offsetY = Math.cos(time * 0.0015) * 5;

        const sphere = this.createN64Sphere(radius * 2, color1, color2);
        ctx.drawImage(sphere, 10 + offsetX, 10 + offsetY);

        return canvas;
    }

    createCursorArrow(size, color = '#FFD700') {
        const key = `cursor_${size}_${color}`;
        if (this.cache.has(key)) return this.cache.get(key);

        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        ctx.save();
        ctx.translate(size / 2, size / 2);
        
        ctx.beginPath();
        ctx.moveTo(0, -size / 2);
        ctx.lineTo(size / 2, size / 3);
        ctx.lineTo(size / 6, size / 3);
        ctx.lineTo(size / 6, size / 2);
        ctx.lineTo(-size / 6, size / 2);
        ctx.lineTo(-size / 6, size / 3);
        ctx.lineTo(-size / 2, size / 3);
        ctx.closePath();

        ctx.fillStyle = color;
        ctx.fill();

        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.restore();

        this.cache.set(key, canvas);
        return canvas;
    }

    lightenColor(hex, percent) {
        const num = parseInt(hex.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.min(255, (num >> 16) + amt);
        const G = Math.min(255, ((num >> 8) & 0x00FF) + amt);
        const B = Math.min(255, (num & 0x0000FF) + amt);
        return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
    }

    darkenColor(hex, percent) {
        return this.lightenColor(hex, -percent);
    }

    hexToRgba(hex, alpha) {
        const num = parseInt(hex.replace('#', ''), 16);
        const r = (num >> 16) & 255;
        const g = (num >> 8) & 255;
        const b = num & 255;
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    createMarqueeText(text, width, fontSize = 24, speed = 2) {
        const key = `marquee_${text}_${width}_${fontSize}_${this.frame}`;
        
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = fontSize + 10;
        const ctx = canvas.getContext('2d');

        const offset = (this.frame * speed) % (text.length * fontSize + width);
        
        ctx.font = `bold ${fontSize}px "Press Start 2P", monospace`;
        ctx.fillStyle = '#FFD700';
        ctx.textAlign = 'left';
        
        ctx.fillText(text, width - offset, fontSize);
        
        if (width - offset > 0) {
            ctx.fillText(text, width - offset + text.length * fontSize + 50, fontSize);
        }

        this.frame++;
        return canvas;
    }
}
