import { PLAYERS } from '../core/GameState.js';
import { BotStrategy } from '../ai/BotStrategy.js';
import { Rules } from '../core/Rules.js';
import { delay } from '../utils/helpers.js';

export class UIController {
  constructor(gameState, renderer, soundEffects, domElements) {
    this.state = gameState;
    this.renderer = renderer;
    this.sound = soundEffects;
    this.elements = domElements;
    this.selectedCard = null;
    this.isBotProcessing = false;

    this.initEvents();
  }

  initEvents() {
    // Sound request from GameState
    this.state.onSoundRequest = (soundName) => {
      if (soundName === 'deal') this.sound.playCardDeal();
      else if (soundName === 'snap') this.sound.playCardSnap();
      else if (soundName === 'bito') this.sound.playBito();
      else if (soundName === 'take') this.sound.playTake();
      else if (soundName === 'win') this.sound.playWin();
      else if (soundName === 'lose') this.sound.playLose();
    };

    // State change callback -> re-render & check if bot needs to move
    this.state.onStateChange = async () => {
      this.renderer.render(this.state, this.selectedCard);
      await this.handleBotTurnIfNeeded();
    };

    // Click on Player Card
    if (this.elements.playerHand) {
      this.elements.playerHand.addEventListener('click', (e) => {
        const cardEl = e.target.closest('.player-card');
        if (!cardEl || this.state.gameOver || this.isBotProcessing) return;

        const cardId = cardEl.dataset.cardId;
        const card = this.state.playerHand.find(c => c.id === cardId);
        if (!card) return;

        this.handlePlayerCardClick(card);
      });
    }

    // Click on Table Pair (to defend with selected card)
    if (this.elements.tablePairs) {
      this.elements.tablePairs.addEventListener('click', (e) => {
        const pairEl = e.target.closest('.table-pair');
        if (!pairEl || !this.selectedCard || this.state.gameOver || this.isBotProcessing) return;

        const pairIndex = parseInt(pairEl.dataset.pairIndex, 10);
        if (isNaN(pairIndex)) return;

        const pair = this.state.tablePairs[pairIndex];
        if (pair && !pair.defense && Rules.canDefend(pair.attack, this.selectedCard, this.state.deck.trumpSuit)) {
          const playedCard = this.selectedCard;
          this.selectedCard = null;
          this.state.defend(playedCard, pairIndex, PLAYERS.PLAYER);
        }
      });
    }

    // Pass / Bito Button
    if (this.elements.btnPass) {
      this.elements.btnPass.addEventListener('click', () => {
        if (this.state.gameOver || this.isBotProcessing) return;
        this.sound.playClick();
        this.selectedCard = null;
        this.state.passAttack(PLAYERS.PLAYER);
      });
    }

    // Take Button
    if (this.elements.btnTake) {
      this.elements.btnTake.addEventListener('click', () => {
        if (this.state.gameOver || this.isBotProcessing) return;
        this.sound.playClick();
        this.selectedCard = null;
        this.state.declareTake(PLAYERS.PLAYER);
      });
    }

    // Restart / New Game Buttons
    if (this.elements.btnNewGame) {
      this.elements.btnNewGame.addEventListener('click', () => {
        this.sound.playClick();
        this.startNewGame();
      });
    }

    if (this.elements.btnRestartModal) {
      this.elements.btnRestartModal.addEventListener('click', () => {
        this.sound.playClick();
        this.startNewGame();
      });
    }

    // Sound Toggle
    if (this.elements.btnSoundToggle) {
      this.updateSoundButtonUI();
      this.elements.btnSoundToggle.addEventListener('click', () => {
        const isEnabled = this.sound.toggle();
        this.updateSoundButtonUI();
        if (isEnabled) this.sound.playClick();
      });
    }
  }

  updateSoundButtonUI() {
    if (!this.elements.btnSoundToggle) return;
    const isEnabled = this.sound.enabled;
    this.elements.btnSoundToggle.innerHTML = isEnabled 
      ? '<span class="icon">🔊</span> Звук: Вкл' 
      : '<span class="icon">🔇</span> Звук: Выкл';
    this.elements.btnSoundToggle.classList.toggle('muted', !isEnabled);
  }

  startNewGame() {
    this.selectedCard = null;
    this.isBotProcessing = false;
    this.state.startNewGame();
  }

  handlePlayerCardClick(card) {
    // 1. If player is Attacker:
    if (this.state.attacker === PLAYERS.PLAYER) {
      if (Rules.canAttack(card, this.state.tablePairs, this.state.botHand.length)) {
        this.selectedCard = null;
        this.state.attack(card, PLAYERS.PLAYER);
      }
      return;
    }

    // 2. If player is Defender:
    if (this.state.defender === PLAYERS.PLAYER && !this.state.defenderTaking) {
      const unbittenPairs = [];
      this.state.tablePairs.forEach((pair, idx) => {
        if (!pair.defense && Rules.canDefend(pair.attack, card, this.state.deck.trumpSuit)) {
          unbittenPairs.push(idx);
        }
      });

      if (unbittenPairs.length === 0) {
        // Cannot defend with this card
        return;
      }

      // If exactly one pair can be defended, play immediately for snappy gameplay
      if (unbittenPairs.length === 1) {
        this.selectedCard = null;
        this.state.defend(card, unbittenPairs[0], PLAYERS.PLAYER);
      } else {
        // Toggle selection to let player choose which card to beat on table
        if (this.selectedCard && this.selectedCard.id === card.id) {
          this.selectedCard = null;
        } else {
          this.selectedCard = card;
        }
        this.renderer.render(this.state, this.selectedCard);
      }
    }
  }

  /**
   * Orchestrates the Bot's artificial intelligence actions
   */
  async handleBotTurnIfNeeded() {
    if (this.state.gameOver || this.isBotProcessing) return;

    // Case 1: Bot is Attacker
    if (this.state.attacker === PLAYERS.BOT) {
      // If table is empty or all cards on table are beaten (or player is taking)
      const needBotAttack = this.state.tablePairs.length === 0 || 
        Rules.areAllAttacksBeaten(this.state.tablePairs) || 
        this.state.defenderTaking;

      if (needBotAttack) {
        this.isBotProcessing = true;
        await delay(700);

        if (this.state.gameOver) {
          this.isBotProcessing = false;
          return;
        }

        const decision = BotStrategy.decideAttack(
          this.state.botHand,
          this.state.tablePairs,
          this.state.playerHand.length,
          this.state.deck.trumpSuit,
          this.state.deck.remaining
        );

        if (decision.action === 'ATTACK') {
          this.isBotProcessing = false;
          this.state.attack(decision.card, PLAYERS.BOT);
        } else if (decision.action === 'PASS') {
          this.isBotProcessing = false;
          await this.state.passAttack(PLAYERS.BOT);
        } else {
          this.isBotProcessing = false;
        }
      }
    }

    // Case 2: Bot is Defender
    else if (this.state.defender === PLAYERS.BOT && !this.state.defenderTaking) {
      const hasUnbitten = this.state.tablePairs.some(p => !p.defense);

      if (hasUnbitten) {
        this.isBotProcessing = true;
        await delay(800);

        if (this.state.gameOver) {
          this.isBotProcessing = false;
          return;
        }

        const decision = BotStrategy.decideDefense(
          this.state.botHand,
          this.state.tablePairs,
          this.state.deck.trumpSuit,
          this.state.deck.remaining
        );

        if (decision.action === 'DEFEND') {
          this.isBotProcessing = false;
          this.state.defend(decision.card, decision.targetIndex, PLAYERS.BOT);
        } else if (decision.action === 'TAKE') {
          this.isBotProcessing = false;
          this.state.declareTake(PLAYERS.BOT);
        } else {
          this.isBotProcessing = false;
        }
      }
    }
  }
}
