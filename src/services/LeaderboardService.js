import vkBridge from '@vkontakte/vk-bridge';

/**
 * Leaderboard & Player Stats Service
 * Manages ratings, win streaks, match history and leaderboard rankings
 */
export class LeaderboardService {
  constructor() {
    this.statsKey = 'durak_player_stats_v1';
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
    // 1. Try to load from VK Storage if available
    try {
      const response = await vkBridge.send('VKWebAppStorageGet', {
        keys: [this.statsKey]
      });
      if (response.keys && response.keys[0] && response.keys[0].value) {
        const parsed = JSON.parse(response.keys[0].value);
        this.stats = { ...this.stats, ...parsed };
        return this.stats;
      }
    } catch (e) {
      // Fallback to localStorage
    }

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

  async saveStats(userId) {
    const jsonStr = JSON.stringify(this.stats);

    // 1. Save to localStorage
    try {
      localStorage.setItem(`${this.statsKey}_${userId || 'guest'}`, jsonStr);
    } catch (e) {}

    // 2. Save to VK Storage
    try {
      await vkBridge.send('VKWebAppStorageSet', {
        key: this.statsKey,
        value: jsonStr
      });
    } catch (e) {}
  }

  async recordMatchResult(result, userId) {
    // result: 'WIN' | 'LOSS' | 'DRAW'
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

    await this.saveStats(userId);
    return this.stats;
  }

  getWinRate() {
    if (this.stats.totalGames === 0) return 0;
    return Math.round((this.stats.wins / this.stats.totalGames) * 100);
  }

  /**
   * Generates a realistic Leaderboard list with the current player positioned correctly
   */
  getLeaderboard(currentUser) {
    const defaultLeaders = [
      { id: '101', name: 'Александр Смирнов', photo: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80', rating: 2450, wins: 142, streak: 8 },
      { id: '102', name: 'Елена Кузнецова', photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80', rating: 2280, wins: 118, streak: 5 },
      { id: '103', name: 'Дмитрий Волков', photo: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&auto=format&fit=crop&q=80', rating: 2110, wins: 95, streak: 4 },
      { id: '104', name: 'Мария Соколова', photo: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&auto=format&fit=crop&q=80', rating: 1950, wins: 81, streak: 3 },
      { id: '105', name: 'Максим Морозов', photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80', rating: 1820, wins: 64, streak: 2 },
      { id: '106', name: 'Анастасия Попова', photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80', rating: 1690, wins: 52, streak: 3 },
      { id: '107', name: 'Сергей Васильев', photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80', rating: 1540, wins: 41, streak: 1 },
      { id: '108', name: 'Ольга Новикова', photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80', rating: 1410, wins: 33, streak: 2 },
      { id: '109', name: 'Артем Федоров', photo: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=100&auto=format&fit=crop&q=80', rating: 1250, wins: 22, streak: 1 },
      { id: '110', name: 'Виктория Михайлова', photo: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80', rating: 1100, wins: 15, streak: 0 }
    ];

    const playerEntry = {
      id: currentUser?.id || 'me',
      name: currentUser?.name || 'Вы',
      photo: currentUser?.photo || 'https://vk.com/images/camera_200.png',
      rating: this.stats.rating,
      wins: this.stats.wins,
      streak: this.stats.currentStreak,
      isCurrentUser: true
    };

    // Merge and sort
    const all = [...defaultLeaders, playerEntry].sort((a, b) => b.rating - a.rating);

    // Assign rank
    return all.map((entry, index) => ({
      ...entry,
      rank: index + 1
    }));
  }
}

export const leaderboardService = new LeaderboardService();
