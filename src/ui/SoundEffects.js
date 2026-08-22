/**
 * Procedural Web Audio API Sound Synthesizer
 * No external audio files needed
 */
export class SoundEffects {
  constructor() {
    this.ctx = null;
    this.enabled = localStorage.getItem('durak_sound_enabled') !== 'false';
  }

  initContext() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggle() {
    this.enabled = !this.enabled;
    localStorage.setItem('durak_sound_enabled', this.enabled);
    return this.enabled;
  }

  playCardDeal() {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(450, t);
    osc.frequency.exponentialRampToValueAtTime(120, t + 0.08);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, t);

    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.08);
  }

  playCardSnap() {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    // White noise burst + high resonant pop
    const bufferSize = this.ctx.sampleRate * 0.05;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1400, t);
    filter.Q.setValueAtTime(3, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start(t);
    noise.stop(t + 0.05);
  }

  playBito() {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.18);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.18);
  }

  playTake() {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    [0, 0.04, 0.08].forEach((delayTime, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320 - idx * 40, t + delayTime);
      osc.frequency.exponentialRampToValueAtTime(150, t + delayTime + 0.06);

      gain.gain.setValueAtTime(0.1, t + delayTime);
      gain.gain.exponentialRampToValueAtTime(0.001, t + delayTime + 0.06);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t + delayTime);
      osc.stop(t + delayTime + 0.06);
    });
  }

  playWin() {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + i * 0.12);

      gain.gain.setValueAtTime(0.2, t + i * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.12 + 0.4);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t + i * 0.12);
      osc.stop(t + i * 0.12 + 0.4);
    });
  }

  playLose() {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const notes = [440, 415.30, 392, 349.23]; // A4, Ab4, G4, F4
    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t + i * 0.16);

      gain.gain.setValueAtTime(0.18, t + i * 0.16);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.16 + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t + i * 0.16);
      osc.stop(t + i * 0.16 + 0.35);
    });
  }

  playClick() {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.exponentialRampToValueAtTime(400, t + 0.03);

    gain.gain.setValueAtTime(0.08, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.03);
  }
}
