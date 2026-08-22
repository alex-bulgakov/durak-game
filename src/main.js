import { GameState } from './core/GameState.js';
import { Renderer } from './ui/Renderer.js';
import { SoundEffects } from './ui/SoundEffects.js';
import { UIController } from './ui/UIController.js';

document.addEventListener('DOMContentLoaded', () => {
  const domElements = {
    statusBadge: document.getElementById('statusBadge'),
    botHand: document.getElementById('botHand'),
    botCardCount: document.getElementById('botCardCount'),
    opponentAvatar: document.getElementById('opponentAvatar'),
    opponentName: document.getElementById('opponentName'),
    deckContainer: document.getElementById('deckContainer'),
    tablePairs: document.getElementById('tablePairs'),
    discardContainer: document.getElementById('discardContainer'),
    playerHand: document.getElementById('playerHand'),
    playerCardCount: document.getElementById('playerCardCount'),
    playerAvatar: document.getElementById('playerAvatar'),
    playerName: document.getElementById('playerName'),
    btnPass: document.getElementById('btnPass'),
    btnTake: document.getElementById('btnTake'),
    btnSoundToggle: document.getElementById('btnSoundToggle'),
    btnLeaderboard: document.getElementById('btnLeaderboard'),
    btnLobbyMenu: document.getElementById('btnLobbyMenu'),
    gameLog: document.getElementById('gameLog'),
    
    // Modals
    lobbyModal: document.getElementById('lobbyModal'),
    btnModeBot: document.getElementById('btnModeBot'),
    btnModeOnline: document.getElementById('btnModeOnline'),
    btnLobbyLeaderboard: document.getElementById('btnLobbyLeaderboard'),
    btnLobbyFavorite: document.getElementById('btnLobbyFavorite'),
    btnLobbyShare: document.getElementById('btnLobbyShare'),

    matchmakingModal: document.getElementById('matchmakingModal'),
    matchSearchTimer: document.getElementById('matchSearchTimer'),
    btnCancelMatchmaking: document.getElementById('btnCancelMatchmaking'),

    leaderboardModal: document.getElementById('leaderboardModal'),
    btnCloseLeaderboard: document.getElementById('btnCloseLeaderboard'),
    leaderboardList: document.getElementById('leaderboardList'),
    myRatingDisplay: document.getElementById('myRatingDisplay'),
    myWinsDisplay: document.getElementById('myWinsDisplay'),
    myWinRateDisplay: document.getElementById('myWinRateDisplay'),

    gameOverModal: document.getElementById('gameOverModal'),
    gameOverIcon: document.getElementById('gameOverIcon'),
    gameOverTitle: document.getElementById('gameOverTitle'),
    gameOverDesc: document.getElementById('gameOverDesc'),
    btnRestartModal: document.getElementById('btnRestartModal'),
    btnPostWall: document.getElementById('btnPostWall'),
    btnBackToLobby: document.getElementById('btnBackToLobby')
  };

  const gameState = new GameState();
  const renderer = new Renderer(domElements);
  const soundEffects = new SoundEffects();
  new UIController(gameState, renderer, soundEffects, domElements);
});
