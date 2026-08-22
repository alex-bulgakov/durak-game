import { RANK_NAMES_RU, SUIT_NAMES_RU } from '../utils/helpers.js';

/**
 * Enhanced Card Texture Generator
 * Uses authentic raster textures from /cards/{suit}/{rank}_of_{suit}.webp
 * and /cards/card_back.webp for card backs.
 */
export class CardGenerator {
  /**
   * Get Card Face Texture URL
   * e.g. /cards/hearts/A_of_hearts.webp
   */
  static getTextureUrl(rank, suit) {
    const suitName = suit.toLowerCase();
    const fileName = `${suitName}/${rank}_of_${suitName}.webp`;

    if (typeof window !== 'undefined' && window.location) {
      const cleanPath = window.location.pathname.replace(/\/[^\/]*$/, '/');
      return `${window.location.origin}${cleanPath}cards/${fileName}`;
    }
    return `./cards/${fileName}`;
  }

  /**
   * Get Card Back Texture URL
   * /cards/card_back.webp
   */
  static getCardBackUrl() {
    if (typeof window !== 'undefined' && window.location) {
      const cleanPath = window.location.pathname.replace(/\/[^\/]*$/, '/');
      return `${window.location.origin}${cleanPath}cards/card_back.webp`;
    }
    return `./cards/card_back.webp`;
  }

  /**
   * Generates Complete Classic Card Back HTML
   */
  static generateCardBackSvg() {
    const backUrl = this.getCardBackUrl();
    return `<img src="${backUrl}" alt="Рубашка карты" class="card-svg card-back card-texture-img" draggable="false" loading="eager" decoding="sync" />`;
  }

  /**
   * Generates Complete Classic Card Face HTML
   */
  static generateCardFaceSvg(rank, suit) {
    const cardTitle = `${RANK_NAMES_RU[rank] || rank} ${SUIT_NAMES_RU[suit] || suit}`;
    const textureUrl = this.getTextureUrl(rank, suit);
    return `<img src="${textureUrl}" alt="${cardTitle}" class="card-svg card-face card-texture-img" draggable="false" loading="eager" decoding="sync" />`;
  }
}
