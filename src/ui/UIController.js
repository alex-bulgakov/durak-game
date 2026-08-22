import { PLAYERS, GAME_MODES } from '../core/GameState.js';
import { BotStrategy } from '../ai/BotStrategy.js';
import { Rules } from '../core/Rules.js';
import { delay } from '../utils/helpers.js';
import { vkService } from '../services/VKService.js';
import { leaderboardService } from '../services/LeaderboardService.js';
import { matchmakingService } from '../services/MatchmakingService.js';

export class UIController {
  constructor(gameState, renderer, soundEffects, domElements) {
    this.state = gameState;
    this.renderer = renderer;
    this.sound = soundEffects;
    this.elements = domElements;
    this.selectedCard = null;
    this.isBotProcessing = false;
    this.isSimulatedOnline = false;
    this.searchTimerInterval = null;
    this.searchStartTime = 0;
    this.playerBubbleTimer = null;
    this.opponentBubbleTimer = null;

    this.init();
  }

  async init() {
    const user = await vkService.init();
    await leaderboardService.loadStats(user.id);

    this.state.playerProfile = {
      id: user.id,
      name: user.name,
      photo: user.photo
    };

    this.initEvents();
    this.showLobby();
  }

  initEvents() {
    this.state.onSoundRequest = (soundName) => {
      if (soundName === 'deal') this.sound.playCardDeal();
      else if (soundName === 'snap') this.sound.playCardSnap();
      else if (soundName === 'bito') this.sound.playBito();
      else if (soundName === 'take') this.sound.playTake();
      else if (soundName === 'win') this.sound.playWin();
      else if (soundName === 'lose') this.sound.playLose();
      else if (soundName === 'msg') this.sound.playMessage();
    };

    this.state.onStateChange = async () => {
      this.renderer.render(this.state, this.selectedCard);
      await this.handleOpponentTurnIfNeeded();
    };

    this.state.onGameOver = async (result) => {
      await leaderboardService.recordMatchResult(result, this.state.playerProfile.id, this.state.playerProfile);
      setTimeout(() => {
        vkService.showInterstitialAd();
      }, 1200);
    };

    // Remote multiplayer opponent actions
    matchmakingService.onOpponentAction = (action) => {
      if (!action) return;
      if (action.type === 'ATTACK') {
        const card = this.state.botHand.find(c => c.id === action.cardId) || action.card;
        this.state.attack(card, PLAYERS.OPPONENT);
      } else if (action.type === 'DEFEND') {
        const card = this.state.botHand.find(c => c.id === action.cardId) || action.card;
        this.state.defend(card, action.pairIndex, PLAYERS.OPPONENT);
      } else if (action.type === 'PASS') {
        this.state.passAttack(PLAYERS.OPPONENT);
      } else if (action.type === 'TAKE') {
        this.state.declareTake(PLAYERS.OPPONENT);
      } else if (action.type === 'CHAT_MESSAGE') {
        this.receiveOpponentMessage(action.text);
      }
    };

    matchmakingService.onOpponentDisconnect = () => {
      alert('Соперник покинул игру. Вам присуждена техническая победа!');
      this.state.gameOver = true;
      this.state.winner = PLAYERS.PLAYER;
      this.state.notify();
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

    // Click on Table Pair (to defend)
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

          if (this.state.gameMode === GAME_MODES.ONLINE && !this.isSimulatedOnline) {
            matchmakingService.sendGameAction({ type: 'DEFEND', cardId: playedCard.id, pairIndex });
          }

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

        if (this.state.gameMode === GAME_MODES.ONLINE && !this.isSimulatedOnline) {
          matchmakingService.sendGameAction({ type: 'PASS' });
        }

        this.state.passAttack(PLAYERS.PLAYER);
      });
    }

    // Take Button
    if (this.elements.btnTake) {
      this.elements.btnTake.addEventListener('click', () => {
        if (this.state.gameOver || this.isBotProcessing) return;
        this.sound.playClick();
        this.selectedCard = null;

        if (this.state.gameMode === GAME_MODES.ONLINE && !this.isSimulatedOnline) {
          matchmakingService.sendGameAction({ type: 'TAKE' });
        }

        this.state.declareTake(PLAYERS.PLAYER);
      });
    }

    // Chat Drawer Toggles
    const openChat = () => {
      this.sound.playClick();
      this.elements.chatDrawer?.classList.add('visible');
      if (this.elements.chatUnreadBadge) {
        this.elements.chatUnreadBadge.style.display = 'none';
      }
    };

    const closeChat = () => {
      this.sound.playClick();
      this.elements.chatDrawer?.classList.remove('visible');
    };

    this.elements.btnChatToggle?.addEventListener('click', openChat);
    this.elements.btnQuickChat?.addEventListener('click', openChat);
    this.elements.btnCloseChat?.addEventListener('click', closeChat);

    // Chat Quick Emojis
    document.querySelectorAll('.btn-emoji').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const emoji = btn.dataset.emoji;
        if (emoji) {
          this.sendChatMessage(emoji);
        }
      });
    });

    // Chat Quick Phrases
    document.querySelectorAll('.btn-phrase').forEach(btn => {
      btn.addEventListener('click', () => {
        const phrase = btn.dataset.phrase;
        if (phrase) {
          this.sendChatMessage(phrase);
        }
      });
    });

    // Chat Form Submit
    if (this.elements.chatForm) {
      this.elements.chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = this.elements.chatInput?.value?.trim();
        if (text) {
          this.sendChatMessage(text);
          if (this.elements.chatInput) this.elements.chatInput.value = '';
        }
      });
    }

    // Lobby Buttons
    if (this.elements.btnModeBot) {
      this.elements.btnModeBot.addEventListener('click', () => {
        this.sound.playClick();
        this.startBotGame();
      });
    }

    if (this.elements.btnModeOnline) {
      this.elements.btnModeOnline.addEventListener('click', () => {
        this.sound.playClick();
        this.startOnlineMatchmaking();
      });
    }

    if (this.elements.btnCancelMatchmaking) {
      this.elements.btnCancelMatchmaking.addEventListener('click', () => {
        this.sound.playClick();
        this.cancelMatchmaking();
      });
    }

    if (this.elements.btnLobbyMenu) {
      this.elements.btnLobbyMenu.addEventListener('click', () => {
        this.sound.playClick();
        this.showLobby();
      });
    }

    if (this.elements.btnBackToLobby) {
      this.elements.btnBackToLobby.addEventListener('click', () => {
        this.sound.playClick();
        this.elements.gameOverModal?.classList.remove('visible');
        this.showLobby();
      });
    }

    // Leaderboard Modal
    const openLeaderboard = () => {
      this.sound.playClick();
      const leaders = leaderboardService.getLeaderboard(this.state.playerProfile);
      this.renderer.renderLeaderboard(leaders, leaderboardService.stats);
      this.elements.leaderboardModal?.classList.add('visible');
    };

    this.elements.btnLeaderboard?.addEventListener('click', openLeaderboard);
    this.elements.btnLobbyLeaderboard?.addEventListener('click', openLeaderboard);

    this.elements.btnCloseLeaderboard?.addEventListener('click', () => {
      this.sound.playClick();
      this.elements.leaderboardModal?.classList.remove('visible');
    });

    // VK Social actions
    this.elements.btnLobbyFavorite?.addEventListener('click', () => {
      this.sound.playClick();
      vkService.addToFavorites();
    });

    this.elements.btnLobbyShare?.addEventListener('click', () => {
      this.sound.playClick();
      vkService.shareGame();
    });

    this.elements.btnPostWall?.addEventListener('click', () => {
      this.sound.playClick();
      vkService.postToWall();
    });

    // Sound Toggle
    if (this.elements.btnSoundToggle) {
      this.updateSoundButtonUI();
      this.elements.btnSoundToggle.addEventListener('click', () => {
        const isEnabled = this.sound.toggle();
        this.updateSoundButtonUI();
        if (isEnabled) this.sound.playClick();
      });
    }

    // Restart Modal
    if (this.elements.btnRestartModal) {
      this.elements.btnRestartModal.addEventListener('click', () => {
        this.sound.playClick();
        this.elements.gameOverModal?.classList.remove('visible');
        if (this.state.gameMode === GAME_MODES.ONLINE) {
          this.startOnlineMatchmaking();
        } else {
          this.startBotGame();
        }
      });
    }
  }

  sendChatMessage(text) {
    if (!text) return;
    this.sound.playMessage();

    // Show Speech Bubble over player avatar
    this.showSpeechBubble(this.elements.playerSpeechBubble, text, true);

    // Append to chat messages list
    this.appendChatMessage(this.state.playerProfile.name, text, true);

    // Send via network if online
    if (this.state.gameMode === GAME_MODES.ONLINE && !this.isSimulatedOnline) {
      matchmakingService.sendGameAction({ type: 'CHAT_MESSAGE', text });
    }

    // Bot / simulated opponent response
    if (this.state.gameMode === GAME_MODES.BOT || this.isSimulatedOnline) {
      this.scheduleOpponentChatReply(text);
    }
  }

  receiveOpponentMessage(text) {
    this.sound.playMessage();
    this.showSpeechBubble(this.elements.opponentSpeechBubble, text, false);
    this.appendChatMessage(this.state.opponentProfile.name, text, false);

    // Show red unread dot if chat drawer is closed
    if (this.elements.chatDrawer && !this.elements.chatDrawer.classList.contains('visible')) {
      if (this.elements.chatUnreadBadge) {
        this.elements.chatUnreadBadge.style.display = 'block';
      }
    }
  }

  showSpeechBubble(container, text, isPlayer) {
    if (!container) return;
    container.innerHTML = `<div class="chat-bubble-pop">${text}</div>`;

    if (isPlayer) {
      if (this.playerBubbleTimer) clearTimeout(this.playerBubbleTimer);
      this.playerBubbleTimer = setTimeout(() => {
        container.innerHTML = '';
      }, 3500);
    } else {
      if (this.opponentBubbleTimer) clearTimeout(this.opponentBubbleTimer);
      this.opponentBubbleTimer = setTimeout(() => {
        container.innerHTML = '';
      }, 3500);
    }
  }

  appendChatMessage(sender, text, isMy) {
    if (!this.elements.chatMessagesFeed) return;
    const row = document.createElement('div');
    row.className = `chat-msg-row ${isMy ? 'my-msg' : 'opp-msg'}`;
    row.innerHTML = `
      <span class="chat-msg-sender">${sender}</span>
      <span class="chat-msg-text">${text}</span>
    `;
    this.elements.chatMessagesFeed.appendChild(row);
    this.elements.chatMessagesFeed.scrollTop = this.elements.chatMessagesFeed.scrollHeight;
  }

  scheduleOpponentChatReply(incomingText) {
    setTimeout(() => {
      let reply = '👍';
      if (incomingText.includes('привет') || incomingText.includes('👋')) {
        reply = 'Привет! Удачи! 🍀';
      } else if (incomingText.includes('Удачи')) {
        reply = 'И тебе удачи! 👍';
      } else if (incomingText.includes('Хороший') || incomingText.includes('👍')) {
        reply = 'Спасибо! 😎';
      } else if (incomingText.includes('Бито')) {
        reply = 'Чисто! 🧹';
      } else if (incomingText.includes('Спасибо')) {
        reply = 'Отличная игра! 🤝';
      } else {
        const casuals = ['👍', '😎', '🃏', 'Интересно...', 'Хорошая игра!'];
        reply = casuals[Math.floor(Math.random() * casuals.length)];
      }

      this.receiveOpponentMessage(reply);
    }, 1400);
  }

  showLobby() {
    this.elements.lobbyModal?.classList.add('visible');
  }

  hideLobby() {
    this.elements.lobbyModal?.classList.remove('visible');
  }

  startBotGame() {
    this.hideLobby();
    this.isSimulatedOnline = false;
    this.state.setProfiles(
      this.state.playerProfile,
      { name: '🤖 Бот', photo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=80' },
      GAME_MODES.BOT
    );
    this.selectedCard = null;
    this.isBotProcessing = false;
    this.state.startNewGame();
  }

  startOnlineMatchmaking() {
    this.hideLobby();
    this.elements.matchmakingModal?.classList.add('visible');
    this.searchStartTime = Date.now();

    if (this.elements.matchSearchTimer) {
      this.elements.matchSearchTimer.textContent = '00:01';
    }

    if (this.searchTimerInterval) clearInterval(this.searchTimerInterval);
    this.searchTimerInterval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - this.searchStartTime) / 1000);
      const mm = String(Math.floor(elapsed / 60)).padStart(2, '0');
      const ss = String(elapsed % 60).padStart(2, '0');
      if (this.elements.matchSearchTimer) {
        this.elements.matchSearchTimer.textContent = `${mm}:${ss}`;
      }
    }, 1000);

    matchmakingService.startSearch(this.state.playerProfile, (opponent, isHost, roomId, isSimulated = false) => {
      clearInterval(this.searchTimerInterval);
      this.elements.matchmakingModal?.classList.remove('visible');
      this.isSimulatedOnline = isSimulated;

      this.state.setProfiles(
        this.state.playerProfile,
        { name: opponent.name, photo: opponent.photo },
        GAME_MODES.ONLINE
      );

      this.selectedCard = null;
      this.isBotProcessing = false;
      this.state.startNewGame();
    });
  }

  cancelMatchmaking() {
    if (this.searchTimerInterval) clearInterval(this.searchTimerInterval);
    matchmakingService.cancelSearch();
    this.elements.matchmakingModal?.classList.remove('visible');
    this.showLobby();
  }

  updateSoundButtonUI() {
    if (!this.elements.btnSoundToggle) return;
    const isEnabled = this.sound.enabled;
    this.elements.btnSoundToggle.innerHTML = isEnabled 
      ? '<span class="icon">🔊</span>' 
      : '<span class="icon">🔇</span>';
    this.elements.btnSoundToggle.classList.toggle('muted', !isEnabled);
  }

  handlePlayerCardClick(card) {
    if (this.state.attacker === PLAYERS.PLAYER) {
      if (Rules.canAttack(card, this.state.tablePairs, this.state.botHand.length)) {
        this.selectedCard = null;
        if (this.state.gameMode === GAME_MODES.ONLINE && !this.isSimulatedOnline) {
          matchmakingService.sendGameAction({ type: 'ATTACK', cardId: card.id });
        }
        this.state.attack(card, PLAYERS.PLAYER);
      }
      return;
    }

    if (this.state.defender === PLAYERS.PLAYER && !this.state.defenderTaking) {
      const unbittenPairs = [];
      this.state.tablePairs.forEach((pair, idx) => {
        if (!pair.defense && Rules.canDefend(pair.attack, card, this.state.deck.trumpSuit)) {
          unbittenPairs.push(idx);
        }
      });

      if (unbittenPairs.length === 0) return;

      if (unbittenPairs.length === 1) {
        this.selectedCard = null;
        if (this.state.gameMode === GAME_MODES.ONLINE && !this.isSimulatedOnline) {
          matchmakingService.sendGameAction({ type: 'DEFEND', cardId: card.id, pairIndex: unbittenPairs[0] });
        }
        this.state.defend(card, unbittenPairs[0], PLAYERS.PLAYER);
      } else {
        if (this.selectedCard && this.selectedCard.id === card.id) {
          this.selectedCard = null;
        } else {
          this.selectedCard = card;
        }
        this.renderer.render(this.state, this.selectedCard);
      }
    }
  }

  async handleOpponentTurnIfNeeded() {
    if (this.state.gameOver || this.isBotProcessing) return;

    if (this.state.gameMode === GAME_MODES.ONLINE && !this.isSimulatedOnline) {
      return;
    }

    const opponentThinkDelay = this.isSimulatedOnline ? 1000 : 700;

    if (this.state.attacker === PLAYERS.OPPONENT) {
      const needAttack = this.state.tablePairs.length === 0 || 
        Rules.areAllAttacksBeaten(this.state.tablePairs) || 
        this.state.defenderTaking;

      if (needAttack) {
        this.isBotProcessing = true;
        await delay(opponentThinkDelay);

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
          this.state.attack(decision.card, PLAYERS.OPPONENT);
        } else if (decision.action === 'PASS') {
          this.isBotProcessing = false;
          await this.state.passAttack(PLAYERS.OPPONENT);
        } else {
          this.isBotProcessing = false;
        }
      }
    } else if (this.state.defender === PLAYERS.OPPONENT && !this.state.defenderTaking) {
      const hasUnbitten = this.state.tablePairs.some(p => !p.defense);

      if (hasUnbitten) {
        this.isBotProcessing = true;
        await delay(opponentThinkDelay + 200);

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
          this.state.defend(decision.card, decision.targetIndex, PLAYERS.OPPONENT);
        } else if (decision.action === 'TAKE') {
          this.isBotProcessing = false;
          this.state.declareTake(PLAYERS.OPPONENT);
        } else {
          this.isBotProcessing = false;
        }
      }
    }
  }
}
