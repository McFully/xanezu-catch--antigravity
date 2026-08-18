import { Game } from './core/Game.js';
import { CHAPTER_REGISTRY } from './core/ChapterRegistry.js';

// Make CHAPTER_REGISTRY available globally for preview functions
window.CHAPTER_REGISTRY = CHAPTER_REGISTRY;

// Global Error Handler for user visibility
window.onerror = function (msg, url, lineNo, columnNo, error) {
    const errorBox = document.getElementById('error-display') || document.createElement('div');
    errorBox.id = 'error-display';
    errorBox.style.cssText = 'position:fixed;top:0;left:0;width:100%;background:rgba(255,0,0,0.9);color:white;padding:20px;z-index:99999;font-family:monospace;white-space:pre-wrap;';
    errorBox.innerText = `CRITICAL ERROR:\n${msg}\nLine: ${lineNo}\nStack: ${error ? error.stack : 'N/A'}`;
    document.body.appendChild(errorBox);
    console.error("Global Error:", msg, error);
    return false;
};

window.onunhandledrejection = function (event) {
    const errorBox = document.getElementById('error-display') || document.createElement('div');
    errorBox.id = 'error-display';
    errorBox.style.cssText = 'position:fixed;top:0;left:0;width:100%;background:rgba(255,0,0,0.9);color:white;padding:20px;z-index:99999;font-family:monospace;white-space:pre-wrap;';
    errorBox.innerText = `UNHANDLED PROMISE REJECTION:\n${event.reason}`;
    document.body.appendChild(errorBox);
    console.error("Unhandled Rejection:", event.reason);
};

const initGame = () => {
    if (window.gameInitialized) return;
    window.gameInitialized = true;
    try {
        console.log("Xanezu Catch: Initializing...");
        window.game = new Game();
        console.log("Xanezu Catch Modular Engine Initialized");
    } catch (e) {
        console.error("FATAL: Game Init Failed", e);
        window.onerror(e.message, null, null, null, e);
    }
};

if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', initGame);
} else {
    initGame();
}

// Global Level Loader
window.LoadChapter = function (id, el) {
    // First show the preview panel instead of directly loading
    showChapterPreview(id);
};

window.currentPreviewChapter = null;
window.chapterMusicPreview = null;

// Expose preview functions globally for HTML onclick handlers
window.showChapterPreview = showChapterPreview;
window.hideChapterPreview = hideChapterPreview;
window.startChapterFromPreview = startChapterFromPreview;
window.toggleChapterMusic = toggleChapterMusicPreview;
window.playChapterMusicPreview = playChapterMusicPreview;
window.stopChapterMusicPreview = stopChapterMusicPreview;

function getActiveRegistry() {
    if (window.game && typeof window.game.getActiveRegistry === 'function') {
        return window.game.getActiveRegistry();
    }
    return window.CHAPTER_REGISTRY;
}

function isABLModeActive() {
    return !!(window.game && window.game.stateManager && window.game.stateManager.isABLMode && window.game.stateManager.isABLMode());
}

function showChapterPreview(chapterId) {
    const preview = document.getElementById('chapter-preview');
    if (!preview) return;

    window.currentPreviewChapter = chapterId;

    // Stop any playing preview music
    stopChapterMusicPreview();

    // Get chapter config
    const CHAPTER_REGISTRY = getActiveRegistry();
    const config = CHAPTER_REGISTRY[chapterId];
    if (!config) return;

    // Update preview content
    document.getElementById('preview-chapter-num').textContent = String(chapterId).padStart(2, '0');
    document.getElementById('preview-chapter-name').textContent = config.name || `Capítulo ${chapterId}`;
    const isABLMode = isABLModeActive();

    // Get stored stats for this chapter
    const chapterBestScore = localStorage.getItem(`mx_ch${chapterId}_best_score`) || 0;
    const chapterMaxLevel = localStorage.getItem(`mx_ch${chapterId}_max_level`) || 1;
    const chapterBestMult = localStorage.getItem(`mx_ch${chapterId}_best_mult`) || 1;

    document.getElementById('preview-best-score').textContent = Number(chapterBestScore).toLocaleString();
    document.getElementById('preview-max-level').textContent = chapterMaxLevel;
    // document.getElementById('preview-best-mult').textContent = 'x' + chapterBestMult; // REMOVED

    // Set background image
    const previewBg = document.getElementById('preview-bg');
    if (previewBg) {
        if (isABLMode) {
            previewBg.style.backgroundImage = 'radial-gradient(circle at 20% 20%, rgba(20,160,255,0.35), transparent 42%), radial-gradient(circle at 82% 78%, rgba(46,255,193,0.3), transparent 45%), linear-gradient(180deg, #050e1a 0%, #071825 52%, #03080f 100%)';
        } else {
            const bgPath = config.assetsDir
                ? `assets/${config.assetsDir}/fondos/nivel_1/fondo_lejano.webp`
                : 'assets/menu/fondo/mainmenu-image.webp';
            previewBg.style.backgroundImage = `url('${bgPath}')`;
        }
    }

    /* // REMOVED
    const musicBtn = document.getElementById('preview-music-btn');
    if (musicBtn) {
        musicBtn.style.display = isABLMode ? 'none' : 'inline-flex';
    }
    */

    // Show preview panel
    preview.style.display = 'block';

    // Activate play button (white state)
    const playBtn = document.getElementById('preview-play-btn');
    if (playBtn) playBtn.classList.add('ready');

    // Play button sound
    if (window.game && window.game.synth && window.game.synth.playBtnHover) {
        window.game.synth.playBtnHover();
    }
}

function hideChapterPreview() {
    const preview = document.getElementById('chapter-preview');
    if (preview) {
        preview.style.display = 'none';
    }

    // Deactivate play button (grey state)
    const playBtn = document.getElementById('preview-play-btn');
    if (playBtn) playBtn.classList.remove('ready');

    stopChapterMusicPreview();
    window.currentPreviewChapter = null;

    /* // REMOVED
    const musicBtn = document.getElementById('preview-music-btn');
    if (musicBtn) {
        musicBtn.style.display = 'inline-flex';
    }
    */
}

function startChapterFromPreview(el) {
    const playBtn = document.getElementById('preview-play-btn');
    if (!playBtn || !playBtn.classList.contains('ready')) return;

    const chapterId = window.currentPreviewChapter;

    // Stop preview music
    stopChapterMusicPreview();

    // Hide preview
    hideChapterPreview();

    // Start the chapter
    if (window.game && window.game.state !== 'LOADING') {
        window.game.totalGamesPlayed++;
        localStorage.setItem('mx_games_played', window.game.totalGamesPlayed);

        if (window.game.synth && window.game.synth.playBtnClick) {
            window.game.synth.playBtnClick();
        }

        window.game.start(chapterId);
    }
}

function toggleChapterMusicPreview(btn) {
    if (!window.currentPreviewChapter) return;

    const musicBtn = btn || document.getElementById('preview-music-btn');
    if (!musicBtn) return;

    if (musicBtn.classList.contains('playing')) {
        stopChapterMusicPreview();
    } else {
        playChapterMusicPreview(musicBtn);
    }
}

// Alias for onclick in HTML
window.toggleChapterMusic = toggleChapterMusicPreview;

// Track menu music state
window.menuMusicWasPlaying = false;

function playChapterMusicPreview(btn) {
    if (isABLModeActive()) return;

    // Stop current preview if playing
    stopChapterMusicPreview();

    const chapterId = window.currentPreviewChapter;
    if (!chapterId) return;

    // Save menu music state and pause it
    if (window.game && window.game.synth && window.game.synth.currentMusicSource) {
        window.menuMusicWasPlaying = !window.game.synth.currentMusicSource.paused;
        if (window.menuMusicWasPlaying) {
            window.game.synth.currentMusicSource.pause();
        }
    }

    const CHAPTER_REGISTRY = getActiveRegistry();
    const config = CHAPTER_REGISTRY[chapterId];
    if (!config || !config.assetsDir) return;

    const candidates = [
        `assets/${config.assetsDir}/audios/${config.assetsDir}.ogg`,
        `assets/${config.assetsDir}/audios/${config.assetsDir}.mp3`,
        `assets/${config.assetsDir}/audios/${config.assetsDir}.wav`
    ];


    const tryPlay = (idx) => {
        if (idx >= candidates.length) {
            console.warn('Could not play chapter preview music (all formats failed)');
            resumeMenuMusic();
            return;
        }
        window.chapterMusicPreview = new Audio(candidates[idx]);
        window.chapterMusicPreview.volume = 0.3;
        window.chapterMusicPreview.loop = true;
        window.chapterMusicPreview.play().then(() => {
            if (btn) btn.classList.add('playing');
        }).catch(() => tryPlay(idx + 1));
    };

    tryPlay(0);
}

function resumeMenuMusic() {
    if (window.menuMusicWasPlaying && window.game && window.game.synth && window.game.synth.currentMusicSource) {
        window.game.synth.currentMusicSource.play().catch(() => { });
        window.menuMusicWasPlaying = false;
    }
}

function stopChapterMusicPreview() {
    if (window.chapterMusicPreview) {
        window.chapterMusicPreview.pause();
        window.chapterMusicPreview.currentTime = 0;
        window.chapterMusicPreview = null;
    }

    // Resume menu music if it was playing
    resumeMenuMusic();

    const musicBtn = document.getElementById('preview-music-btn');
    if (musicBtn) {
        musicBtn.classList.remove('playing');
    }
}

// Keyboard support: Escape to close preview
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const preview = document.getElementById('chapter-preview');
        if (preview && preview.style.display !== 'none') {
            hideChapterPreview();
        }
    }
});

// Global menu navigation helpers
window.goToStory = (el) => {
    console.log("NAV: Story Campaign clicked");
    if (window.game && window.game.state !== 'LOADING') {
        if (el && window.game.ui) window.game.ui.triggerClickFeedback(el);
        window.game.goToStory();
    } else {
        console.error("NAV ERR: Game missing or loading");
    }
};

window.goToArcade = (el) => {
    console.log('NAV: Arcade Mode clicked');
    if (window.game && window.game.state !== 'LOADING') {
        if (el && window.game.ui) window.game.ui.triggerClickFeedback(el);
        window.game.startArcadeMode();
    }
};

window.goToABL = (el) => {
    console.log('NAV: ABL Mode clicked');
    if (window.game && window.game.state !== 'LOADING') {
        if (el && window.game.ui) window.game.ui.triggerClickFeedback(el);
        window.game.startABLMode();
    }
};

window.startInfinite = (el) => {
    console.log("NAV: Infinite clicked");
    if (window.game && window.game.state !== 'LOADING') {
        if (el && window.game.ui) window.game.ui.triggerClickFeedback(el);
        window.game.startInfinite();
    }
};

window.showShop = (el) => {
    console.log("NAV: Shop clicked");
    if (window.game && window.game.state !== 'LOADING') {
        if (el && window.game.ui) window.game.ui.triggerClickFeedback(el);
        window.game.showShop();
    }
};

window.showTrophies = (el) => {
    console.log("NAV: Trophies clicked");
    if (window.game && window.game.state !== 'LOADING') {
        if (el && window.game.ui) window.game.ui.triggerClickFeedback(el);
        window.game.showTrophies();
    }
};

window.returnToMenu = (el) => {
    console.log("NAV: Return to Menu clicked");
    if (window.game && window.game.state !== 'LOADING') {
        if (el && window.game.ui) window.game.ui.triggerClickFeedback(el);
        window.game.returnToMenu();
    }
};

window.showSettings = (el) => {
    console.log("NAV: Settings clicked");
    if (window.game && window.game.state !== 'LOADING') {
        if (el && window.game.ui) window.game.ui.triggerClickFeedback(el);
        window.game.showSettings();
    }
};

window.retry = (el) => {
    console.log("NAV: Retry clicked");
    if (window.game && window.game.state !== 'LOADING') {
        if (el && window.game.ui) window.game.ui.triggerClickFeedback(el);
        window.game.retry();
    }
};
