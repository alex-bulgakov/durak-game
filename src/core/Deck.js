import { SUITS, RANKS, shuffleArray } from '../utils/helpers.js';
import { Card } from './Card.js';

export class Deck {
  constructor() {
    this.cards = [];
    this.trumpCard = null;
    this.trumpSuit = null;
    this.reset();
  }

  reset() {
    this.cards = [];
    for (const suit of Object.values(SUITS)) {
      for (const rank of RANKS) {
        this.cards.push(new Card(suit, rank));
      }
    }
    this.shuffle();
    // The bottom card is the trump card
    this.trumpCard = this.cards[0];
    this.trumpSuit = this.trumpCard.suit;

    // Mark all cards in deck as trump if they match the trump suit
    for (const card of this.cards) {
      card.setTrump(card.suit === this.trumpSuit);
    }
  }

  shuffle() {
    this.cards = shuffleArray(this.cards);
  }

  deal(count = 1) {
    const dealt = [];
    for (let i = 0; i < count; i++) {
      if (this.cards.length > 0) {
        // Pop from top of deck (last element in array, while trump card is index 0)
        dealt.push(this.cards.pop());
      }
    }
    return dealt;
  }

  get remaining() {
    return this.cards.length;
  }

  get isEmpty() {
    return this.cards.length === 0;
  }
}
