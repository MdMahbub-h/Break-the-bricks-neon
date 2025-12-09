// Simple sound effects using Web Audio API
class SoundManager {
  private audioContext: AudioContext | null = null;
  private enabled: boolean = true;

  constructor() {
    // Initialize from localStorage
    const saved = localStorage.getItem("breakBricksSoundEnabled");
    this.enabled = saved === null ? true : saved === "true";
  }

  private getAudioContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
    }
    return this.audioContext;
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    localStorage.setItem("breakBricksSoundEnabled", enabled.toString());
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  private playTone(frequency: number, duration: number, volume: number = 0.1) {
    if (!this.enabled) return;

    try {
      const ctx = this.getAudioContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = "sine";

      gainNode.gain.setValueAtTime(volume, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        ctx.currentTime + duration
      );

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + duration);
    } catch (error) {
      // Silently fail if audio context is not available
      console.warn("Audio playback failed:", error);
    }
  }

  playPaddleHit() {
    this.playTone(440, 0.1, 0.15);
  }

  playWallHit() {
    this.playTone(330, 0.08, 0.12);
  }

  playBrickHit() {
    this.playTone(550, 0.1, 0.15);
  }

  playBrickBreak() {
    // Quick ascending notes
    setTimeout(() => this.playTone(600, 0.05, 0.15), 0);
    setTimeout(() => this.playTone(800, 0.05, 0.15), 50);
    setTimeout(() => this.playTone(1000, 0.08, 0.15), 100);
  }

  playLoseLife() {
    // Descending tone
    setTimeout(() => this.playTone(400, 0.1, 0.2), 0);
    setTimeout(() => this.playTone(300, 0.15, 0.2), 100);
  }

  playVictory() {
    // Victory fanfare - extended for boss defeat
    setTimeout(() => this.playTone(523, 0.1, 0.15), 0);
    setTimeout(() => this.playTone(659, 0.1, 0.15), 100);
    setTimeout(() => this.playTone(784, 0.1, 0.15), 200);
    setTimeout(() => this.playTone(1047, 0.3, 0.15), 300);
    // Additional notes for boss defeat
    setTimeout(() => this.playTone(1319, 0.2, 0.15), 500);
    setTimeout(() => this.playTone(1568, 0.4, 0.15), 600);
  }

  playGameOver() {
    // Game over sound
    setTimeout(() => this.playTone(200, 0.2, 0.2), 0);
    setTimeout(() => this.playTone(150, 0.3, 0.2), 200);
  }

  playClick() {
    this.playTone(800, 0.05, 0.1);
  }
}

export const soundManager = new SoundManager();
