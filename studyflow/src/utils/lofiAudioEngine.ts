// Procedural Lo-fi and Ambient Sound Engine using Web Audio API
// 100% self-contained, offline-compatible, no external CORS or streaming dependencies.

export type LofiStationId = 'lofi-beats' | 'rain' | 'cafe' | 'ocean' | 'fireplace';

export interface LofiStation {
  id: LofiStationId;
  name: string;
  tagline: string;
  icon: string;
  bpm?: number;
}

export const LOFI_STATIONS: LofiStation[] = [
  {
    id: 'lofi-beats',
    name: 'Lo-fi Chill Beats',
    tagline: 'Giai điệu piano & vinyl êm đềm 76 BPM',
    icon: '🎧',
    bpm: 76
  },
  {
    id: 'rain',
    name: 'Mưa Rơi Bên Cửa Sổ',
    tagline: 'Tiếng mưa rơi nhẹ nhàng gạt tan căng thẳng',
    icon: '🌧️'
  },
  {
    id: 'cafe',
    name: 'Quán Cafe Học Bài',
    tagline: 'Không gian ấm cúng, tiếng lách cách & jazz nhẹ',
    icon: '☕'
  },
  {
    id: 'ocean',
    name: 'Sóng Biển 432Hz',
    tagline: 'Sóng biển dạt dào & tần số Alpha thư giãn sâu',
    icon: '🌊'
  },
  {
    id: 'fireplace',
    name: 'Lò Sưởi Đêm Thu',
    tagline: 'Lửa tí tách ấm áp, tăng cường tập trung sâu',
    icon: '🔥'
  }
];

class LofiAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isRunning: boolean = false;
  private currentStationId: LofiStationId = 'lofi-beats';
  private timerId: number | null = null;
  private scheduledStopFns: Array<() => void> = [];
  private volume: number = 0.7;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
      this.masterGain.gain.linearRampToValueAtTime(this.volume, this.ctx.currentTime + 0.1);
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  public getStation(): LofiStationId {
    return this.currentStationId;
  }

  public isPlaying(): boolean {
    return this.isRunning;
  }

  public play(stationId?: LofiStationId) {
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    if (stationId) {
      this.currentStationId = stationId;
    }

    this.stopAudioNodes();
    this.isRunning = true;

    switch (this.currentStationId) {
      case 'lofi-beats':
        this.startLofiBeats();
        break;
      case 'rain':
        this.startRainSound();
        break;
      case 'cafe':
        this.startCafeSound();
        break;
      case 'ocean':
        this.startOceanSound();
        break;
      case 'fireplace':
        this.startFireplaceSound();
        break;
    }
  }

  public pause() {
    this.isRunning = false;
    this.stopAudioNodes();
  }

  public stop() {
    this.pause();
  }

  public switchStation(stationId: LofiStationId) {
    this.currentStationId = stationId;
    if (this.isRunning) {
      this.play(stationId);
    }
  }

  private stopAudioNodes() {
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    this.scheduledStopFns.forEach(fn => {
      try { fn(); } catch { /* ignore */ }
    });
    this.scheduledStopFns = [];
  }

  // --- 1. Lo-fi Beats (Rhodes Chord Progression + Vinyl Crackle + Soft Kick) ---
  private startLofiBeats() {
    if (!this.ctx || !this.masterGain) return;
    const ctx = this.ctx;
    const master = this.masterGain;

    // Vinyl crackle noise
    const bufferSize = ctx.sampleRate * 2;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      // Pink-ish noise with occasional clicks
      const white = Math.random() * 2 - 1;
      const click = Math.random() < 0.002 ? (Math.random() - 0.5) * 4 : 0;
      output[i] = (white * 0.05 + click) * 0.15;
    }

    const crackle = ctx.createBufferSource();
    crackle.buffer = noiseBuffer;
    crackle.loop = true;

    const crackleFilter = ctx.createBiquadFilter();
    crackleFilter.type = 'bandpass';
    crackleFilter.frequency.value = 1800;
    crackleFilter.Q.value = 1.2;

    const crackleGain = ctx.createGain();
    crackleGain.gain.value = 0.08;

    crackle.connect(crackleFilter);
    crackleFilter.connect(crackleGain);
    crackleGain.connect(master);
    crackle.start();

    this.scheduledStopFns.push(() => {
      try { crackle.stop(); } catch {}
    });

    // Chord progressions: Dm9, G13, Cmaj9, Am9
    // Frequencies (Hz)
    const chords = [
      [220.0, 261.63, 329.63, 392.0, 493.88], // Dm9 / Fmaj7/A
      [196.0, 246.94, 329.63, 392.0, 440.0],  // G13
      [164.81, 261.63, 329.63, 392.0, 493.88], // Cmaj9
      [220.0, 261.63, 329.63, 440.0, 523.25]  // Am9
    ];

    let chordStep = 0;
    const beatInterval = 2400; // ms per chord

    const playChordStep = () => {
      if (!this.isRunning || !this.ctx || !this.masterGain) return;
      const now = this.ctx.currentTime;
      const currentChord = chords[chordStep % chords.length];
      chordStep++;

      // Soft electric piano-like sine with warm filter
      currentChord.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = 'sine';
        // Subtle vintage detune
        const detune = (Math.random() - 0.5) * 8;
        osc.frequency.setValueAtTime(freq + detune, now + idx * 0.04);

        // Warm lowpass filter to create the nostalgic lo-fi warmth
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(950, now);

        gain.gain.setValueAtTime(0.0001, now + idx * 0.04);
        gain.gain.linearRampToValueAtTime(0.06 / currentChord.length, now + idx * 0.04 + 0.15);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.04 + 2.2);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(master);

        osc.start(now + idx * 0.04);
        osc.stop(now + idx * 0.04 + 2.3);
      });

      // Soft deep lo-fi bass thump
      const kickOsc = this.ctx.createOscillator();
      const kickGain = this.ctx.createGain();
      kickOsc.type = 'sine';
      kickOsc.frequency.setValueAtTime(110, now);
      kickOsc.frequency.exponentialRampToValueAtTime(45, now + 0.18);

      kickGain.gain.setValueAtTime(0.12, now);
      kickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      kickOsc.connect(kickGain);
      kickGain.connect(master);
      kickOsc.start(now);
      kickOsc.stop(now + 0.38);
    };

    // Trigger immediately
    playChordStep();
    this.timerId = window.setInterval(playChordStep, beatInterval);
  }

  // --- 2. Rain Sound (Pink Noise through multi-stage resonance filter) ---
  private startRainSound() {
    if (!this.ctx || !this.masterGain) return;
    const ctx = this.ctx;
    const master = this.masterGain;

    const bufferSize = ctx.sampleRate * 3;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.04;
      b6 = white * 0.115926;
    }

    const rainSrc = ctx.createBufferSource();
    rainSrc.buffer = noiseBuffer;
    rainSrc.loop = true;

    // Filter simulating rain on roof/window
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1400, ctx.currentTime);

    const rainGain = ctx.createGain();
    rainGain.gain.setValueAtTime(0.35, ctx.currentTime);

    rainSrc.connect(filter);
    filter.connect(rainGain);
    rainGain.connect(master);
    rainSrc.start();

    this.scheduledStopFns.push(() => {
      try { rainSrc.stop(); } catch {}
    });
  }

  // --- 3. Coffee Shop Ambience (Mellow cafe hum & gentle ambient chime) ---
  private startCafeSound() {
    if (!this.ctx || !this.masterGain) return;
    const ctx = this.ctx;
    const master = this.masterGain;

    // Gentle room murmur
    const bufferSize = ctx.sampleRate * 2;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * 0.03;
    }

    const murmur = ctx.createBufferSource();
    murmur.buffer = noiseBuffer;
    murmur.loop = true;

    const bandpass = ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.value = 450;
    bandpass.Q.value = 1.0;

    const murmurGain = ctx.createGain();
    murmurGain.gain.value = 0.18;

    murmur.connect(bandpass);
    bandpass.connect(murmurGain);
    murmurGain.connect(master);
    murmur.start();

    this.scheduledStopFns.push(() => {
      try { murmur.stop(); } catch {}
    });

    // Occasional subtle cup or gentle cafe note
    const playCafeCup = () => {
      if (!this.isRunning || !this.ctx || !this.masterGain) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      const freqs = [1760, 2093, 2637, 3135];
      osc.frequency.setValueAtTime(freqs[Math.floor(Math.random() * freqs.length)], now);
      osc.type = 'sine';

      gain.gain.setValueAtTime(0.015, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);

      osc.connect(gain);
      gain.connect(master);
      osc.start(now);
      osc.stop(now + 0.3);
    };

    this.timerId = window.setInterval(playCafeCup, 3500);
  }

  // --- 4. Ocean Waves with 432Hz Binaural Beat ---
  private startOceanSound() {
    if (!this.ctx || !this.masterGain) return;
    const ctx = this.ctx;
    const master = this.masterGain;

    // Binaural Carrier: 432Hz Left, 436Hz Right (4Hz Theta wave for super focus)
    const oscL = ctx.createOscillator();
    const oscR = ctx.createOscillator();
    const droneGain = ctx.createGain();

    oscL.frequency.value = 216; // Subharmonic
    oscR.frequency.value = 220; // 4Hz beat difference
    oscL.type = 'sine';
    oscR.type = 'sine';

    droneGain.gain.setValueAtTime(0.04, ctx.currentTime);

    oscL.connect(droneGain);
    oscR.connect(droneGain);
    droneGain.connect(master);
    oscL.start();
    oscR.start();

    // Rhythmic Ocean Swell
    const bufferSize = ctx.sampleRate * 4;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.05;
    }

    const oceanNoise = ctx.createBufferSource();
    oceanNoise.buffer = noiseBuffer;
    oceanNoise.loop = true;

    const oceanFilter = ctx.createBiquadFilter();
    oceanFilter.type = 'lowpass';
    oceanFilter.frequency.setValueAtTime(300, ctx.currentTime);

    const oceanGain = ctx.createGain();
    oceanGain.gain.setValueAtTime(0.2, ctx.currentTime);

    // LFO for ocean wave swell (every 7 seconds)
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 1 / 7;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 250;

    lfo.connect(lfoGain);
    lfoGain.connect(oceanFilter.frequency);

    oceanNoise.connect(oceanFilter);
    oceanFilter.connect(oceanGain);
    oceanGain.connect(master);

    oceanNoise.start();
    lfo.start();

    this.scheduledStopFns.push(() => {
      try {
        oscL.stop();
        oscR.stop();
        oceanNoise.stop();
        lfo.stop();
      } catch {}
    });
  }

  // --- 5. Fireplace & Autumn Night Crackle ---
  private startFireplaceSound() {
    if (!this.ctx || !this.masterGain) return;
    const ctx = this.ctx;
    const master = this.masterGain;

    // Warm fire roar (lowpass brown noise)
    const bufferSize = ctx.sampleRate * 2;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * 0.08;
    }

    const fireSrc = ctx.createBufferSource();
    fireSrc.buffer = noiseBuffer;
    fireSrc.loop = true;

    const fireFilter = ctx.createBiquadFilter();
    fireFilter.type = 'lowpass';
    fireFilter.frequency.value = 220;

    const fireGain = ctx.createGain();
    fireGain.gain.value = 0.25;

    fireSrc.connect(fireFilter);
    fireFilter.connect(fireGain);
    fireGain.connect(master);
    fireSrc.start();

    this.scheduledStopFns.push(() => {
      try { fireSrc.stop(); } catch {}
    });

    // Fire crackles (random snappy pops)
    const triggerCrackle = () => {
      if (!this.isRunning || !this.ctx || !this.masterGain) return;
      const now = this.ctx.currentTime;
      const snapOsc = this.ctx.createOscillator();
      const snapGain = this.ctx.createGain();
      const snapFilter = this.ctx.createBiquadFilter();

      snapOsc.type = 'triangle';
      snapOsc.frequency.setValueAtTime(600 + Math.random() * 800, now);
      snapFilter.type = 'highpass';
      snapFilter.frequency.setValueAtTime(1000, now);

      snapGain.gain.setValueAtTime(0.04, now);
      snapGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);

      snapOsc.connect(snapFilter);
      snapFilter.connect(snapGain);
      snapGain.connect(master);
      snapOsc.start(now);
      snapOsc.stop(now + 0.05);
    };

    this.timerId = window.setInterval(triggerCrackle, 400);
  }
}

export const lofiEngine = new LofiAudioEngine();
