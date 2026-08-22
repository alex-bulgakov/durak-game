/**
 * Durak Rules Engine (Подкидной дурак)
 */
export class Rules {
  /**
   * Check if a card can beat an attacking card
   */
  static canDefend(attackCard, defenseCard, trumpSuit) {
    if (!attackCard || !defenseCard) return false;

    // If defense card is trump and attack card is not trump -> valid
    if (defenseCard.suit === trumpSuit && attackCard.suit !== trumpSuit) {
      return true;
    }

    // If both cards have the same suit -> defense card value must be strictly higher
    if (defenseCard.suit === attackCard.suit) {
      return defenseCard.value > attackCard.value;
    }

    // Different suits and defense card is not trump -> invalid
    return false;
  }

  /**
   * Get ranks present on table (both attack and defense cards)
   */
  static getTableRanks(tablePairs) {
    const ranks = new Set();
    for (const pair of tablePairs) {
      if (pair.attack) ranks.add(pair.attack.rank);
      if (pair.defense) ranks.add(pair.defense.rank);
    }
    return ranks;
  }

  /**
   * Check if a card can be used to attack / toss (подкинуть)
   */
  static canAttack(card, tablePairs, defenderHandCount) {
    if (!card) return false;

    // Total attacks in one round cannot exceed 6
    if (tablePairs.length >= 6) return false;

    // Count unbitten attack cards
    const unbittenCount = tablePairs.filter(p => !p.defense).length;

    // Attacker cannot put more cards than defender has in hand
    if (unbittenCount >= defenderHandCount) return false;

    // If table is empty, any card is valid
    if (tablePairs.length === 0) {
      return defenderHandCount > 0;
    }

    // If table has cards, card rank must match any rank currently on table
    const tableRanks = this.getTableRanks(tablePairs);
    return tableRanks.has(card.rank);
  }

  /**
   * Get all valid cards from attacker hand
   */
  static getValidAttacks(hand, tablePairs, defenderHandCount) {
    return hand.filter(card => this.canAttack(card, tablePairs, defenderHandCount));
  }

  /**
   * Get all valid cards from defender hand for a specific attack card
   */
  static getValidDefenses(attackCard, hand, trumpSuit) {
    return hand.filter(card => this.canDefend(attackCard, card, trumpSuit));
  }

  /**
   * Find lowest trump card in a player's hand
   */
  static getLowestTrump(hand, trumpSuit) {
    const trumps = hand.filter(c => c.suit === trumpSuit);
    if (trumps.length === 0) return null;
    return trumps.reduce((min, curr) => curr.value < min.value ? curr : min, trumps[0]);
  }

  /**
   * Check if all cards on table are beaten
   */
  static areAllAttacksBeaten(tablePairs) {
    if (tablePairs.length === 0) return false;
    return tablePairs.every(p => p.attack && p.defense);
  }
}
