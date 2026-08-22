import vkBridge from '@vkontakte/vk-bridge';

/**
 * Real Players Leaderboard Service
 * Stores and manages only real players who played the game.
 */
export class LeaderboardService {
  constructor() {
    this.statsKey = 'durak_player_stats_v1';
    this.allPlayersKey = 'durak_all_real_players_v1';
    this.stats = {
      rating: 1000,
      wins: 0,
      losses: 0,
      draws: 0,
      totalGames: 0,
      currentStreak: 0,
      bestStreak: 0
    };
  }

  async loadStats(userId) {
    // 1. Try VK Storage
    try {
      const response = await vkBridge.send('VKWebAppStorageGet', {
        keys: [this.statsKey]
      });
      if (response.keys && response.keys[0] && response.keys[0].value) {
        const parsed = JSON.parse(response.keys[0].value);
        this.stats = { ...this.stats, ...parsed };
        return this.stats;
      }
    } catch (e) {}

    // 2. Fallback to localStorage
    try {
      const local = localStorage.getItem(`${this.statsKey}_${userId || 'guest'}`);
      if (local) {
        this.stats = { ...this.stats, ...JSON.parse(local) };
      }
    } catch (e) {
      console.warn('Failed to parse local stats', e);
    }

    return this.stats;
  }

  async saveStats(userId, playerProfile = null) {
    const jsonStr = JSON.stringify(this.stats);

    // Save individual stats
    try {
      localStorage.setItem(`${this.statsKey}_${userId || 'guest'}`, jsonStr);
    } catch (e) {}

    try {
      await vkBridge.send('VKWebAppStorageSet', {
        key: this.statsKey,
        value: jsonStr
      });
    } catch (e) {}

    // Update in real players registry
    if (playerProfile) {
      this.updateRealPlayerRegistry(playerProfile);
    }
  }

  getRealPlayersList() {
    try {
      const raw = localStorage.getItem(this.allPlayersKey);
      if (raw) {
        const list = JSON.parse(raw);
        if (Array.isArray(list)) return list;
      }
    } catch (e) {}
    return [];
  }

  saveRealPlayersList(list) {
    try {
      localStorage.setItem(this.allPlayersKey, JSON.stringify(list));
    } catch (e) {}
  }

  updateRealPlayerRegistry(playerProfile) {
    if (!playerProfile || !playerProfile.id) return;
    const list = this.getRealPlayersList();
    const existingIndex = list.findIndex(p => String(p.id) === String(playerProfile.id));

    const playerEntry = {
      id: playerProfile.id,
      name: playerProfile.name || 'Игрок VK',
      photo: playerProfile.photo || 'https://vk.com/images/camera_200.png',
      rating: this.stats.rating,
      wins: this.stats.wins,
      streak: this.stats.currentStreak,
      totalGames: this.stats.totalGames
    };

    if (existingIndex >= 0) {
      list[existingIndex] = playerEntry;
    } else {
      list.push(playerEntry);
    }

    this.saveRealPlayersList(list);
  }

  async recordMatchResult(result, userId, playerProfile = null) {
    this.stats.totalGames++;

    if (result === 'WIN') {
      this.stats.wins++;
      this.stats.currentStreak++;
      if (this.stats.currentStreak > this.stats.bestStreak) {
        this.stats.bestStreak = this.stats.currentStreak;
      }
      this.stats.rating += 25;
    } else if (result === 'LOSS') {
      this.stats.losses++;
      this.stats.currentStreak = 0;
      this.stats.rating = Math.max(100, this.stats.rating - 15);
    } else {
      this.stats.draws++;
      this.stats.rating += 5;
    }

    await this.saveStats(userId, playerProfile);
    return this.stats;
  }

  getWinRate() {
    if (this.stats.totalGames === 0) return 0;
    return Math.round((this.stats.wins / this.stats.totalGames) * 100);
  }

  /**
   * Returns Leaderboard containing ONLY real players
   */
  getLeaderboard(currentUser) {
    // Current player entry
    const playerEntry = {
      id: currentUser?.id || 'me',
      name: currentUser?.name || 'Вы',
      photo: currentUser?.photo || 'https://vk.com/images/camera_200.png',
      rating: this.stats.rating,
      wins: this.stats.wins,
      streak: this.stats.currentStreak,
      totalGames: this.stats.totalGames,
      isCurrentUser: true
    };

    // Real other players who joined
    const realPlayers = this.getRealPlayersList().filter(
      p => String(p.id) !== String(playerEntry.id)
    );

    const all = [playerEntry, ...realPlayers].sort((a, b) => b.rating - a.rating);

    return all.map((entry, index) => ({
      ...entry,
      rank: index + 1
    }));
  }
}

export const leaderboardService = new LeaderboardService();
