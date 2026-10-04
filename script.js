'use strict';

/* ================= Константы ============== */

const CARD_VALUES = ['🐶', '🐱', '🐸', '🦊', '🐼', '🐵', '🦁', '🐷'];
const TOTAL_PAIRS = CARD_VALUES.length;
const FLIP_BACK_DELAY = 1000; // мс, в пределах 700–1500
const STORAGE_KEY = 'memory-game.leaderboard';
const MAX_RESULTS = 10;

/* =========== Вспомогательные функции для работы с DOM ============ */
/** Создаёт элемент с классом и текстом **/
function createEl(tagName, className, text) {
    const element = document.createElement(tagName);
    if (className) {
        element.className = className;
    }
    if (text !== undefined && text !== null) {
        element.textContent = text;
    }
    return element;
}

/**
 * Создаёт кнопку.
 */
function createButton(text, className, onClick, ariaLabel) {
    const button = createEl('button', className, text);
    button.type = 'button';
    if (ariaLabel) {
        button.setAttribute('aria-label', ariaLabel);
    }
    if (typeof onClick === 'function') {
        button.addEventListener('click', onClick);
    }
    return button;
}
