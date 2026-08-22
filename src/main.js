import { GameState } from './core/GameState.js';
import { Renderer } from './ui/Renderer.js';
import { SoundEffects } from './ui/SoundEffects.js';
import { UIController } from './ui/UIController.js';

document.addEventListener('DOMContentLoaded', () => {
  const domElements = {
    statusBadge: document.getElementById('statusBadge'),
    botHand: document.getElementById('botHand'),
    botCardCount: document.getElementById('botCardCount'),
    deckContainer: document.getElementById('deckContainer'),
    tablePairs: document.getElementById('tablePairs'),
    discardContainer: document.getElementById('discardContainer'),
    playerHand: document.getElementById('playerHand'),
    playerCardCount: document.getElementById('playerCardCount'),
    btnPass: document.getElementById('btnPass'),
    btnTake: document.getElementById('btnTake'),
    btnNewGame: document.getElementById('btnNewGame'),
    btnSoundToggle: document.getElementById('btnSoundToggle'),
    gameLog: document.getElementById('gameLog'),
    gameOverModal: document.getElementById('gameOverModal'),
    gameOverIcon: document.getElementById('gameOverIcon'),
    gameOverTitle: document.getElementById('gameOverTitle'),
    gameOverDesc: document.getElementById('gameOverDesc'),
    btnRestartModal: document.getElementById('btnRestartModal')
  };

  const gameState = new GameState();
  const renderer = new Renderer(domElements);
  const soundEffects = new SoundEffects();
  const uiController = new UIController(gameState, renderer, soundEffects, domElements);

  // Start the first match
  uiController.startNewGame();
});
