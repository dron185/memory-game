'use strict';

/* ================= Константы ============== */

const CARD_VALUES = ['🐶', '🐱', '🐸', '🦊', '🐼', '🐵', '🦁', '🐷'];
const TOTAL_PAIRS = CARD_VALUES.length;
const FLIP_BACK_DELAY = 1000; // мс, в пределах 700–1500
const STORAGE_KEY = 'memory-game.leaderboard';
const MAX_RESULTS = 10;

/* =========== Вспомогательные функции для работы с DOM ============ */
/** Создаёт элемент с классом и текстом */
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

/** Создаёт кнопку. */
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

/* =============== Утилиты ================ */
/** Перемешивание */
function shuffleArray(arr) {
    const copyArr = arr.slice();
    for (let i = copyArr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = copyArr[i];
        copyArr[i] = copyArr[j];
        copyArr[j] = temp;
    }
    return copyArr;
}

/** Дата в формате ДД.ММ.ГГГГ. */
function formatDate(timestamp) {
    const date = new Date(timestamp);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return day + '.' + month + '.' + date.getFullYear();
}

/** Склонение слова «ход». */
function wordDeclension(count) {
    const mod10 = count % 10;
    const mod100 = count % 100;
    if (mod10 === 1 && mod100 !== 11) {
        return 'ход';
    }
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
        return 'хода';
    }
    return 'ходов';
}

