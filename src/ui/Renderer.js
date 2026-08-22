import { CardGenerator } from '../components/CardGenerator.js';
import { Rules } from '../core/Rules.js';
import { PLAYERS, GAME_MODES } from '../core/GameState.js';
import { SUIT_NAMES_RU } from '../utils/helpers.js';

export class Renderer {
  constructor(domElements) {
    this.elements = domElements;
  }

  render(state, selectedPlayerCard = null) {
    this.renderHeader(state);
    this.renderProfiles(state);
    this.renderDeckAndDiscard(state);
    this.renderBotHand(state);
    this.renderTable(state, selectedPlayerCard);
    this.renderPlayerHand(state, selectedPlayerCard);
    this.renderControls(state);
    this.renderLogs(state);
    this.renderGameOver(state);
  }

  renderProfiles(state) {
    // Opponent Profile (Top)
    if (this.elements.opponentName) {
      this.elements.opponentName.textContent = state.opponentProfile?.name || 'Соперник';
    }
    if (this.elements.opponentAvatar && state.opponentProfile?.photo) {
      this.elements.opponentAvatar.src = state.opponentProfile.photo;
    }

    // Current Player Profile (Bottom)
    if (this.elements.playerName) {
      this.elements.playerName.textContent = state.playerProfile?.name || 'Вы';
    }
    if (this.elements.playerAvatar && state.playerProfile?.photo) {
      this.elements.playerAvatar.src = state.playerProfile.photo;
    }
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
      } else if (state.winner === PLAYERS.OPPONENT) {
        statusText = `💀 ПОРАЖЕНИЕ! ${state.opponentProfile.name} победил.`;
        statusClass = 'status-lose';
      } else {
        statusText = '🤝 НИЧЬЯ! Боевая ничья!';
        statusClass = 'status-draw';
      }
    } else if (isPlayerTurn) {
      if (isDefenderTaking) {
        statusText = `${state.opponentProfile.name} берет карты. Подкиньте еще или нажмите «Бито»`;
      } else if (state.tablePairs.length === 0) {
        statusText = 'Ваш ход: выберите карту для атаки';
      } else if (Rules.areAllAttacksBeaten(state.tablePairs)) {
        statusText = 'Все карты отбиты! Подкиньте еще или нажмите «Бито»';
      } else {
        statusText = `Ждем защиты от ${state.opponentProfile.name}...`;
      }
      statusClass = 'status-player';
    } else {
      if (isDefenderTaking) {
        statusText = 'Вы берете карты. Соперник подкидывает...';
        statusClass = 'status-bot';
      } else {
        const unbitten = state.tablePairs.filter(p => !p.defense).length;
        if (unbitten > 0) {
          statusText = 'Защищайтесь! Отбейте карту на столе или нажмите «Взять»';
          statusClass = 'status-alert';
        } else {
          statusText = `${state.opponentProfile.name} атакует...`;
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
        ` : '';

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
    const mid = (count - 1) / 2;
    const angleStep = count <= 6 ? 2.5 : Math.max(1.2, 16 / Math.max(1, count));
    const overlap = count <= 4 ? 8 : (count <= 6 ? 20 : Math.min(45, Math.max(18, 240 / Math.max(1, count))));

    state.botHand.forEach((card, idx) => {
      const rot = ((idx - mid) * -angleStep).toFixed(2);
      const y = (Math.abs(idx - mid) * 1.5).toFixed(1);

      cardsHtml += `
        <div class="card-item bot-card" 
             style="--card-index: ${idx}; margin-left: ${idx === 0 ? 0 : -overlap}px; transform: rotate(${rot}deg) translateY(${y}px); transform-origin: center top;">
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
    const mid = (count - 1) / 2;
    // Dynamic fan angle and spacing
    const angleStep = count <= 5 ? 4.5 : (count <= 8 ? 3.5 : Math.max(2, 26 / Math.max(1, count)));
    const overlap = count <= 4 ? 8 : (count <= 6 ? 22 : Math.min(48, Math.max(18, 280 / Math.max(1, count))));

    state.playerHand.forEach((card, idx) => {
      const isSelected = selectedPlayerCard && selectedPlayerCard.id === card.id;

      let isPlayable = false;
      if (!state.gameOver) {
        if (state.attacker === PLAYERS.PLAYER) {
          isPlayable = Rules.canAttack(card, state.tablePairs, state.botHand.length);
        } else if (state.defender === PLAYERS.PLAYER && !state.defenderTaking) {
          isPlayable = state.tablePairs.some(p => !p.defense && Rules.canDefend(p.attack, card, state.deck.trumpSuit));
        }
      }

      const rot = ((idx - mid) * angleStep).toFixed(2);
      const yOffset = (Math.pow(Math.abs(idx - mid), 1.25) * 2.2).toFixed(1);

      cardsHtml += `
        <div class="card-item player-card ${isSelected ? 'selected' : ''} ${isPlayable ? 'playable' : ''} ${card.isTrump ? 'is-trump' : ''}" 
             data-card-id="${card.id}" 
             data-index="${idx}"
             style="--card-index: ${idx}; --fan-rot: ${rot}deg; --fan-y: ${yOffset}px; margin-left: ${idx === 0 ? 0 : -overlap}px;">
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

    if (this.elements.btnPass) {
      if (isPlayerAttacker && state.tablePairs.length > 0) {
        const canPass = state.defenderTaking || Rules.areAllAttacksBeaten(state.tablePairs);
        this.elements.btnPass.disabled = !canPass || state.gameOver;
        this.elements.btnPass.textContent = state.defenderTaking ? `Завершить (${state.opponentProfile.name} берет)` : 'Бито';
        this.elements.btnPass.classList.toggle('highlight-btn', canPass);
        this.elements.btnPass.style.display = 'inline-flex';
      } else {
        this.elements.btnPass.style.display = 'none';
      }
    }

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
        title = 'Победа!';
        desc = `Отличная игра! Вы победили соперника (${state.opponentProfile.name}).`;
      } else if (state.winner === PLAYERS.OPPONENT) {
        icon = '🃏';
        title = 'Поражение!';
        desc = `В этот раз победу одержал ${state.opponentProfile.name}. Попробуйте взять реванш!`;
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

  renderLeaderboard(leaders, currentStats) {
    if (!this.elements.leaderboardList) return;

    let html = '';
    leaders.forEach(item => {
      const isTop3 = item.rank <= 3;
      const rankBadge = item.rank === 1 ? '🥇' : (item.rank === 2 ? '🥈' : (item.rank === 3 ? '🥉' : `#${item.rank}`));
      const highlight = item.isCurrentUser ? 'leader-item-current' : '';

      html += `
        <div class="leader-item ${highlight}">
          <div class="leader-rank ${isTop3 ? 'top-rank' : ''}">${rankBadge}</div>
          <img src="${item.photo}" class="leader-avatar" alt="${item.name}" />
          <div class="leader-info">
            <div class="leader-name">${item.name} ${item.isCurrentUser ? '<span class="you-tag">(Вы)</span>' : ''}</div>
            <div class="leader-streak">Побед: ${item.wins} | Серия: 🔥${item.streak || 0}</div>
          </div>
          <div class="leader-rating">${item.rating} <span>pts</span></div>
        </div>
      `;
    });

    this.elements.leaderboardList.innerHTML = html;

    if (this.elements.myRatingDisplay) {
      this.elements.myRatingDisplay.textContent = currentStats.rating;
    }
    if (this.elements.myWinsDisplay) {
      this.elements.myWinsDisplay.textContent = currentStats.wins;
    }
    if (this.elements.myWinRateDisplay) {
      const wr = currentStats.totalGames > 0 ? Math.round((currentStats.wins / currentStats.totalGames) * 100) : 0;
      this.elements.myWinRateDisplay.textContent = `${wr}%`;
    }
  }

  getCardWord(num) {
    if (num % 10 === 1 && num % 100 !== 11) return 'карта';
    if ([2, 3, 4].includes(num % 10) && ![12, 13, 14].includes(num % 100)) return 'карты';
    return 'карт';
  }
}
