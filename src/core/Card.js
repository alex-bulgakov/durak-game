import { RANK_NAMES_RU, SUIT_NAMES_RU, SUIT_SYMBOLS, RANK_VALUES } from '../utils/helpers.js';
import { CardGenerator } from '../components/CardGenerator.js';

export class Card {
  constructor(suit, rank) {
    this.suit = suit;
    this.rank = rank;
    this.value = RANK_VALUES[rank] || 0;
    this.id = `${suit}_${rank}`;
    this.isTrump = false;
  }

  setTrump(isTrump) {
    this.isTrump = isTrump;
  }

  get effectiveValue() {
    return this.isTrump ? this.value + 100 : this.value;
  }

  get symbol() {
    return SUIT_SYMBOLS[this.suit];
  }

  get name() {
    return `${RANK_NAMES_RU[this.rank]} ${SUIT_NAMES_RU[this.suit]}`;
  }

  get shortName() {
    return `${this.rank}${this.symbol}`;
  }

  getSvg(faceUp = true) {
    if (!faceUp) {
      return CardGenerator.generateCardBackSvg();
    }
    return CardGenerator.generateCardFaceSvg(this.rank, this.suit);
  }
}
