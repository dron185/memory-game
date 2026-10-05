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

/** =========== Каркас приложения ====================== */

const appRoot = createEl('div', 'wrapper');

/* --- Хедер --- */

const header = createEl('header', 'header');
const headerTitle = createEl('h1', 'header__title', 'Memory Game');
const headerActions = createEl('div', 'header__actions');
const newGameButton = createButton('Новая игра', 'btn btn--primary');
const leaderboardButton = createButton('Таблица лидеров', 'btn btn--secondary');

headerActions.append(newGameButton, leaderboardButton);
header.append(headerTitle, headerActions);

/* --- Счётчики --- */

const main = createEl('main', 'main');
const stats = createEl('div', 'stats');

const statsItem = createEl('div', 'stats__item');
const statsValue = createEl('span', 'stats__value', '0');

statsItem.append(createEl('span', 'stats__label', 'Ходы:'), statsValue);

const pairsValue = createEl('span', 'stats__value', '0 / ' + TOTAL_PAIRS);
const pairsStat = createEl('div', 'stats__item');
pairsStat.append(createEl('span', 'stats__label', 'Найдено пар:'), pairsValue);

stats.append(statsItem, pairsStat);

/* --- Игровое поле --- */

const board = createEl('div', 'board');

main.append(stats, board);
appRoot.append(header, main);
document.body.append(appRoot);

/** Блокировка фонового содержимого, пока открыто модальное окно. */
function setBackgroundInert(isInert) {
    appRoot.inert = Boolean(isInert);
}

/* ============== Функция создания модального окна =================== */

/**
 * Создаёт модальное окно с общим поведением:
 * закрытие по кнопке, клику по фону и Escape,
 * блокировка прокрутки и фонового содержимого.
 */

function createModal(options) {
    const settings = options || {};

    const overlay = createEl('div', 'modal-overlay');
    overlay.hidden = true;

    const modal = createEl('div', 'modal');
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');

    const content = createEl('div', 'modal__content');
    const actions = createEl('div', 'modal__actions');

    const closeButton = createButton('Закрыть', 'btn btn--secondary');
    actions.append(closeButton);

    modal.append(content, actions);
    overlay.append(modal);
    document.body.append(overlay);

    let opened = false;
    let lastFocused = null;

    function open() {
        if (opened) {
            return;
        }
        opened = true;
        lastFocused = document.activeElement;
        overlay.hidden = false;
        document.body.classList.add('modal-open');
        setBackgroundInert(true);
        closeButton.focus();
    }

    function close() {
        if (!opened) {
            return;
        }
        opened = false;
        overlay.hidden = true;
        document.body.classList.remove('modal-open');
        setBackgroundInert(false);

        if (lastFocused && typeof lastFocused.focus === 'function' && document.contains(lastFocused)) {
            lastFocused.focus();
        }
        lastFocused = null;

        if (typeof settings.onClose === 'function') {
            settings.onClose();
        }
    }

    closeButton.addEventListener('click', close);

    overlay.addEventListener('click', (event) => {
        if (event.target === overlay) {
            close();
        }
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && opened) {
            event.preventDefault();
            close();
        }
    });

    return {
        overlay: overlay,
        dialog: modal,
        content: content,
        actions: actions,
        open: open,
        close: close,
        isOpen: function () {
            return opened;
        }
    };
}

/* --- Модальное окно победы --- */

const winModal = createModal();

const winNewGameButton = createButton('Новая игра', 'btn btn--primary', () => {
    winModal.close();
    startNewGame();
});
winModal.actions.prepend(winNewGameButton);

/* --- Модальное окно таблицы лидеров --- */

const leaderboardModal = createModal();

/* =============== Состояние игры ===================== */

const state = {
    cards: [],
    firstCard: null,
    secondCard: null,
    isBoardLocked: false,
    moves: 0,
    pairs: 0,
    isFinished: false,
    closeTimerId: null
};

/* ============== Создание карточек =================== */

function createCard(value) {
    const element = createEl('button', 'card');
    element.type = 'button';
    element.setAttribute('aria-label', 'Закрытая карточка');

    const inner = createEl('span', 'card__inner');
    inner.setAttribute('aria-hidden', 'true');

    const backFace = createEl('span', 'card__face card__face--back');
    const frontFace = createEl('span', 'card__face card__face--front', value);

    inner.append(backFace, frontFace);
    element.append(inner);

    const card = {
        value: value,
        element: element,
        isFlipped: false,
        isMatched: false
    };

    element.addEventListener('click', () => {
        handleCardClick(card);
    });

    return card;
}
