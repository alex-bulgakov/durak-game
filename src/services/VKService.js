import vkBridge from '@vkontakte/vk-bridge';

/**
 * VK Bridge Service
 * Handles VK Mini Apps / Games platform requirements, authentication,
 * monetization, social features, and local fallback.
 */
export class VKService {
  constructor() {
    this.isVK = false;
    this.user = null;
    this.initialized = false;
  }

  async init() {
    try {
      // Send Init signal to VK
      const initResult = await vkBridge.send('VKWebAppInit');
      this.isVK = true;
      this.initialized = true;
      console.log('✅ VK Bridge initialized successfully:', initResult);

      // Request User Profile Info
      try {
        const userInfo = await vkBridge.send('VKWebAppGetUserInfo');
        this.user = {
          id: userInfo.id,
          name: `${userInfo.first_name} ${userInfo.last_name}`,
          firstName: userInfo.first_name,
          lastName: userInfo.last_name,
          photo: userInfo.photo_200 || userInfo.photo_100 || null,
          sex: userInfo.sex, // 1 - female, 2 - male
          city: userInfo.city?.title || ''
        };
      } catch (userErr) {
        console.warn('VK user info not available, using default profile:', userErr);
        this.user = this.getDefaultUser();
      }

      // Setup View Settings (status bar / header)
      try {
        await vkBridge.send('VKWebAppSetViewSettings', {
          status_bar_style: 'light',
          action_bar_color: '#071f13'
        });
      } catch (e) {
        // Ignored on web
      }

    } catch (err) {
      console.warn('Running outside VK environment or VKBridge failed. Using fallback mock.', err);
      this.isVK = false;
      this.initialized = true;
      this.user = this.getDefaultUser();
    }

    return this.user;
  }

  getDefaultUser() {
    // Generate a persistent guest / test VK user
    let storedId = localStorage.getItem('vk_durak_user_id');
    if (!storedId) {
      storedId = String(Math.floor(100000 + Math.random() * 900000));
      localStorage.setItem('vk_durak_user_id', storedId);
    }

    return {
      id: storedId,
      name: 'Игрок VK',
      firstName: 'Игрок',
      lastName: 'VK',
      photo: 'https://vk.com/images/camera_200.png',
      sex: 2,
      city: 'Россия'
    };
  }

  /**
   * Show Interstitial Ad (VK requirement for moderation)
   */
  async showInterstitialAd() {
    if (!this.isVK) {
      console.log('Mock: Interstitial Ad shown (outside VK)');
      return { result: true };
    }

    try {
      const data = await vkBridge.send('VKWebAppShowNativeAds', { ad_format: 'interstitial' });
      return data;
    } catch (err) {
      console.warn('Ad playback skipped or failed:', err);
      return { result: false, error: err };
    }
  }

  /**
   * Show Rewarded Ad (for bonuses / coins)
   */
  async showRewardAd() {
    if (!this.isVK) {
      console.log('Mock: Rewarded Ad watched (outside VK)');
      return { result: true };
    }

    try {
      const data = await vkBridge.send('VKWebAppShowNativeAds', { ad_format: 'reward' });
      return data;
    } catch (err) {
      console.warn('Reward ad error:', err);
      return { result: false, error: err };
    }
  }

  /**
   * Add to VK Favorites
   */
  async addToFavorites() {
    if (!this.isVK) {
      alert('Добавление в избранное доступно при игре ВКонтакте!');
      return false;
    }
    try {
      const res = await vkBridge.send('VKWebAppAddToFavorites');
      return res.result;
    } catch (err) {
      console.warn('Add to favorites failed:', err);
      return false;
    }
  }

  /**
   * Share Game Link with Friends
   */
  async shareGame() {
    if (!this.isVK) {
      if (navigator.share) {
        navigator.share({ title: 'Подкидной Дурак Онлайн', url: window.location.href });
      } else {
        navigator.clipboard.writeText(window.location.href);
        alert('Ссылка на игру скопирована в буфер обмена!');
      }
      return true;
    }

    try {
      await vkBridge.send('VKWebAppShare', {
        link: 'https://vk.com/app' + (window.vkAppId || '5173')
      });
      return true;
    } catch (err) {
      console.warn('Share error:', err);
      return false;
    }
  }

  /**
   * Post victory to Wall
   */
  async postToWall(message = 'Я победил в Подкидного Дурака Онлайн! Кто бросит вызов?') {
    if (!this.isVK) {
      console.log('Mock Wall post:', message);
      return true;
    }

    try {
      await vkBridge.send('VKWebAppShowWallPostBox', {
        message: `${message}\nСыграй со мной: https://vk.com/app${window.vkAppId || ''}`
      });
      return true;
    } catch (err) {
      console.warn('Wall post failed:', err);
      return false;
    }
  }
}

export const vkService = new VKService();
