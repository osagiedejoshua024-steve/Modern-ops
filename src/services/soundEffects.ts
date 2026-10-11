/**
 * High-fidelity tactical audio synthesizer using the Web Audio API.
 * Provides instant, zero-latency military shooter sound effects.
 */

class SoundEffectsService {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private muted: boolean = false;
  private volume: number = 0.8;
  private heartbeatOsc: OscillatorNode | null = null;
  private heartbeatInterval: number | null = null;

  constructor() {
    // Initialized lazily on first user interaction to comply with browser autoplay policies
  }

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.sfxGain = this.ctx.createGain();
      
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.muted ? 0 : this.volume, this.ctx.currentTime);
    }
  }

  public toggleMute(): boolean {
    this.muted = !this.muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.muted ? 0 : this.volume, this.ctx.currentTime);
    }
    return this.muted;
  }

  public isMuted(): boolean {
    return this.muted;
  }

  // --- WEAPON SOUND EFFECTS ---

  public playGunshot(type: 'rifle' | 'shotgun' | 'sniper' | 'pistol') {
    if (this.muted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;

    switch (type) {
      case 'rifle': {
        // Punchy assault rifle (M4A1)
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(280, t);
        osc.frequency.exponentialRampToValueAtTime(45, t + 0.12);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2500, t);
        filter.frequency.exponentialRampToValueAtTime(300, t + 0.14);

        gain.gain.setValueAtTime(0.7, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

        // Noise burst for gunshot crack
        this.playNoiseBurst(0.12, 1800, 0.6);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(t);
        osc.stop(t + 0.16);
        break;
      }

      case 'shotgun': {
        // Heavy boom + concussive blast (KRM-262)
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(160, t);
        osc.frequency.exponentialRampToValueAtTime(25, t + 0.3);

        gain.gain.setValueAtTime(0.9, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

        // Heavy wide noise burst
        this.playNoiseBurst(0.3, 1200, 0.9);

        // Mechanical pump clack scheduled after 0.25s
        setTimeout(() => {
          this.playPumpCycle();
        }, 240);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.36);
        break;
      }

      case 'sniper': {
        // High caliber sonic crack with deep concussive punch (L115)
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(320, t);
        osc.frequency.exponentialRampToValueAtTime(20, t + 0.45);

        gain.gain.setValueAtTime(1.0, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);

        // High frequency supersonic snap + wide rumble
        this.playNoiseBurst(0.4, 3500, 0.85);

        // Bolt pull back after 0.5s
        setTimeout(() => {
          this.playBoltCycle();
        }, 450);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.52);
        break;
      }

      case 'pistol': {
        // Sharp tactical pistol snap (Glock-18)
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(340, t);
        osc.frequency.exponentialRampToValueAtTime(60, t + 0.08);

        gain.gain.setValueAtTime(0.5, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

        this.playNoiseBurst(0.08, 2200, 0.5);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.11);
        break;
      }
    }
  }

  private playNoiseBurst(duration: number, cutoff: number, volume: number) {
    if (!this.ctx || !this.sfxGain) return;
    const bufferSize = Math.floor(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(cutoff, this.ctx.currentTime);
    filter.Q.setValueAtTime(1.5, this.ctx.currentTime);

    const gain = this.ctx.createGain();
    const t = this.ctx.currentTime;
    gain.gain.setValueAtTime(volume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(t);
  }

  // --- MECHANICAL WEAPON CYCLING ---

  private playPumpCycle() {
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(400, t);
    osc.frequency.setValueAtTime(200, t + 0.05);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.1);
  }

  private playBoltCycle() {
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;

    // Metallic bolt slide
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(600, t);
    osc.frequency.exponentialRampToValueAtTime(300, t + 0.08);

    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.13);
  }

  // --- HITMARKERS & COMBAT CONFIRMATION ---

  public playHitmarker(type: 'body' | 'headshot' | 'kill') {
    if (this.muted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;

    if (type === 'headshot') {
      // High-grade metallic CoD/Blood Strike headshot "CLINK"
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1400, t);
      osc.frequency.exponentialRampToValueAtTime(2400, t + 0.04);
      osc.frequency.exponentialRampToValueAtTime(900, t + 0.2);

      gain.gain.setValueAtTime(0.65, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.23);

      // Secondary tactical tick
      this.playTacticalClick(t + 0.02, 1800, 0.4);
    } else if (type === 'kill') {
      // Deep bass elimination chord + impact
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(180, t);
      osc1.frequency.exponentialRampToValueAtTime(80, t + 0.35);

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(440, t);
      osc2.frequency.exponentialRampToValueAtTime(220, t + 0.25);

      gain.gain.setValueAtTime(0.8, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.38);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.sfxGain);

      osc1.start(t);
      osc2.start(t);
      osc1.stop(t + 0.4);
      osc2.stop(t + 0.4);

      this.playTacticalClick(t, 2200, 0.5);
    } else {
      // Standard body shot hitmarker "tick"
      this.playTacticalClick(t, 1200, 0.45);
      this.playTacticalClick(t + 0.03, 1600, 0.35);
    }
  }

  private playTacticalClick(time: number, freq: number, vol: number) {
    if (!this.ctx || !this.sfxGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, time);
    osc.frequency.exponentialRampToValueAtTime(300, time + 0.04);

    gain.gain.setValueAtTime(vol, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.045);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(time);
    osc.stop(time + 0.05);
  }

  // --- RELOAD SOUNDS ---

  public playReloadSequence() {
    if (this.muted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;

    // 1. Mag release click (0.05s)
    this.playMagClick(t, 550, 0.3);

    // 2. Mag inserted clack (0.7s)
    setTimeout(() => {
      this.playMagClick(this.ctx?.currentTime || 0, 750, 0.5);
    }, 700);

    // 3. Bolt chamber release (1.2s)
    setTimeout(() => {
      this.playBoltCycle();
    }, 1200);
  }

  private playMagClick(time: number, freq: number, vol: number) {
    if (!this.ctx || !this.sfxGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, time);
    osc.frequency.exponentialRampToValueAtTime(200, time + 0.09);

    gain.gain.setValueAtTime(vol, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(time);
    osc.stop(time + 0.11);
  }

  // --- MOVEMENT SOUNDS ---

  public playSlideSound() {
    if (this.muted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;
    // Friction whoosh
    this.playNoiseBurst(0.28, 900, 0.5);
  }

  public playJumpSound() {
    if (this.muted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(90, t);
    osc.frequency.exponentialRampToValueAtTime(140, t + 0.1);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.13);
  }

  public playFootstep() {
    if (this.muted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(120, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.06);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.08);
  }

  // --- PLAYER DAMAGE & HEARTBEAT ---

  public playDamageTaken() {
    if (this.muted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;

    // Concussive impact grunt & sub-punch
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(110, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.18);

    gain.gain.setValueAtTime(0.7, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

    this.playNoiseBurst(0.12, 600, 0.4);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.23);
  }

  public startHeartbeat() {
    if (this.heartbeatInterval !== null) return;
    this.heartbeatInterval = window.setInterval(() => {
      if (this.muted) return;
      this.initContext();
      if (!this.ctx || !this.sfxGain) return;

      const t = this.ctx.currentTime;
      // Lub-dub heartbeat sound
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(75, t);
      osc1.frequency.exponentialRampToValueAtTime(35, t + 0.1);
      gain1.gain.setValueAtTime(0.4, t);
      gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
      osc1.connect(gain1);
      gain1.connect(this.sfxGain);
      osc1.start(t);
      osc1.stop(t + 0.13);

      setTimeout(() => {
        if (!this.ctx || !this.sfxGain) return;
        const t2 = this.ctx.currentTime;
        const osc2 = this.ctx.createOscillator();
        const gain2 = this.ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(65, t2);
        osc2.frequency.exponentialRampToValueAtTime(30, t2 + 0.12);
        gain2.gain.setValueAtTime(0.5, t2);
        gain2.gain.exponentialRampToValueAtTime(0.001, t2 + 0.14);
        osc2.connect(gain2);
        gain2.connect(this.sfxGain);
        osc2.start(t2);
        osc2.stop(t2 + 0.15);
      }, 180);
    }, 750);
  }

  public stopHeartbeat() {
    if (this.heartbeatInterval !== null) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  // --- KILLSTREAKS ---

  public playKillstreakEarned() {
    if (this.muted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;

    // High tech radio chirp & fanfaric chord
    const freqs = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    freqs.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + idx * 0.08);

      gain.gain.setValueAtTime(0.35, t + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.08 + 0.25);

      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(t + idx * 0.08);
      osc.stop(t + idx * 0.08 + 0.3);
    });
  }

  public playAirstrikeSound() {
    if (this.muted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    // Siren + incoming rocket whistle
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.exponentialRampToValueAtTime(200, t + 1.2);

    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 1.3);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 1.4);

    // Explosions sequence
    setTimeout(() => {
      this.playExplosion();
    }, 1100);
    setTimeout(() => {
      this.playExplosion();
    }, 1450);
    setTimeout(() => {
      this.playExplosion();
    }, 1800);
  }

  public playExplosion() {
    if (this.muted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(20, t + 0.6);

    gain.gain.setValueAtTime(0.9, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.7);

    this.playNoiseBurst(0.7, 700, 0.8);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.75);
  }

  // --- TACTICAL RADIO CALLOUT ---
  public playVoiceCallout(text: string) {
    if ('speechSynthesis' in window && !this.muted) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.15;
        utterance.pitch = 0.9;
        utterance.volume = 0.65;
        window.speechSynthesis.speak(utterance);
      } catch {
        // Fallback gracefully
      }
    }
  }

  // --- UI SOUNDS ---
  public playUIClick() {
    if (this.muted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.exponentialRampToValueAtTime(400, t + 0.04);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.045);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.05);
  }
}

export const soundEffects = new SoundEffectsService();
