import { SUITS } from '../utils/helpers.js';

/**
 * Enhanced Classic Card Texture & Graphic Generator
 * Integrates official raster textures from /cards/ for available ranks (J, Q, K, etc.)
 * and matching vector SVG generation for others.
 */
export class CardGenerator {
  // Available textured ranks in /cards/
  static TEXTURED_RANKS = new Set(['J', 'Q', 'K']);

  static getSuitColor(suit) {
    return (suit === SUITS.HEARTS || suit === SUITS.DIAMONDS) ? '#c1121f' : '#1a202c';
  }

  static getSuitPath(suit) {
    switch (suit) {
      case SUITS.HEARTS:
        return 'M 50,28 C 50,28 38,12 22,12 C 9,12 0,24 0,42 C 0,64 26,81 50,100 C 74,81 100,64 100,42 C 100,24 91,12 78,12 C 62,12 50,28 50,28 Z';
      case SUITS.DIAMONDS:
        return 'M 50,4 L 92,50 L 50,96 L 8,50 Z';
      case SUITS.SPADES:
        return 'M 50,8 C 36,27 12,38 12,62 C 12,76 24,86 37,83 C 43,82 47,76 48,71 L 43,96 L 57,96 L 52,71 C 53,76 57,82 63,83 C 76,86 88,76 88,62 C 88,38 64,27 50,8 Z';
      case SUITS.CLUBS:
        return 'M 50,40 C 59,40 67,33 67,24 C 67,14 58,6 50,6 C 42,6 33,14 33,24 C 33,33 41,40 50,40 M 27,66 C 36,66 44,58 44,49 C 44,40 35,32 25,32 C 15,32 8,40 8,49 C 8,58 16,66 27,66 M 73,66 C 82,66 90,58 90,49 C 90,40 81,32 71,32 C 61,32 54,40 54,49 C 54,58 62,66 73,66 M 45,58 L 41,96 L 59,96 L 55,58 Z';
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

  /**
   * Get Texture URL according to filename specification:
   * card_БукваНоминала_of_Масть_front_1x.webp
   */
  static getTextureUrl(rank, suit) {
    const suitName = suit.toLowerCase();
    return `/cards/card_${rank}_of_${suitName}_front_1x.webp`;
  }

  /**
   * Classic Symmetrical Card Back
   */
  static generateCardBackSvg() {
    return `
      <svg class="card-svg card-back" viewBox="0 0 200 290" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="backGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#1e3a8a" />
            <stop offset="50%" stop-color="#172554" />
            <stop offset="100%" stop-color="#0f172a" />
          </linearGradient>
          <pattern id="classicLattice" width="24" height="24" patternUnits="userSpaceOnUse">
            <path d="M 0,12 L 12,0 L 24,12 L 12,24 Z" fill="none" stroke="#cda869" stroke-width="0.8" opacity="0.65" />
            <path d="M 6,6 L 18,18 M 18,6 L 6,18" stroke="#38bdf8" stroke-width="0.5" opacity="0.35" />
            <circle cx="12" cy="12" r="2" fill="#fbbf24" opacity="0.8" />
          </pattern>
        </defs>

        <!-- White Card Border -->
        <rect x="2" y="2" width="196" height="286" rx="14" ry="14" fill="#fcf8ee" stroke="#cda869" stroke-width="1.8" />
        
        <!-- Outer Blue Margin -->
        <rect x="7" y="7" width="186" height="276" rx="10" ry="10" fill="url(#backGrad)" />

        <!-- Double Gold Filigree Border -->
        <rect x="12" y="12" width="176" height="266" rx="8" ry="8" fill="none" stroke="#cda869" stroke-width="1.5" opacity="0.85" />
        <rect x="16" y="16" width="168" height="258" rx="6" ry="6" fill="url(#classicLattice)" stroke="#cda869" stroke-width="0.8" />

        <!-- Symmetrical Center Medallion -->
        <g transform="translate(100, 145)">
          <circle cx="0" cy="0" r="34" fill="#0f172a" stroke="#cda869" stroke-width="2" />
          <circle cx="0" cy="0" r="28" fill="none" stroke="#fbbf24" stroke-width="1" stroke-dasharray="3,2" />
          <circle cx="0" cy="0" r="22" fill="#1e293b" stroke="#cda869" stroke-width="0.8" />
          
          <!-- 4 Classic Suit Emblems in Center -->
          <g transform="translate(0, -12) scale(0.18)"><path d="${this.getSuitPath(SUITS.HEARTS)}" fill="#ef4444" transform="translate(-50, -50)" /></g>
          <g transform="translate(12, 0) scale(0.18)"><path d="${this.getSuitPath(SUITS.DIAMONDS)}" fill="#ef4444" transform="translate(-50, -50)" /></g>
          <g transform="translate(0, 12) scale(0.18)"><path d="${this.getSuitPath(SUITS.CLUBS)}" fill="#f8fafc" transform="translate(-50, -50)" /></g>
          <g transform="translate(-12, 0) scale(0.18)"><path d="${this.getSuitPath(SUITS.SPADES)}" fill="#f8fafc" transform="translate(-50, -50)" /></g>
        </g>
      </svg>
    `;
  }

  /**
   * Generates Complete Classic Card Face
   */
  static generateCardFaceSvg(rank, suit) {
    // If we have an official texture webp file for this rank
    if (this.TEXTURED_RANKS.has(rank)) {
      const textureUrl = this.getTextureUrl(rank, suit);
      return `<img src="${textureUrl}" alt="${rank} ${suit}" class="card-svg card-face card-texture-img" draggable="false" />`;
    }

    const color = this.getSuitColor(suit);
    const suitPath = this.getSuitPath(suit);
    const centerArt = this.getCenterArt(rank, suit, color);

    return `
      <svg class="card-svg card-face" viewBox="0 0 200 290" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="cardLinenBg-${rank}-${suit}" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#ffffff" />
            <stop offset="60%" stop-color="#fcf8ee" />
            <stop offset="100%" stop-color="#f8f4e6" />
          </linearGradient>
        </defs>

        <!-- Card Body with Rounded Edges & Gold Frame matching textures -->
        <rect x="2" y="2" width="196" height="286" rx="14" ry="14" fill="url(#cardLinenBg-${rank}-${suit})" stroke="#cda869" stroke-width="1.8" />
        
        <!-- Classic Fine Inner Gold Guilloche Border -->
        <rect x="6" y="6" width="188" height="278" rx="10" ry="10" fill="none" stroke="#e2e8f0" stroke-width="0.8" />
        <rect x="9" y="9" width="182" height="272" rx="8" ry="8" fill="none" stroke="#cda869" stroke-width="0.8" stroke-opacity="0.6" />

        <!-- Top-Left Corner Index (Rank + Suit) -->
        <g class="card-index top-left" transform="translate(12, 12)">
          <text x="10" y="24" font-family="'Cinzel', 'Playfair Display', 'Times New Roman', Georgia, serif" font-size="26" font-weight="900" fill="${color}" text-anchor="middle">${rank}</text>
          <g transform="translate(1, 30) scale(0.18)">
            <path d="${suitPath}" fill="${color}" />
          </g>
        </g>

        <!-- Center Art / Pips -->
        ${centerArt}

        <!-- Bottom-Right Inverted Index -->
        <g class="card-index bottom-right" transform="translate(188, 278) rotate(180)">
          <text x="10" y="24" font-family="'Cinzel', 'Playfair Display', 'Times New Roman', Georgia, serif" font-size="26" font-weight="900" fill="${color}" text-anchor="middle">${rank}</text>
          <g transform="translate(1, 30) scale(0.18)">
            <path d="${suitPath}" fill="${color}" />
          </g>
        </g>
      </svg>
    `;
  }

  static getCenterArt(rank, suit, color) {
    const suitPath = this.getSuitPath(suit);

    if (rank === 'A') {
      return `
        <g class="card-center-art">
          <circle cx="100" cy="145" r="54" fill="none" stroke="${color}" stroke-width="1" opacity="0.2" />
          <circle cx="100" cy="145" r="48" fill="none" stroke="${color}" stroke-width="0.6" stroke-dasharray="4,3" opacity="0.3" />
          <circle cx="100" cy="145" r="42" fill="none" stroke="${color}" stroke-width="1.2" opacity="0.25" />
          <path d="M 55,145 C 55,115 80,105 100,105 C 120,105 145,115 145,145 C 145,175 120,185 100,185 C 80,185 55,175 55,145 Z" fill="none" stroke="${color}" stroke-width="0.8" opacity="0.35" />
          <g transform="translate(62, 107) scale(0.76)">
            <path d="${suitPath}" fill="${color}" filter="drop-shadow(0 3px 4px rgba(0,0,0,0.18))" />
          </g>
        </g>
      `;
    }

    return this.generateNumberPips(rank, suitPath, color);
  }

  static generateNumberPips(rank, suitPath, color) {
    const pips = [];
    const makePip = (x, y, flip = false, scale = 0.28) => {
      const transform = flip 
        ? `translate(${x + 100 * scale}, ${y + 100 * scale}) rotate(180) scale(${scale})`
        : `translate(${x}, ${y}) scale(${scale})`;
      return `<g transform="${transform}"><path d="${suitPath}" fill="${color}" filter="drop-shadow(0 1px 1px rgba(0,0,0,0.12))" /></g>`;
    };

    const num = parseInt(rank, 10);
    const left = 48;
    const right = 124;
    const center = 86;

    if (num === 6) {
      pips.push(makePip(left, 58));
      pips.push(makePip(right, 58));
      pips.push(makePip(left, 131));
      pips.push(makePip(right, 131));
      pips.push(makePip(left, 204, true));
      pips.push(makePip(right, 204, true));
    } else if (num === 7) {
      pips.push(makePip(left, 58));
      pips.push(makePip(right, 58));
      pips.push(makePip(center, 94));
      pips.push(makePip(left, 131));
      pips.push(makePip(right, 131));
      pips.push(makePip(left, 204, true));
      pips.push(makePip(right, 204, true));
    } else if (num === 8) {
      pips.push(makePip(left, 58));
      pips.push(makePip(right, 58));
      pips.push(makePip(center, 94));
      pips.push(makePip(left, 131));
      pips.push(makePip(right, 131));
      pips.push(makePip(center, 168, true));
      pips.push(makePip(left, 204, true));
      pips.push(makePip(right, 204, true));
    } else if (num === 9) {
      pips.push(makePip(left, 54));
      pips.push(makePip(right, 54));
      pips.push(makePip(left, 104));
      pips.push(makePip(right, 104));
      pips.push(makePip(center, 131));
      pips.push(makePip(left, 158, true));
      pips.push(makePip(right, 158, true));
      pips.push(makePip(left, 208, true));
      pips.push(makePip(right, 208, true));
    } else if (num === 10) {
      pips.push(makePip(left, 54));
      pips.push(makePip(right, 54));
      pips.push(makePip(center, 79));
      pips.push(makePip(left, 104));
      pips.push(makePip(right, 104));
      pips.push(makePip(left, 158, true));
      pips.push(makePip(right, 158, true));
      pips.push(makePip(center, 183, true));
      pips.push(makePip(left, 208, true));
      pips.push(makePip(right, 208, true));
    }

    return `<g class="card-pips">${pips.join('')}</g>`;
  }
}
