/**
 * Helper utilities for Durak Card Game
 */

export const SUITS = {
  HEARTS: 'HEARTS',
  DIAMONDS: 'DIAMONDS',
  CLUBS: 'CLUBS',
  SPADES: 'SPADES'
};

export const SUIT_SYMBOLS = {
  HEARTS: '♥',
  DIAMONDS: '♦',
  CLUBS: '♣',
  SPADES: '♠'
};

export const SUIT_NAMES_RU = {
  HEARTS: 'Червы',
  DIAMONDS: 'Бубны',
  CLUBS: 'Трефы',
  SPADES: 'Пики'
};

export const RANKS = ['6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

export const RANK_NAMES_RU = {
  '6': '6',
  '7': '7',
  '8': '8',
  '9': '9',
  '10': '10',
  'J': 'Валет',
  'Q': 'Дама',
  'K': 'Король',
  'A': 'Туз'
};

export const RANK_VALUES = {
  '6': 6,
  '7': 7,
  '8': 8,
  '9': 9,
  '10': 10,
  'J': 11,
  'Q': 12,
  'K': 13,
  'A': 14
};

/**
 * Fisher-Yates shuffle algorithm
 */
export function shuffleArray(array) {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Promisified delay for smooth animations & AI delays
 */
export function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
