/**
 * SoundManager.ts
 * Generates game sound effects using the Web Audio API.
 * No external assets required!
 */

class SoundManager {
  private ctx: AudioContext | null = null;
  private enabled: boolean = true;

  constructor() {
    // Initialize audio context on first user interaction
    window.addEventListener('click', () => this.init(), { once: true });
  }

  private init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioContext();
    }
    if (this.ctx?.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public toggle(enabled: boolean) {
    this.enabled = enabled;
  }

  /**
   * Play a simple "clack" sound for movement
   */
  public playMove() {
    if (!this.enabled || !this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.1);
    
    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start(t);
    osc.stop(t + 0.1);
  }

  /**
   * Play a "crunch" sound for combat impact
   */
  public playAttack() {
    if (!this.enabled || !this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    // Sawtooth for harshness
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(100, t);
    osc.frequency.linearRampToValueAtTime(50, t + 0.15);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.linearRampToValueAtTime(0.01, t + 0.15);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.15);
  }

  /**
   * Play a distinct sound for a kill/death
   */
  public playDeath() {
    if (!this.enabled || !this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(200, t);
    osc.frequency.exponentialRampToValueAtTime(20, t + 0.3);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.3);
  }

  /**
   * Play a victory jingle
   */
  public playWin() {
    if (!this.enabled || !this.ctx) return;
    const t = this.ctx.currentTime;
    
    // Simple Arpeggio
    [440, 554, 659, 880].forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const time = t + i * 0.1;

      osc.type = 'sine';
      osc.frequency.value = freq;
      
      gain.gain.setValueAtTime(0.2, time);
      gain.gain.exponentialRampToValueAtTime(0.01, time + 0.5);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      
      osc.start(time);
      osc.stop(time + 0.5);
    });
  }
}

export const soundManager = new SoundManager();