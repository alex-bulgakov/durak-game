import { CardGenerator } from '../components/CardGenerator.js';
import { Rules } from '../core/Rules.js';
import { PLAYERS } from '../core/GameState.js';
import { SUIT_NAMES_RU } from '../utils/helpers.js';

export class Renderer {
  constructor(domElements) {
    this.elements = domElements;
  }

  render(state, selectedPlayerCard = null) {
    this.renderHeader(state);
    this.renderDeckAndDiscard(state);
    this.renderBotHand(state);
    this.renderTable(state, selectedPlayerCard);
    this.renderPlayerHand(state, selectedPlayerCard);
    this.renderControls(state);
    this.renderLogs(state);
    this.renderGameOver(state);
  }

  renderHeader(state) {
    const isPlayerTurn = state.attacker === PLAYERS.PLAYER;
    const isDefenderTaking = state.defenderTaking;

    let statusText = '';
    let statusClass = '';

    if (state.gameOver) {
      if (state.winner === PLAYERS.PLAYER) {
        statusText = '🎉 ПОБЕДА! Вы выиграли партию!';
        statusClass = 'status-win';
      } else if (state.winner === PLAYERS.BOT) {
        statusText = '💀 ВЫ ДУРАК! Бот победил в этой партии.';
        statusClass = 'status-lose';
      } else {
        statusText = '🤝 НИЧЬЯ! Боевая ничья!';
        statusClass = 'status-draw';
      }
    } else if (isPlayerTurn) {
      if (isDefenderTaking) {
        statusText = 'Бот берет карты. Вы можете подкинуть еще или нажать «Бито»';
      } else if (state.tablePairs.length === 0) {
        statusText = 'Ваш ход: выберите карту для атаки';
      } else if (Rules.areAllAttacksBeaten(state.tablePairs)) {
        statusText = 'Все карты отбиты! Подкиньте еще или нажмите «Бито»';
      } else {
        statusText = 'Ждем ответа Бота...';
      }
      statusClass = 'status-player';
    } else {
      // Bot is attacker
      if (isDefenderTaking) {
        statusText = 'Вы берете карты. Бот подкидывает...';
        statusClass = 'status-bot';
      } else {
        const unbitten = state.tablePairs.filter(p => !p.defense).length;
        if (unbitten > 0) {
          statusText = 'Защищайтесь! Отбейте карту на столе или нажмите «Взять»';
          statusClass = 'status-alert';
        } else {
          statusText = 'Бот атакует...';
          statusClass = 'status-bot';
        }
      }
    }

    if (this.elements.statusBadge) {
      this.elements.statusBadge.textContent = statusText;
      this.elements.statusBadge.className = `status-badge ${statusClass}`;
    }
  }

  renderDeckAndDiscard(state) {
    // Render Trump Suit & Deck
    const trumpSuitName = state.deck.trumpSuit ? SUIT_NAMES_RU[state.deck.trumpSuit] : '';
    const trumpCard = state.deck.trumpCard;
    const remaining = state.deck.remaining;

    if (this.elements.deckContainer) {
      if (remaining === 0) {
        this.elements.deckContainer.innerHTML = `
          <div class="deck-empty-placeholder">
            <div class="trump-badge-small">Козырь: ${trumpSuitName}</div>
            <div class="trump-icon-indicator">${trumpCard ? CardGenerator.getSuitSvg(state.deck.trumpSuit, 36) : ''}</div>
            <span class="empty-deck-label">Колода пуста</span>
          </div>
        `;
      } else {
        // Deck with remaining cards and bottom trump card
        const trumpRotated = trumpCard ? `
          <div class="trump-card-wrapper" title="Козырь: ${trumpCard.name}">
            ${trumpCard.getSvg(true)}
          </div>
        ` : '';

        const deckStack = remaining > 1 ? `
          <div class="deck-stack-card" style="transform: translate(-2px, -2px);">
            ${CardGenerator.generateCardBackSvg()}
          </div>
          <div class="deck-stack-card" style="transform: translate(0px, 0px);">
            ${CardGenerator.generateCardBackSvg()}
          </div>
        ` : (remaining === 1 ? '' : '');

        this.elements.deckContainer.innerHTML = `
          <div class="deck-area">
            ${trumpRotated}
            <div class="deck-top-wrapper">
              ${deckStack}
              <div class="deck-counter-badge">${remaining}</div>
            </div>
          </div>
        `;
      }
    }

    // Render Discard Pile (Бито)
    if (this.elements.discardContainer) {
      const count = state.discardPile.length;
      if (count === 0) {
        this.elements.discardContainer.innerHTML = `
          <div class="discard-placeholder">
            <span class="discard-label">БИТО</span>
            <span class="discard-count">0</span>
          </div>
        `;
      } else {
        this.elements.discardContainer.innerHTML = `
          <div class="discard-pile-cards">
            <div class="discard-card-art">
              ${CardGenerator.generateCardBackSvg()}
            </div>
            <div class="discard-count-badge">${count}</div>
            <span class="discard-label">БИТО</span>
          </div>
        `;
      }
    }
  }

  renderBotHand(state) {
    if (!this.elements.botHand) return;
    const count = state.botHand.length;

    let cardsHtml = '';
    const maxSpacing = Math.min(45, 600 / Math.max(1, count));

    state.botHand.forEach((card, idx) => {
      cardsHtml += `
        <div class="card-item bot-card" style="--card-index: ${idx}; margin-left: ${idx === 0 ? 0 : -maxSpacing}px;">
          ${CardGenerator.generateCardBackSvg()}
        </div>
      `;
    });

    this.elements.botHand.innerHTML = cardsHtml;
    if (this.elements.botCardCount) {
      this.elements.botCardCount.textContent = `${count} ${this.getCardWord(count)}`;
    }
  }

  renderTable(state, selectedPlayerCard) {
    if (!this.elements.tablePairs) return;

    if (state.tablePairs.length === 0) {
      this.elements.tablePairs.innerHTML = `
        <div class="table-empty-hint">
          <span class="hint-icon">🃏</span>
          <span class="hint-text">${state.attacker === PLAYERS.PLAYER ? 'Сделайте ход картой' : 'Ожидание хода соперника'}</span>
        </div>
      `;
      return;
    }

    let pairsHtml = '';
    state.tablePairs.forEach((pair, idx) => {
      const isUnbitten = !pair.defense;
      const canBeDefendedBySelected = selectedPlayerCard && isUnbitten && state.defender === PLAYERS.PLAYER &&
        Rules.canDefend(pair.attack, selectedPlayerCard, state.deck.trumpSuit);

      pairsHtml += `
        <div class="table-pair ${canBeDefendedBySelected ? 'pair-targetable' : ''}" data-pair-index="${idx}">
          <div class="card-item table-attack-card">
            ${pair.attack.getSvg(true)}
          </div>
          ${pair.defense ? `
            <div class="card-item table-defense-card">
              ${pair.defense.getSvg(true)}
            </div>
          ` : (canBeDefendedBySelected ? `
            <div class="defense-drop-slot">
              <span class="slot-hint">Побить</span>
            </div>
          ` : '')}
        </div>
      `;
    });

    this.elements.tablePairs.innerHTML = pairsHtml;
  }

  renderPlayerHand(state, selectedPlayerCard) {
    if (!this.elements.playerHand) return;
    const count = state.playerHand.length;

    let cardsHtml = '';
    const maxSpacing = Math.min(55, 750 / Math.max(1, count));

    state.playerHand.forEach((card, idx) => {
      const isSelected = selectedPlayerCard && selectedPlayerCard.id === card.id;

      // Determine if card is playable
      let isPlayable = false;
      if (!state.gameOver) {
        if (state.attacker === PLAYERS.PLAYER) {
          isPlayable = Rules.canAttack(card, state.tablePairs, state.botHand.length);
        } else if (state.defender === PLAYERS.PLAYER && !state.defenderTaking) {
          // Playable if it can defend against any currently unbitten attack card
          isPlayable = state.tablePairs.some(p => !p.defense && Rules.canDefend(p.attack, card, state.deck.trumpSuit));
        }
      }

      cardsHtml += `
        <div class="card-item player-card ${isSelected ? 'selected' : ''} ${isPlayable ? 'playable' : ''} ${card.isTrump ? 'is-trump' : ''}" 
             data-card-id="${card.id}" 
             data-index="${idx}"
             style="--card-index: ${idx}; margin-left: ${idx === 0 ? 0 : -maxSpacing}px;">
          ${card.getSvg(true)}
          ${card.isTrump ? '<div class="trump-glow-tag">КОЗЫРЬ</div>' : ''}
        </div>
      `;
    });

    this.elements.playerHand.innerHTML = cardsHtml;
    if (this.elements.playerCardCount) {
      this.elements.playerCardCount.textContent = `${count} ${this.getCardWord(count)}`;
    }
  }

  renderControls(state) {
    const isPlayerAttacker = state.attacker === PLAYERS.PLAYER;
    const isPlayerDefender = state.defender === PLAYERS.PLAYER;

    // Pass / Bito button
    if (this.elements.btnPass) {
      if (isPlayerAttacker && state.tablePairs.length > 0) {
        const canPass = state.defenderTaking || Rules.areAllAttacksBeaten(state.tablePairs);
        this.elements.btnPass.disabled = !canPass || state.gameOver;
        this.elements.btnPass.textContent = state.defenderTaking ? 'Завершить (Бот берет)' : 'Бито';
        this.elements.btnPass.classList.toggle('highlight-btn', canPass);
        this.elements.btnPass.style.display = 'inline-flex';
      } else {
        this.elements.btnPass.style.display = 'none';
      }
    }

    // Take button
    if (this.elements.btnTake) {
      if (isPlayerDefender && state.tablePairs.length > 0 && !state.defenderTaking) {
        this.elements.btnTake.disabled = state.gameOver;
        this.elements.btnTake.style.display = 'inline-flex';
      } else {
        this.elements.btnTake.style.display = 'none';
      }
    }
  }

  renderLogs(state) {
    if (!this.elements.gameLog) return;
    const recent = state.logs.slice(-6);
    this.elements.gameLog.innerHTML = recent.map(msg => `<div class="log-item">${msg}</div>`).join('');
    this.elements.gameLog.scrollTop = this.elements.gameLog.scrollHeight;
  }

  renderGameOver(state) {
    if (!this.elements.gameOverModal) return;

    if (state.gameOver) {
      let title = '';
      let icon = '';
      let desc = '';

      if (state.winner === PLAYERS.PLAYER) {
        icon = '🏆';
        title = 'Вы выиграли!';
        desc = 'Отличная игра! Бот остался в дураках.';
      } else if (state.winner === PLAYERS.BOT) {
        icon = '🃏';
        title = 'Вы проиграли!';
        desc = 'В этот раз победил Бот. Попробуйте еще раз!';
      } else {
        icon = '🤝';
        title = 'Ничья!';
        desc = 'Оба игрока остались без карт одновременно.';
      }

      this.elements.gameOverIcon.textContent = icon;
      this.elements.gameOverTitle.textContent = title;
      this.elements.gameOverDesc.textContent = desc;
      this.elements.gameOverModal.classList.add('visible');
    } else {
      this.elements.gameOverModal.classList.remove('visible');
    }
  }

  getCardWord(num) {
    if (num % 10 === 1 && num % 100 !== 11) return 'карта';
    if ([2, 3, 4].includes(num % 10) && ![12, 13, 14].includes(num % 100)) return 'карты';
    return 'карт';
  }
}
