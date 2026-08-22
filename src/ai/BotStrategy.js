import { Rules } from '../core/Rules.js';

export class BotStrategy {
  /**
   * Decide Bot Attack Action
   */
  static decideAttack(botHand, tablePairs, playerHandCount, trumpSuit, deckRemaining) {
    const validCards = Rules.getValidAttacks(botHand, tablePairs, playerHandCount);

    if (validCards.length === 0) {
      return { action: 'PASS' };
    }

    // Sort valid cards: non-trumps first (by ascending value), then trumps (by ascending value)
    const sorted = [...validCards].sort((a, b) => {
      if (a.isTrump !== b.isTrump) {
        return a.isTrump ? 1 : -1; // non-trumps first
      }
      return a.value - b.value;
    });

    // If starting a new round (table empty)
    if (tablePairs.length === 0) {
      return { action: 'ATTACK', card: sorted[0] };
    }

    // If tossing cards into ongoing round:
    // Prefer tossing non-trump cards
    const nonTrump = sorted.find(c => !c.isTrump);
    if (nonTrump) {
      return { action: 'ATTACK', card: nonTrump };
    }

    // If only trumps are available to toss:
    // Toss trump only if deck is empty or trump value is low (<= 8) and player has few cards
    if (deckRemaining === 0 || (sorted[0].value <= 8 && playerHandCount <= 3)) {
      return { action: 'ATTACK', card: sorted[0] };
    }

    // Otherwise, decide to pass (Bito) to keep trumps
    return { action: 'PASS' };
  }

  /**
   * Decide Bot Defense Action
   */
  static decideDefense(botHand, tablePairs, trumpSuit, deckRemaining) {
    // Find the first unbitten attack card
    const targetIndex = tablePairs.findIndex(p => p.attack && !p.defense);
    if (targetIndex === -1) {
      return { action: 'IDLE' };
    }

    const attackCard = tablePairs[targetIndex].attack;
    const validDefenses = Rules.getValidDefenses(attackCard, botHand, trumpSuit);

    if (validDefenses.length === 0) {
      return { action: 'TAKE' };
    }

    // Sort valid cards: non-trumps first (ascending), then trumps (ascending)
    const sortedDefenses = [...validDefenses].sort((a, b) => {
      if (a.isTrump !== b.isTrump) {
        return a.isTrump ? 1 : -1;
      }
      return a.value - b.value;
    });

    const bestChoice = sortedDefenses[0];

    // Tactical heuristic: If best defense is a high trump (Queen/King/Ace) on an early turn with a full deck
    // and there are already many cards on table, taking might be acceptable, but generally in Durak defending is prioritized.
    // If it's a non-trump or low/medium trump, defend immediately:
    if (!bestChoice.isTrump || bestChoice.value <= 11 || deckRemaining <= 6 || tablePairs.length <= 2) {
      return { action: 'DEFEND', card: bestChoice, targetIndex };
    }

    // In severe situations where bot would have to burn Ace of Trumps for a 6 in turn 1 with huge deck
    if (bestChoice.isTrump && bestChoice.value >= 13 && !attackCard.isTrump && deckRemaining > 18) {
      return { action: 'TAKE' };
    }

    return { action: 'DEFEND', card: bestChoice, targetIndex };
  }
}
