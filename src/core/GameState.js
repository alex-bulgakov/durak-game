import { Deck } from './Deck.js';
import { Rules } from './Rules.js';
import { SUIT_NAMES_RU } from '../utils/helpers.js';

export const PLAYERS = {
  PLAYER: 'player',
  OPPONENT: 'opponent'
};

export const GAME_MODES = {
  BOT: 'BOT',
  ONLINE: 'ONLINE'
};

export class GameState {
  constructor() {
    this.deck = new Deck();
    this.playerHand = [];
    this.botHand = []; // Opponent's hand
    this.tablePairs = [];
    this.discardPile = [];
    this.attacker = PLAYERS.PLAYER;
    this.defender = PLAYERS.OPPONENT;
    this.defenderTaking = false;
    this.gameOver = false;
    this.winner = null;
    this.logs = [];
    this.gameMode = GAME_MODES.BOT;

    this.playerProfile = {
      name: 'Вы',
      photo: 'https://vk.com/images/camera_200.png'
    };
    this.opponentProfile = {
      name: 'Бот',
      photo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=80'
    };

    this.onStateChange = null;
    this.onSoundRequest = null;
    this.onGameOver = null;
  }

  setProfiles(player, opponent, mode = GAME_MODES.BOT) {
    this.playerProfile = player || this.playerProfile;
    this.opponentProfile = opponent || this.opponentProfile;
    this.gameMode = mode;
  }

  log(msg) {
    this.logs.push(msg);
    if (this.logs.length > 50) this.logs.shift();
  }

  playSound(name) {
    if (this.onSoundRequest) {
      this.onSoundRequest(name);
    }
  }

  notify() {
    if (this.onStateChange) {
      this.onStateChange(this);
    }
  }

  startNewGame() {
    this.deck = new Deck();
    this.playerHand = [];
    this.botHand = [];
    this.tablePairs = [];
    this.discardPile = [];
    this.defenderTaking = false;
    this.gameOver = false;
    this.winner = null;
    this.logs = [];

    this.log(`🎮 Партия началась! Козырь: ${SUIT_NAMES_RU[this.deck.trumpSuit]} (${this.deck.trumpCard.symbol})`);

    // Deal 6 cards to each
    this.playerHand = this.deck.deal(6);
    this.botHand = this.deck.deal(6);
    this.sortHand(this.playerHand);
    this.sortHand(this.botHand);

    // Determine who goes first: lowest trump
    const playerLowTrump = Rules.getLowestTrump(this.playerHand, this.deck.trumpSuit);
    const botLowTrump = Rules.getLowestTrump(this.botHand, this.deck.trumpSuit);

    const playerName = this.playerProfile.name;
    const opponentName = this.opponentProfile.name;

    if (playerLowTrump && botLowTrump) {
      if (playerLowTrump.value < botLowTrump.value) {
        this.attacker = PLAYERS.PLAYER;
        this.defender = PLAYERS.OPPONENT;
        this.log(`👉 Первым ходит ${playerName} (козырь ${playerLowTrump.shortName})`);
      } else {
        this.attacker = PLAYERS.OPPONENT;
        this.defender = PLAYERS.PLAYER;
        this.log(`👉 Первым ходит ${opponentName} (козырь ${botLowTrump.shortName})`);
      }
    } else if (playerLowTrump) {
      this.attacker = PLAYERS.PLAYER;
      this.defender = PLAYERS.OPPONENT;
      this.log(`👉 Первым ходит ${playerName} (козырь ${playerLowTrump.shortName})`);
    } else if (botLowTrump) {
      this.attacker = PLAYERS.OPPONENT;
      this.defender = PLAYERS.PLAYER;
      this.log(`👉 Первым ходит ${opponentName} (козырь ${botLowTrump.shortName})`);
    } else {
      this.attacker = PLAYERS.PLAYER;
      this.defender = PLAYERS.OPPONENT;
      this.log(`👉 Козырей на руках нет. Первый ход за ${playerName}.`);
    }

    this.playSound('deal');
    this.notify();
  }

  sortHand(hand) {
    hand.sort((a, b) => {
      if (a.isTrump !== b.isTrump) {
        return a.isTrump ? 1 : -1;
      }
      if (a.suit !== b.suit) {
        return a.suit.localeCompare(b.suit);
      }
      return a.value - b.value;
    });
  }

  /**
   * Player or Opponent attacks with card
   */
  attack(card, player = PLAYERS.PLAYER) {
    if (this.gameOver) return false;
    if (this.attacker !== player) return false;

    const defenderHand = player === PLAYERS.PLAYER ? this.botHand : this.playerHand;
    const attackerHand = player === PLAYERS.PLAYER ? this.playerHand : this.botHand;

    // Check validity
    if (!Rules.canAttack(card, this.tablePairs, defenderHand.length)) {
      return false;
    }

    // Remove from attacker hand
    const idx = attackerHand.findIndex(c => c.id === card.id);
    if (idx === -1) return false;
    attackerHand.splice(idx, 1);

    // Add to table
    this.tablePairs.push({
      id: `pair_${Date.now()}_${Math.random()}`,
      attack: card,
      defense: null
    });

    const who = player === PLAYERS.PLAYER ? this.playerProfile.name : this.opponentProfile.name;
    this.log(`${who} ходит: ${card.name}`);
    this.playSound('snap');
    this.notify();
    return true;
  }

  /**
   * Player or Opponent defends against an attack card
   */
  defend(defenseCard, pairIndex, player = PLAYERS.PLAYER) {
    if (this.gameOver) return false;
    if (this.defender !== player) return false;
    if (this.defenderTaking) return false;

    const pair = this.tablePairs[pairIndex];
    if (!pair || pair.defense !== null) return false;

    if (!Rules.canDefend(pair.attack, defenseCard, this.deck.trumpSuit)) {
      return false;
    }

    const defenderHand = player === PLAYERS.PLAYER ? this.playerHand : this.botHand;
    const idx = defenderHand.findIndex(c => c.id === defenseCard.id);
    if (idx === -1) return false;
    defenderHand.splice(idx, 1);

    pair.defense = defenseCard;

    const who = player === PLAYERS.PLAYER ? this.playerProfile.name : this.opponentProfile.name;
    this.log(`${who} отбивает: ${pair.attack.shortName} картой ${defenseCard.name}`);
    this.playSound('snap');
    this.notify();
    return true;
  }

  /**
   * Defender decides to take all cards
   */
  declareTake(player = PLAYERS.PLAYER) {
    if (this.gameOver) return false;
    if (this.defender !== player) return false;
    if (this.tablePairs.length === 0) return false;

    this.defenderTaking = true;
    const who = player === PLAYERS.PLAYER ? this.playerProfile.name : this.opponentProfile.name;
    this.log(`📥 ${who} берет карты.`);
    this.playSound('take');
    this.notify();
    return true;
  }

  /**
   * Attacker passes / confirms bito
   */
  async passAttack(player = PLAYERS.PLAYER) {
    if (this.gameOver) return false;
    if (this.attacker !== player) return false;
    if (this.tablePairs.length === 0) return false;

    // If defender is taking cards
    if (this.defenderTaking) {
      await this.finishRoundTake();
    } else {
      // Check if all cards are beaten
      if (!Rules.areAllAttacksBeaten(this.tablePairs)) {
        return false;
      }
      await this.finishRoundBito();
    }
    return true;
  }

  async finishRoundBito() {
    this.log(`🧹 Бито! Карты уходят в сброс.`);
    this.playSound('bito');

    for (const pair of this.tablePairs) {
      if (pair.attack) this.discardPile.push(pair.attack);
      if (pair.defense) this.discardPile.push(pair.defense);
    }
    this.tablePairs = [];
    this.defenderTaking = false;

    await this.replenishHands();

    // Roles swap: defender becomes attacker
    const prevAttacker = this.attacker;
    this.attacker = this.defender;
    this.defender = prevAttacker;

    this.checkGameOver();
    this.notify();
  }

  async finishRoundTake() {
    const defender = this.defender;
    const targetHand = defender === PLAYERS.PLAYER ? this.playerHand : this.botHand;

    for (const pair of this.tablePairs) {
      if (pair.attack) targetHand.push(pair.attack);
      if (pair.defense) targetHand.push(pair.defense);
    }
    this.tablePairs = [];
    this.defenderTaking = false;

    this.sortHand(targetHand);
    this.playSound('take');

    await this.replenishHands();

    // Attacker stays attacker because defender took cards
    this.checkGameOver();
    this.notify();
  }

  async replenishHands() {
    // Attacker draws first up to 6, then defender draws up to 6
    const attackerHand = this.attacker === PLAYERS.PLAYER ? this.playerHand : this.botHand;
    const defenderHand = this.defender === PLAYERS.PLAYER ? this.playerHand : this.botHand;

    const attackerNeed = Math.max(0, 6 - attackerHand.length);
    if (attackerNeed > 0 && this.deck.remaining > 0) {
      const drawn = this.deck.deal(attackerNeed);
      attackerHand.push(...drawn);
    }

    const defenderNeed = Math.max(0, 6 - defenderHand.length);
    if (defenderNeed > 0 && this.deck.remaining > 0) {
      const drawn = this.deck.deal(defenderNeed);
      defenderHand.push(...drawn);
    }

    this.sortHand(this.playerHand);
    this.sortHand(this.botHand);
  }

  checkGameOver() {
    if (this.deck.remaining === 0) {
      const playerEmpty = this.playerHand.length === 0;
      const botEmpty = this.botHand.length === 0;

      if (playerEmpty && botEmpty) {
        this.gameOver = true;
        this.winner = 'draw';
        this.log(`🤝 Ничья! Карты закончились у обоих.`);
        this.playSound('win');
        if (this.onGameOver) this.onGameOver('DRAW');
      } else if (playerEmpty) {
        this.gameOver = true;
        this.winner = PLAYERS.PLAYER;
        this.log(`🏆 Поздравляем! ${this.playerProfile.name} победил(а)!`);
        this.playSound('win');
        if (this.onGameOver) this.onGameOver('WIN');
      } else if (botEmpty) {
        this.gameOver = true;
        this.winner = PLAYERS.OPPONENT;
        this.log(`🤦 ${this.opponentProfile.name} победил(а)!`);
        this.playSound('lose');
        if (this.onGameOver) this.onGameOver('LOSS');
      }
    }
  }
}
