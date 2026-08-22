/**
 * Real-time Multiplayer Matchmaking Service
 * Handles search queue and synchronization exclusively for real live players.
 */
export class MatchmakingService {
  constructor() {
    this.channel = null;
    this.status = 'IDLE'; // 'IDLE' | 'SEARCHING' | 'FOUND' | 'PLAYING'
    this.roomId = null;
    this.isHost = false;
    this.currentUser = null;
    this.opponent = null;
    this.searchInterval = null;
    this.onMatchFound = null;
    this.onOpponentAction = null;
    this.onOpponentDisconnect = null;

    this.initChannel();
  }

  initChannel() {
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        this.channel = new BroadcastChannel('durak_online_real_matchmaking');
        this.channel.onmessage = (e) => this.handleChannelMessage(e.data);
      } catch (err) {
        console.warn('BroadcastChannel not supported', err);
      }
    }
  }

  handleChannelMessage(msg) {
    if (!msg || !msg.type) return;

    // Discovery: Another real player is looking for a match
    if (msg.type === 'LOOKING_FOR_MATCH' && this.status === 'SEARCHING') {
      // Must be a different real user
      if (msg.user && String(msg.user.id) !== String(this.currentUser?.id)) {
        const roomId = `room_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
        this.status = 'FOUND';
        this.roomId = roomId;
        this.isHost = true;
        this.opponent = msg.user;
        this.stopSearchBroadcast();

        // Send MATCH_ACCEPT to the other player
        this.sendMessage({
          type: 'MATCH_ACCEPT',
          targetUserId: msg.user.id,
          hostUser: this.currentUser,
          roomId
        });

        if (this.onMatchFound) {
          this.onMatchFound(this.opponent, true, roomId, false);
        }
      }
    }

    // A match was accepted by the hosting real player
    else if (msg.type === 'MATCH_ACCEPT' && this.status === 'SEARCHING') {
      if (String(msg.targetUserId) === String(this.currentUser?.id)) {
        this.status = 'FOUND';
        this.roomId = msg.roomId;
        this.isHost = false;
        this.opponent = msg.hostUser;
        this.stopSearchBroadcast();

        if (this.onMatchFound) {
          this.onMatchFound(this.opponent, false, msg.roomId, false);
        }
      }
    }

    // In-game remote actions from real opponent
    else if (msg.type === 'GAME_ACTION' && msg.roomId === this.roomId) {
      if (String(msg.senderId) !== String(this.currentUser?.id) && this.onOpponentAction) {
        this.onOpponentAction(msg.action);
      }
    }

    // Opponent disconnected / left
    else if (msg.type === 'PLAYER_LEFT' && msg.roomId === this.roomId) {
      if (this.onOpponentDisconnect) {
        this.onOpponentDisconnect();
      }
    }
  }

  sendMessage(data) {
    if (this.channel) {
      try {
        this.channel.postMessage(data);
      } catch (e) {}
    }
  }

  sendGameAction(action) {
    this.sendMessage({
      type: 'GAME_ACTION',
      roomId: this.roomId,
      senderId: this.currentUser?.id,
      action
    });
  }

  /**
   * Start searching exclusively for real live players
   */
  startSearch(user, onMatchFoundCallback) {
    this.currentUser = user;
    this.status = 'SEARCHING';
    this.onMatchFound = onMatchFoundCallback;
    this.opponent = null;
    this.roomId = null;

    const broadcastSearch = () => {
      if (this.status === 'SEARCHING') {
        this.sendMessage({
          type: 'LOOKING_FOR_MATCH',
          user: this.currentUser
        });
      }
    };

    // Initial broadcast
    broadcastSearch();

    // Periodic broadcast while searching
    if (this.searchInterval) clearInterval(this.searchInterval);
    this.searchInterval = setInterval(broadcastSearch, 1800);
  }

  stopSearchBroadcast() {
    if (this.searchInterval) {
      clearInterval(this.searchInterval);
      this.searchInterval = null;
    }
  }

  /**
   * Cancel search queue
   */
  cancelSearch() {
    this.stopSearchBroadcast();
    this.status = 'IDLE';
    this.opponent = null;
    this.roomId = null;
  }

  leaveMatch() {
    if (this.roomId) {
      this.sendMessage({
        type: 'PLAYER_LEFT',
        roomId: this.roomId,
        senderId: this.currentUser?.id
      });
    }
    this.stopSearchBroadcast();
    this.status = 'IDLE';
    this.roomId = null;
    this.opponent = null;
  }
}

export const matchmakingService = new MatchmakingService();
