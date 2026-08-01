class SoundManager {
  constructor() {
    this.ctx = null;
    this.initialized = false;
    this.masterGain = null;
    this.ambientOsc = null;
  }

  init() {
    if (this.initialized) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.3;
      this.masterGain.connect(this.ctx.destination);
      this.initialized = true;
    } catch (e) {
      console.error('Audio init failed:', e);
    }
  }

  // Crystalline drop chime
  playDrop() {
    if (!this.initialized) this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(440, this.ctx.currentTime + 0.15);
    
    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start(this.ctx.currentTime);
    osc.stop(this.ctx.currentTime + 0.15);

    // Harmonic overtone
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1760, this.ctx.currentTime);
    osc2.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.1);
    gain2.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain2.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.1);
    osc2.connect(gain2);
    gain2.connect(this.masterGain);
    osc2.start(this.ctx.currentTime);
    osc2.stop(this.ctx.currentTime + 0.1);
  }

  // Harmonic merge tone - pitch rises with tier
  playMerge(tier) {
    if (!this.initialized) this.init();
    if (!this.ctx) return;

    // Phase 5 — theme-driven timbre. Each theme maps to a (waveform,
    // base offset) so merging 'prism' in Fusion sounds different from
    // merging 'prism' in Wizard. Theme index can be set externally via
    // this.themeIndex; defaults to 0 (Fusion).
    const THEME_TIMBRES = [
      { wave: 'triangle',  harm: 'sine',     base: 440, decay: 0.30 },
      { wave: 'square',    harm: 'triangle', base: 523, decay: 0.32 },
      { wave: 'sawtooth',  harm: 'triangle', base: 392, decay: 0.28 },
      { wave: 'triangle',  harm: 'sine',     base: 466, decay: 0.36 },
      { wave: 'sine',      harm: 'triangle', base: 587, decay: 0.34 },
      { wave: 'triangle',  harm: 'sine',     base: 349, decay: 0.32 },
      { wave: 'square',    harm: 'sine',     base: 659, decay: 0.30 },
      { wave: 'triangle',  harm: 'square',   base: 415, decay: 0.35 },
      { wave: 'sawtooth',  harm: 'square',   base: 311, decay: 0.40 },
      { wave: 'triangle',  harm: 'sine',     base: 698, decay: 0.30 },
      { wave: 'sine',      harm: 'triangle', base: 247, decay: 0.45 },
    ];
    const timbre = THEME_TIMBRES[Math.min(this.themeIndex || 0, THEME_TIMBRES.length - 1)];
    const baseFreq = timbre.base + (tier * 110);

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = timbre.wave;
    osc.frequency.setValueAtTime(baseFreq, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, this.ctx.currentTime + 0.2);
    gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + timbre.decay);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(this.ctx.currentTime);
    osc.stop(this.ctx.currentTime + timbre.decay);

    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = timbre.harm;
    osc2.frequency.setValueAtTime(baseFreq * 2, this.ctx.currentTime);
    gain2.gain.setValueAtTime(0.1, this.ctx.currentTime);
    gain2.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + timbre.decay * 0.85);
    osc2.connect(gain2);
    gain2.connect(this.masterGain);
    osc2.start(this.ctx.currentTime);
    osc2.stop(this.ctx.currentTime + timbre.decay * 0.85);
  }

  setThemeIndex(idx) { this.themeIndex = idx; }

  // Level complete chord
  playLevelComplete() {
    if (!this.initialized) this.init();
    if (!this.ctx) return;

    const notes = [523.25, 659.25, 783.99]; // C major chord
    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime + i * 0.08);
      
      gain.gain.setValueAtTime(0, this.ctx.currentTime + i * 0.08);
      gain.gain.linearRampToValueAtTime(0.2, this.ctx.currentTime + i * 0.08 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + i * 0.08 + 1.0);
      
      osc.connect(gain);
      gain.connect(this.masterGain);
      
      osc.start(this.ctx.currentTime + i * 0.08);
      osc.stop(this.ctx.currentTime + i * 0.08 + 1.0);
    });
  }

  // Game over sound
  playGameOver() {
    if (!this.initialized) this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(440, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(110, this.ctx.currentTime + 0.5);
    
    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.5);
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start(this.ctx.currentTime);
    osc.stop(this.ctx.currentTime + 0.5);
  }

  // Phase 1 — danger warning when the stack nears the death line.
  // Idempotent: only allocates the oscillator nodes once; subsequent calls just
  // ramp the gain to a target intensity (0..1).
  playWarning(intensity = 1) {
    if (!this.initialized) this.init();
    if (!this.ctx) return;
    if (!this._warningGain) {
      this._warningOsc = this.ctx.createOscillator();
      this._warningOsc2 = this.ctx.createOscillator();
      this._warningGain = this.ctx.createGain();
      this._warningOsc.type = 'sawtooth';
      this._warningOsc2.type = 'triangle';
      this._warningOsc.frequency.value = 90;
      this._warningOsc2.frequency.value = 135;
      this._warningGain.gain.value = 0;
      this._warningOsc.connect(this._warningGain);
      this._warningOsc2.connect(this._warningGain);
      this._warningGain.connect(this.masterGain);
      this._warningOsc.start();
      this._warningOsc2.start();
    }
    const target = Math.max(0, Math.min(1, intensity)) * 0.18;
    const now = this.ctx.currentTime;
    this._warningGain.gain.cancelScheduledValues(now);
    this._warningGain.gain.linearRampToValueAtTime(target, now + 0.25);
  }

  stopWarning() {
    if (!this._warningGain || !this.ctx) return;
    const now = this.ctx.currentTime;
    this._warningGain.gain.cancelScheduledValues(now);
    this._warningGain.gain.linearRampToValueAtTime(0, now + 0.2);
  }

  // Ambient space drone
  startAmbient() {
    if (!this.initialized) this.init();
    if (!this.ctx || this.ambientOsc) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(60, this.ctx.currentTime);
    
    // Slow modulation
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    lfo.frequency.setValueAtTime(0.1, this.ctx.currentTime);
    lfoGain.gain.setValueAtTime(5, this.ctx.currentTime);
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);
    lfo.start();
    
    gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
    
    this.ambientOsc = { osc, gain, lfo, lfoGain };
  }

  stopAmbient() {
    if (!this.ambientOsc) return;
    const { osc, gain, lfo } = this.ambientOsc;
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.5);
    osc.stop(this.ctx.currentTime + 0.5);
    lfo.stop(this.ctx.currentTime + 0.5);
    this.ambientOsc = null;
  }
}
