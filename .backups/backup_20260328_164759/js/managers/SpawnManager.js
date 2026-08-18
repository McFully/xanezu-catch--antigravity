import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../constants.js';
import { CHAPTER_REGISTRY } from '../core/ChapterRegistry.js';
import { Obstacle } from '../entities/Obstacle.js';
import { Fly } from '../entities/Fly.js';
import { Candy, BonusItem, PowerUp, LevelArtifact } from '../entities/Items.js';

/**
 * Manages the generation and distribution of entities in the game world.
 */
export class SpawnManager {
    /**
     * @param {import('../core/Game.js').Game} game 
     */
    constructor(game) {
        this.game = game;
        this.reset();
    }

    reset() {
        this._spawnIndex = 0;
        this._lastSpawnPos = 'bottom';
        this.dropStats = { chapter2: { coins: 0, artifacts: 0, gems: 0 }, total: { coins: 0, artifacts: 0, gems: 0 } };
        this.extraDropAcc = { artifact: 0, gem: 0, power: 0 };
        this.extraDropStats = { bananaRef: 0, artifact: 0, gem: 0, power: 0 };
    }

    /**
     * Entry point for standard item spawning logic.
     * @param {number} baseSpeed 
     */
    handleSpawning(baseSpeed) {
        if (this.game.activeBoss) return; // Suprimir spawn normal durante el jefe
        if (this.game.activeEvent === 'GOLDRUSH') { this.spawnBonus(baseSpeed); return; }

        // Long round-robin for maximum alternation: candy→powerup→candy→fly→candy→powerup→...
        // Bonus items (gems/artifacts) appear more frequently now
        const isArcadeMode = this.game?.stateManager?.isArcadeMode?.() === true;
        const isABLMode = this.game?.stateManager?.isABLMode?.() === true;
        const spawnOrder = isABLMode
            ? [
                'candy', 'powerup', 'fly', 'candy', 'bonus', 'powerup', 'candy', 'fly',
                'candy', 'bonus', 'powerup', 'candy', 'fly', 'bonus', 'candy', 'powerup',
                'fly', 'candy', 'bonus', 'powerup', 'candy', 'fly', 'bonus', 'candy'
            ]
            : isArcadeMode
                ? [
                    'candy', 'fly', 'candy', 'bonus', 'candy', 'powerup', 'fly', 'candy',
                    'bonus', 'candy', 'fly', 'candy', 'bonus', 'powerup', 'candy', 'fly',
                    'candy', 'bonus', 'fly', 'candy', 'powerup', 'bonus', 'candy', 'fly'
                ]
                : [
                    'candy', 'powerup', 'candy', 'fly', 'candy', 'powerup', 'candy', 'fly',
                    'powerup', 'candy', 'fly', 'candy', 'bonus', 'candy', 'fly', 'candy',
                    'candy', 'powerup', 'fly', 'candy', 'bonus', 'candy', 'fly', 'candy',
                    'powerup', 'candy', 'fly', 'candy', 'bonus', 'bonus'
                ];
        const type = spawnOrder[this._spawnIndex % spawnOrder.length];
        this._spawnIndex++;

        if (type === 'candy') this.spawnCandy(baseSpeed);
        else if (type === 'powerup') this.spawnPowerUp(baseSpeed);
        else if (type === 'fly') this.spawnFly(baseSpeed * 1.2);
        else this.spawnBonus(baseSpeed); // Coins: 1 in 30
    }

    _isAreaSafe(y, h, margin = 320) {
        // Check if any entity near the spawn entrance (right side) is too close vertically
        return !this.game.entities.some(e => {
            if (e.x > CANVAS_WIDTH - 500) {
                const overlap = Math.max(0, Math.min(y + h, e.y + e.h) - Math.max(y, e.y));
                if (overlap > 0 || Math.abs(y - (e.y + e.h)) < margin || Math.abs(e.y - (y + h)) < margin) {
                    return true;
                }
            }
            return false;
        });
    }

    _getAsset(key) {
        const loader = this.game.assetLoader;
        const chCache = loader.cache[`ch${this.game.chapter}`];

        // 1. Chapter-specific asset (Priority if not a missing-asset placeholder)
        if (chCache && chCache[key] && !chCache[key].isPlaceholder) return chCache[key];

        // 2. Global Default Skins (Requested by User)
        if (loader.globalObjects && loader.globalObjects[key]) return loader.globalObjects[key];

        // 3. Fallback to chapter placeholder or bootstrap assets
        return (chCache && chCache[key]) ? chCache[key] : this.game.assets[key];
    }

    spawnObs(s) {
        if (this.game.activeBoss) return; // No hay obstáculos ordinarios en modo jefe

        // Trigger de Jefe al final del capítulo (Nivel 30 para el primer jefe)
        if (this.game.level >= 30 && !this.game.isBossLevel) {
            this.game.triggerBossEncounter(this.game.chapter);
            return;
        }

        const runtimeDifficulty = this.game?.runtimeDifficulty || {};
        const rnd = Math.random();
        const movingChance = runtimeDifficulty.movingChance ?? 0.05;
        const gateChance = runtimeDifficulty.gateChance ?? 0.08;

        // Rare: Moving obstacle (5% chance)
        if (rnd > (1 - movingChance)) {
            this._spawnMovingObstacle(s);
            return;
        }

        const isAdaptiveMode = this.game?.stateManager?.isStoryMode?.() !== true;
        if (isAdaptiveMode && this.game.level >= 3 && rnd < gateChance) {
            this._spawnGate(s);
            return;
        }

        // Strict "Entre Dientes" Alternating Pattern (No Gates)
        if (this._lastSpawnPos === undefined) this._lastSpawnPos = 'bottom';

        let rY = 0;
        let rH = 300 + Math.random() * (CANVAS_HEIGHT * 0.4);

        if (this._lastSpawnPos === 'bottom') {
            rY = 0; // Spawn Top
            this._lastSpawnPos = 'top';
        } else {
            rY = CANVAS_HEIGHT - rH; // Spawn Bottom
            this._lastSpawnPos = 'bottom';
        }

        this._spawnSingleObs(s, rY, rH);
    }

    _spawnSingleObs(s, forcedY = null, forcedH = null) {
        const obstacleScale = this.game?.runtimeDifficulty?.obstacleScale ?? 1.0;
        const minHeight = 280 * obstacleScale;
        const maxExtra = (CANVAS_HEIGHT * 0.36) * obstacleScale;
        const h = forcedH !== null ? forcedH : (minHeight + Math.random() * maxExtra);
        let y = forcedY !== null ? forcedY : (CANVAS_HEIGHT - h); // Default to bottom if unspecified

        // Slight horizontal jitter for visual variety
        const jitterX = Math.random() * 160;

        // Safety check to avoid impossible bottlenecks
        if (forcedY === null && !this._isAreaSafe(y, h)) {
            // Try the opposite side if it's too risky
            const altY = y === 0 ? CANVAS_HEIGHT - h : 0;
            if (this._isAreaSafe(altY, h)) y = altY;
            else return; // Skip spawn this time to keep level fair
        }

        const config = this.game?.getActiveChapterConfig
            ? (this.game.getActiveChapterConfig(this.game.chapter) || CHAPTER_REGISTRY[1])
            : (CHAPTER_REGISTRY[this.game.chapter] || CHAPTER_REGISTRY[1]);
        const isABLMode = this.game?.stateManager?.isABLMode?.() === true;
        const levelIdx = ((this.game.level - 1) % 6) + 1;

        // Chapter 7: Lower bottom obstacles by 19px (0.5cm), larger ones get +19px more
        let chapter7Offset = 0;
        if (this.game.chapter === 7 && y > 0) {
            chapter7Offset = 19;
            if (h > 200) chapter7Offset += 19; // Extra 19px for larger obstacles
        }
        y += chapter7Offset;

        let assetImg = null;
        if (isABLMode) {
            assetImg = null; // ABL uses procedural obstacles only
        } else if (this.game.chapter === 1) {
            // El Capítulo 1 utiliza obstáculos temáticos (totems, lianas, serpientes, etc.)
            // Las claves están registradas en AssetLoader como obs_bot_NOMBRE y obs_top_NOMBRE
            const config = {
                bot: ['totem', 'tronco', 'ruina'],
                top: ['liana', 'serpiente']
            };
            
            // 30% de probabilidad de usar un obstáculo genérico del bioma (l01-l30) para variedad
            const useGeneric = Math.random() < 0.3;
            if (useGeneric) {
                const idx = String(Math.floor(Math.random() * 30) + 1).padStart(2, '0');
                const sidePrefix = y === 0 ? 'top' : 'bot';
                assetImg = this._getAsset(`obs_${sidePrefix}_l${idx}`);
            } else {
                if (y === 0) {
                    // Obstáculo superior
                    const type = config.top[Math.floor(Math.random() * config.top.length)];
                    assetImg = this._getAsset(`obs_top_${type}`);
                } else {
                    // Obstáculo inferior
                    const type = config.bot[Math.floor(Math.random() * config.bot.length)];
                    assetImg = this._getAsset(`obs_bot_${type}`);
                }
            }
            
            // Fallback en caso de que fallen los temáticos (usar genéricos obs_l01-06)
            if (!assetImg || assetImg.isPlaceholder) {
                const genIdx = Math.floor(Math.random() * 6) + 1;
                assetImg = this._getAsset(`obs_l0${genIdx}`);
            }
        } else if (this.game.chapter === 2) {
            const tops = ['lampara', 'toldo', 'cornisa', 'liana_seca', 'nido', 'candelabro', 'arana', 'cuerda'];
            const bots = ['cactus', 'craneo', 'obelisco', 'rodadora', 'vasija', 'arbusto', 'anubis'];
            if (y === 0) assetImg = this._getAsset('obs_top_' + tops[Math.floor(Math.random() * tops.length)]);
            else assetImg = this._getAsset('obs_bot_' + bots[Math.floor(Math.random() * bots.length)]);
        } else if (this.game.chapter === 3) {
            assetImg = y === 0 ? this._getAsset('obs_oni_red') : this._getAsset('obs_oni_blue');
        } else if (this.game.chapter === 4) {
            assetImg = y === 0 ? this._getAsset('obs_vines') : this._getAsset('obs_crystal');
        } else if (this.game.chapter === 5) {
            assetImg = y === 0 ? this._getAsset('obs_mud_roots') : this._getAsset('obs_mud_pit');
        } else if (this.game.chapter === 6) {
            assetImg = y === 0 ? this._getAsset('obs_toy_soldier_top') : this._getAsset('obs_toy_soldier_bot');
        } else if (this.game.chapter === 7) {
            assetImg = y === 0 ? this._getAsset('obs_pinata') : this._getAsset('obs_cactus_hat');
        } else if (this.game.chapter === 8) {
            assetImg = y === 0 ? this._getAsset('obs_ice_spike_top') : this._getAsset('obs_ice_spike_bot');
        } else if (this.game.chapter === 9) {
            assetImg = y === 0 ? this._getAsset('obs_arcade_neon_top') : this._getAsset('obs_arcade_neon_bot');
        } else if (this.game.chapter === 10) {
            assetImg = y === 0 ? this._getAsset('obs_space_sat_top') : this._getAsset('obs_space_sat_bot');
        } else if (this.game.chapter === 11) {
            assetImg = y === 0 ? this._getAsset('obs_lava_rock_top') : this._getAsset('obs_lava_rock_bot');
        } else if (this.game.chapter === 12) {
            assetImg = y === 0 ? this._getAsset('obs_retro_pylon_top') : this._getAsset('obs_retro_pylon_bot');
        } else if (this.game.chapter === 13) {
            assetImg = y === 0 ? this._getAsset('obs_ruin_arch_top') : this._getAsset('obs_ruin_arch_bot');
        } else if (this.game.chapter === 14) {
            assetImg = y === 0 ? this._getAsset('obs_moon_drill_top') : this._getAsset('obs_moon_drill_bot');
        } else if (this.game.chapter === 15) {
            assetImg = y === 0 ? this._getAsset('obs_crystal_shard_top') : this._getAsset('obs_crystal_shard_bot');
        } else if (this.game.chapter === 16) {
            assetImg = y === 0 ? this._getAsset('obs_city_beam_top') : this._getAsset('obs_city_beam_bot');
        } else {
            if (y === 0) assetImg = this._getAsset(`obs_top_l0${levelIdx}`) || this._getAsset(`obs_l0${levelIdx}`);
            else assetImg = this._getAsset(`obs_bot_l0${levelIdx}`) || this._getAsset(`obs_l0${levelIdx}`);
        }

        const activeCfg = this.game?.getActiveChapterConfig
            ? (this.game.getActiveChapterConfig(this.game.chapter) || config)
            : config;
        const obstacle = this.game.getObstacle(CANVAS_WIDTH + jitterX, y, 150, h, s, 0, activeCfg.obstacle || 'spike');
        if (assetImg) obstacle.thematicImg = assetImg;
        this.game.entities.push(obstacle);
    }

    _spawnGate(s) {
        const isABLMode = this.game?.stateManager?.isABLMode?.() === true;
        const baseGap = isABLMode ? 440 : 470;
        const gap = baseGap - Math.min(this.game.level * (isABLMode ? 6 : 5), isABLMode ? 70 : 55);
        const topH = 120 + Math.random() * (CANVAS_HEIGHT - gap - 240);
        const botY = topH + gap;
        const botH = CANVAS_HEIGHT - botY;

        this._spawnSingleObs(s, 0, topH);
        this._spawnSingleObs(s, botY, botH);
    }

    // Better implementation of patterns
    _spawnMovingObstacle(s) {
        const h = 320 + Math.random() * 120;
        const vy = (Math.random() > 0.5 ? 2.5 : -2.5) * (1 + this.game.level * 0.12);
        const jitterX = Math.random() * 100;
        const obstacle = new Obstacle(CANVAS_WIDTH + jitterX, Math.random() * (CANVAS_HEIGHT - h), 160, h, s, vy, 'moving');
        const levelIdx = ((this.game.level - 1) % 6) + 1;

        let assetImg = null;
        if (this.game?.stateManager?.isABLMode?.() === true) {
            assetImg = null; // ABL procedural
        }
        const chKey = `ch${this.game.chapter}`;
        const chCache = this.game.assetLoader.cache[chKey] || {};

        if (assetImg) {
            // keep preset
        } else if (this.game.chapter === 2) {
            // Chapter 2: robust fallback chain to avoid red rectangle
            assetImg = this._getAsset('obs_scorpion_desert')
                || this._getAsset('obs_scorpion')
                || this._getAsset('obs_bot_cactus')
                || this._getAsset('obs_top_toldo')
                || chCache['new_bg_ch2_l1_fondo_lejano'];
        } else if (this.game.chapter === 3) {
            assetImg = Math.random() > 0.5 ? this._getAsset('obs_oni_red') : this._getAsset('obs_oni_blue');
        } else if (this.game.chapter === 4) {
            assetImg = this._getAsset('obs_pixie');
        } else if (this.game.chapter === 5) {
            assetImg = this._getAsset('obs_mud_ghost');
        } else if (this.game.chapter === 6) {
            assetImg = this._getAsset('obs_toy_robot');
        } else if (this.game.chapter === 7) {
            assetImg = this._getAsset('obs_luchador');
        } else if (this.game.chapter === 8) {
            assetImg = this._getAsset('obs_penguin_sled');
        } else if (this.game.chapter === 9) {
            assetImg = this._lastSpawnPos === 'top' ? this._getAsset('obs_arcade_neon_top') : this._getAsset('obs_arcade_neon_bot');
        } else if (this.game.chapter === 10) {
            assetImg = this._lastSpawnPos === 'top' ? this._getAsset('obs_space_sat_top') : this._getAsset('obs_space_sat_bot');
        } else if (this.game.chapter === 11) {
            assetImg = this._lastSpawnPos === 'top' ? this._getAsset('obs_lava_rock_top') : this._getAsset('obs_lava_rock_bot');
        } else if (this.game.chapter === 12) {
            assetImg = this._lastSpawnPos === 'top' ? this._getAsset('obs_retro_pylon_top') : this._getAsset('obs_retro_pylon_bot');
        } else if (this.game.chapter === 13) {
            assetImg = this._lastSpawnPos === 'top' ? this._getAsset('obs_ruin_arch_top') : this._getAsset('obs_ruin_arch_bot');
        } else if (this.game.chapter === 14) {
            assetImg = this._lastSpawnPos === 'top' ? this._getAsset('obs_moon_drill_top') : this._getAsset('obs_moon_drill_bot');
        } else if (this.game.chapter === 15) {
            assetImg = this._lastSpawnPos === 'top' ? this._getAsset('obs_crystal_shard_top') : this._getAsset('obs_crystal_shard_bot');
        } else if (this.game.chapter === 16) {
            assetImg = this._lastSpawnPos === 'top' ? this._getAsset('obs_city_beam_top') : this._getAsset('obs_city_beam_bot');
        } else {
            assetImg = this._getAsset(`obs_l0${levelIdx}`);
        }

        if (assetImg) obstacle.thematicImg = assetImg;
        this.game.entities.push(obstacle);
    }

    spawnFly(s) {
        // Pattern: Fly with Candy trail
        const r = Math.random();
        const startY = Math.random() * (CANVAS_HEIGHT - 200) + 100;

        let t = 'banana', img = this._getAsset('banana');
        if (r > 0.92) { t = 'heart'; img = this._getAsset('heart'); }
        else if (r > 0.75) { t = 'gold'; img = this._getAsset('fly_gold'); }
        else if (r > 0.60) { t = 'bomb'; img = this._getAsset('bomb'); } // 15% chance bomb

        const jitterX = Math.random() * 200;
        if (!this._isAreaSafe(startY, 90, 70)) return;
        
        const mainFly = this.game.getFly(CANVAS_WIDTH + jitterX, startY, t, img, s);
        this.game.entities.push(mainFly);

        // Story bonus distribution based on banana baseline:
        // +100% extra drops from banana count split 60/30/10
        if (t === 'banana') {
            this._spawnExtrasFromBananaReference(s);
        }
    }

    _isStoryMode() {
        return this.game?.stateManager?.isStoryMode?.() === true;
    }

    _spawnExtrasFromBananaReference(s) {
        if (!this._isStoryMode()) return;

        this.extraDropStats.bananaRef += 1;
        this.extraDropAcc.artifact += 0.6;
        this.extraDropAcc.gem += 0.3;
        this.extraDropAcc.power += 0.1;

        let type = 'artifact';
        if (this.extraDropAcc.gem > this.extraDropAcc[type]) type = 'gem';
        if (this.extraDropAcc.power > this.extraDropAcc[type]) type = 'power';

        this.extraDropAcc[type] -= 1.0;
        this._spawnExtraDrop(type, s);
    }

    _spawnExtraDrop(type, s) {
        const jitterX = Math.random() * 120;
        const y = Math.random() * (CANVAS_HEIGHT - 140) + 70;
        if (!this._isAreaSafe(y, 80, 70)) return;

        if (type === 'artifact') {
            const artifactLevel = Math.max(1, Math.min(this.game.level, 10));
            const art = this.game.getArtifact(CANVAS_WIDTH + jitterX, y, artifactLevel, s);
            this.game.entities.push(art);
            this.extraDropStats.artifact++;
            return;
        }

        if (type === 'gem') {
            if (!this._extraGemIndex) this._extraGemIndex = 0;
            const gems = ['ruby', 'crown', 'emerald', 'pearl', 'diamond'];
            const gemType = gems[this._extraGemIndex % gems.length];
            this._extraGemIndex++;
            const gem = this.game.getBonus(CANVAS_WIDTH + jitterX, y, gemType, this._getAsset(gemType), s);
            this.game.entities.push(gem);
            this.extraDropStats.gem++;
            return;
        }

        const powerTypes = ['hourglass', 'magnet', 'shield', 'star', 'clock', 'ghost', 'bolt', 'ice', 'clover', 'rainbow', 'heart'];
        if (!this._extraPowerIndex) this._extraPowerIndex = 0;
        const pType = powerTypes[this._extraPowerIndex % powerTypes.length];
        this._extraPowerIndex++;
        const p = this.game.getPowerUp(CANVAS_WIDTH + jitterX, y, pType, this._getAsset(pType), s);
        this.game.entities.push(p);
        this.extraDropStats.power++;
    }

    spawnCandy(s) {
        const types = ['red', 'orange', 'yellow', 'green', 'cyan', 'blue', 'purple', 'pink', 'brown', 'grey'];
        // Cycle through colors for variety
        if (!this._candyIndex) this._candyIndex = 0;
        const type = types[this._candyIndex % types.length];
        this._candyIndex++;
        const y = Math.random() * (CANVAS_HEIGHT - 120) + 60;

        // Items also respect safety margins to avoid being "inside" obstacles
        const jitterX = Math.random() * 120;
        if (this._isAreaSafe(y, 40, 60)) {
            const candy = this.game.getCandy(CANVAS_WIDTH + jitterX, y, type, this._getAsset(`candy_${type}`), s);
            this.game.entities.push(candy);
        }
    }

    spawnBonus(s) {
        const jitterX = Math.random() * 100;
        const y = Math.random() * (CANVAS_HEIGHT - 120) + 60;
        const isStoryChapter2 = this._isStoryMode() && this.game.chapter === 2;
        // More gems/artifacts globally, and even more in chapter 2
        const coinChance = isStoryChapter2 ? 0.10 : 0.15;
        if (Math.random() < coinChance) {
            type = 'coin';
            this.dropStats.total.coins++;
            if (isStoryChapter2) this.dropStats.chapter2.coins++;
        } else {
            // Artifact split: higher in chapter 2
            const artifactChance = isStoryChapter2 ? 0.40 : 0.25;
            if (Math.random() < artifactChance) {
                const artifactLevel = Math.max(1, Math.min(this.game.level, 10));
                const ay = Math.random() * (CANVAS_HEIGHT - 120) + 60;
                if (this._isAreaSafe(ay, 80, 80)) {
                    const art = this.game.getArtifact(CANVAS_WIDTH + jitterX, ay, artifactLevel, s);
                    this.game.entities.push(art);
                    this.dropStats.total.artifacts++;
                    if (isStoryChapter2) this.dropStats.chapter2.artifacts++;
                    return;
                }
            }
            const types = ['ruby', 'crown', 'emerald', 'pearl', 'diamond'];
            if (!this._bonusIndex) this._bonusIndex = 0;
            type = types[this._bonusIndex % types.length];
            this._bonusIndex++;
            this.dropStats.total.gems++;
            if (isStoryChapter2) this.dropStats.chapter2.gems++;
        }
        const startY = (type === 'coin')
            ? (CANVAS_HEIGHT * 0.5) + (Math.random() * (CANVAS_HEIGHT * 0.16) - (CANVAS_HEIGHT * 0.08))
            : y;
        if (this._isAreaSafe(startY, 80, 70)) {
            const bonus = this.game.getBonus(CANVAS_WIDTH + jitterX, startY, type, this._getAsset(type), s);
            this.game.entities.push(bonus);
        }
    }

    spawnPowerUp(s) {
        // Reducido a drop regular o levemente raro (pasamos del 1% standalone a incluirlo en la queue equitativa)
        let types = ['hourglass', 'magnet', 'shield', 'star', 'clock', 'ghost', 'bolt', 'ice', 'clover', 'rainbow', 'heart'];
        const activeCfg = this.game?.getActiveChapterConfig
            ? this.game.getActiveChapterConfig(this.game.chapter)
            : null;
        const biome = String(activeCfg?.biome || activeCfg?.bg || '').toLowerCase();

        // Cold biomes bias toward winter power-ups.
        if (/ice|crystal|winter|snow/.test(biome)) {
            const winterTypes = ['firework', 'winter_sun', 'ski', 'thermal_suit', 'ice_warm', 'aurora'];
            if (Math.random() < 0.3) { // 30% chance for winter power-up
                types = winterTypes;
            }
        }

        // Cycle through all power-up types for maximum variety
        if (!this._powerUpIndex) this._powerUpIndex = 0;
        const type = types[this._powerUpIndex % types.length];
        this._powerUpIndex++;
        const jitterX = Math.random() * 150;
        const y = Math.random() * (CANVAS_HEIGHT - 120) + 60;
        if (this._isAreaSafe(y, 80, 70)) {
            const p = this.game.getPowerUp(CANVAS_WIDTH + jitterX, y, type, this._getAsset(type), s);
            this.game.entities.push(p);
        }
    }
}
