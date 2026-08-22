import { SUITS } from '../utils/helpers.js';

/**
 * Programmatic SVG Card Generator
 * Generates vector representations of all 36 playing cards + back side
 */
export class CardGenerator {
  static getSuitColor(suit) {
    return (suit === SUITS.HEARTS || suit === SUITS.DIAMONDS) ? '#d32f2f' : '#1e293b';
  }

  static getSuitPath(suit) {
    switch (suit) {
      case SUITS.HEARTS:
        return 'M 50,30 C 50,30 40,15 25,15 C 10,15 0,27 0,45 C 0,65 25,80 50,100 C 75,80 100,65 100,45 C 100,27 90,15 75,15 C 60,15 50,30 50,30 Z';
      case SUITS.DIAMONDS:
        return 'M 50,5 L 88,50 L 50,95 L 12,50 Z';
      case SUITS.SPADES:
        return 'M 50,10 C 38,28 15,40 15,62 C 15,75 26,85 38,82 C 43,81 47,76 48,72 L 44,95 L 56,95 L 52,72 C 53,76 57,81 62,82 C 74,85 85,75 85,62 C 85,40 62,28 50,10 Z';
      case SUITS.CLUBS:
        return 'M 50,42 C 58,42 66,35 66,26 C 66,16 57,8 50,8 C 43,8 34,16 34,26 C 34,35 42,42 50,42 M 28,68 C 36,68 44,61 44,52 C 44,43 35,35 26,35 C 16,35 9,43 9,52 C 9,61 17,68 28,68 M 72,68 C 81,68 89,61 89,52 C 89,43 80,35 71,35 C 62,35 55,43 55,52 C 55,61 63,68 72,68 M 46,60 L 42,95 L 58,95 L 54,60 Z';
      default:
        return '';
    }
  }

  static getSuitSvg(suit, size = 20, color = null) {
    const fill = color || this.getSuitColor(suit);
    const path = this.getSuitPath(suit);
    return `
      <svg width="${size}" height="${size}" viewBox="0 0 100 100" class="suit-icon">
        <path d="${path}" fill="${fill}" />
      </svg>
    `;
  }

  static generateCardBackSvg() {
    return `
      <svg class="card-svg card-back" viewBox="0 0 200 290" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="backGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#1e3a8a" />
            <stop offset="50%" stop-color="#172554" />
            <stop offset="100%" stop-color="#0f172a" />
          </linearGradient>
          <pattern id="cardPattern" width="20" height="20" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="20" height="20" fill="none" stroke="#f59e0b" stroke-width="0.8" opacity="0.45" />
            <circle cx="10" cy="10" r="3" fill="#f59e0b" opacity="0.6" />
            <path d="M 0,10 L 10,0 L 20,10 L 10,20 Z" fill="none" stroke="#38bdf8" stroke-width="0.6" opacity="0.4" />
          </pattern>
          <filter id="cardShadow" x="-10%" y="-10%" width="120%" height="125%">
            <feDropShadow dx="0" dy="4" stdDeviation="4" flood-opacity="0.25" />
          </filter>
        </defs>
        <rect x="2" y="2" width="196" height="286" rx="14" ry="14" fill="#ffffff" stroke="#e2e8f0" stroke-width="2" />
        <rect x="8" y="8" width="184" height="274" rx="10" ry="10" fill="url(#backGrad)" />
        <rect x="14" y="14" width="172" height="262" rx="8" ry="8" fill="url(#cardPattern)" stroke="#f59e0b" stroke-width="1.5" stroke-opacity="0.8" />
        <rect x="22" y="22" width="156" height="246" rx="6" ry="6" fill="none" stroke="#ffffff" stroke-width="1" opacity="0.3" />
        <!-- Center Emblem -->
        <circle cx="100" cy="145" r="32" fill="#0f172a" stroke="#f59e0b" stroke-width="2" />
        <circle cx="100" cy="145" r="26" fill="none" stroke="#f59e0b" stroke-width="1" stroke-dasharray="3,3" />
        <!-- 4 Mini Suits in Emblem -->
        <g transform="translate(90, 122) scale(0.2)">
          <path d="${this.getSuitPath(SUITS.HEARTS)}" fill="#ef4444" />
        </g>
        <g transform="translate(108, 137) scale(0.2)">
          <path d="${this.getSuitPath(SUITS.DIAMONDS)}" fill="#ef4444" />
        </g>
        <g transform="translate(90, 152) scale(0.2)">
          <path d="${this.getSuitPath(SUITS.CLUBS)}" fill="#f8fafc" />
        </g>
        <g transform="translate(72, 137) scale(0.2)">
          <path d="${this.getSuitPath(SUITS.SPADES)}" fill="#f8fafc" />
        </g>
      </svg>
    `;
  }

  static getCenterArt(rank, suit, color) {
    const suitPath = this.getSuitPath(suit);

    if (rank === 'A') {
      return `
        <g class="card-center-art" transform="translate(50, 85) scale(1)">
          <!-- Large Ace Center Ornament -->
          <circle cx="50" cy="60" r="46" fill="none" stroke="${color}" stroke-width="1.5" opacity="0.25" />
          <circle cx="50" cy="60" r="40" fill="none" stroke="${color}" stroke-width="0.8" stroke-dasharray="2,2" opacity="0.3" />
          <g transform="translate(15, 25) scale(0.7)">
            <path d="${suitPath}" fill="${color}" filter="drop-shadow(0 2px 3px rgba(0,0,0,0.15))" />
          </g>
        </g>
      `;
    }

    if (rank === 'K' || rank === 'Q' || rank === 'J') {
      const courtTitle = rank === 'K' ? 'KING' : rank === 'Q' ? 'QUEEN' : 'JACK';
      const crownIcon = rank === 'K' 
        ? '<path d="M 20,40 L 30,22 L 50,32 L 70,22 L 80,40 Z" fill="#f59e0b" stroke="#b45309" stroke-width="1" />'
        : rank === 'Q'
        ? '<path d="M 25,38 C 35,22 65,22 75,38 Z" fill="#f59e0b" stroke="#b45309" stroke-width="1" />'
        : '<path d="M 30,35 L 50,22 L 70,35 Z" fill="#94a3b8" stroke="#475569" stroke-width="1" />';

      return `
        <g class="card-center-court" transform="translate(35, 60)">
          <!-- Court Frame -->
          <rect x="0" y="0" width="130" height="170" rx="8" ry="8" fill="#f8fafc" stroke="${color}" stroke-width="1.5" stroke-opacity="0.35" />
          <rect x="4" y="4" width="122" height="162" rx="6" ry="6" fill="none" stroke="#cbd5e1" stroke-width="1" stroke-dasharray="4,2" />
          <!-- Court Figure Silhouette -->
          <g transform="translate(15, 20)">
            ${crownIcon}
            <circle cx="50" cy="55" r="18" fill="${color}" opacity="0.85" />
            <path d="M 25,115 C 25,78 75,78 75,115 Z" fill="${color}" opacity="0.75" />
            <!-- Court Center Suit -->
            <g transform="translate(35, 75) scale(0.3)">
              <path d="${suitPath}" fill="#ffffff" />
            </g>
          </g>
          <text x="65" y="155" text-anchor="middle" font-family="'Cinzel', 'Times New Roman', serif" font-size="11" font-weight="bold" fill="${color}" opacity="0.8" letter-spacing="2">${courtTitle}</text>
        </g>
      `;
    }

    // Number Pip arrangements (6, 7, 8, 9, 10)
    return this.generateNumberPips(rank, suitPath, color);
  }

  static generateNumberPips(rank, suitPath, color) {
    const pips = [];
    const makePip = (x, y, flip = false, scale = 0.28) => {
      const transform = flip 
        ? `translate(${x + 100 * scale}, ${y + 100 * scale}) rotate(180) scale(${scale})`
        : `translate(${x}, ${y}) scale(${scale})`;
      return `<g transform="${transform}"><path d="${suitPath}" fill="${color}" /></g>`;
    };

    const num = parseInt(rank, 10);
    const left = 48;
    const right = 124;
    const center = 86;

    if (num === 6) {
      pips.push(makePip(left, 60));
      pips.push(makePip(right, 60));
      pips.push(makePip(left, 130));
      pips.push(makePip(right, 130));
      pips.push(makePip(left, 200, true));
      pips.push(makePip(right, 200, true));
    } else if (num === 7) {
      pips.push(makePip(left, 60));
      pips.push(right, 60);
      pips.push(makePip(right, 60));
      pips.push(makePip(center, 95));
      pips.push(makePip(left, 130));
      pips.push(makePip(right, 130));
      pips.push(makePip(left, 200, true));
      pips.push(makePip(right, 200, true));
    } else if (num === 8) {
      pips.push(makePip(left, 60));
      pips.push(makePip(right, 60));
      pips.push(makePip(center, 95));
      pips.push(makePip(left, 130));
      pips.push(makePip(right, 130));
      pips.push(makePip(center, 165, true));
      pips.push(makePip(left, 200, true));
      pips.push(makePip(right, 200, true));
    } else if (num === 9) {
      pips.push(makePip(left, 55));
      pips.push(makePip(right, 55));
      pips.push(makePip(left, 105));
      pips.push(makePip(right, 105));
      pips.push(makePip(center, 130));
      pips.push(makePip(left, 155, true));
      pips.push(makePip(right, 155, true));
      pips.push(makePip(left, 205, true));
      pips.push(makePip(right, 205, true));
    } else if (num === 10) {
      pips.push(makePip(left, 55));
      pips.push(makePip(right, 55));
      pips.push(makePip(center, 80));
      pips.push(makePip(left, 105));
      pips.push(makePip(right, 105));
      pips.push(makePip(left, 155, true));
      pips.push(makePip(right, 155, true));
      pips.push(makePip(center, 180, true));
      pips.push(makePip(left, 205, true));
      pips.push(makePip(right, 205, true));
    }

    return `<g class="card-pips">${pips.join('')}</g>`;
  }

  static generateCardFaceSvg(rank, suit) {
    const color = this.getSuitColor(suit);
    const suitPath = this.getSuitPath(suit);
    const centerArt = this.getCenterArt(rank, suit, color);

    return `
      <svg class="card-svg card-face" viewBox="0 0 200 290" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="cardBgGrad-${rank}-${suit}" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#ffffff" />
            <stop offset="100%" stop-color="#f8fafc" />
          </linearGradient>
        </defs>
        <!-- Card Body -->
        <rect x="2" y="2" width="196" height="286" rx="14" ry="14" fill="url(#cardBgGrad-${rank}-${suit})" stroke="#cbd5e1" stroke-width="1.8" />
        <rect x="6" y="6" width="188" height="278" rx="10" ry="10" fill="none" stroke="#f1f5f9" stroke-width="1" />

        <!-- Top-Left Index -->
        <g class="card-index top-left" transform="translate(12, 14)">
          <text x="10" y="22" font-family="'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="24" font-weight="900" fill="${color}" text-anchor="middle">${rank}</text>
          <g transform="translate(1, 28) scale(0.18)">
            <path d="${suitPath}" fill="${color}" />
          </g>
        </g>

        <!-- Center Art / Pips -->
        ${centerArt}

        <!-- Bottom-Right Index (Rotated 180) -->
        <g class="card-index bottom-right" transform="translate(188, 276) rotate(180)">
          <text x="10" y="22" font-family="'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="24" font-weight="900" fill="${color}" text-anchor="middle">${rank}</text>
          <g transform="translate(1, 28) scale(0.18)">
            <path d="${suitPath}" fill="${color}" />
          </g>
        </g>
      </svg>
    `;
  }
}
