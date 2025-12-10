import { GasBlock, MusicStyle } from '../types';

// Pentatonic scale extended
const SCALE = [
  130.81, // C3
  155.56, // Eb3
  174.61, // F3
  196.00, // G3
  233.08, // Bb3
  261.63, // C4
  311.13, // Eb4
  349.23, // F4
  392.00, // G4
  466.16, // Bb4
  523.25, // C5
  622.25, // Eb5
  698.46, // F5
  783.99, // G5
  932.33, // Bb5
  1046.50 // C6
];

export class AudioService {
  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private gainNode: GainNode | null = null;
  private isPlaying = false;
  private scheduleId: number | null = null;
  private noteIndex = 0;

  constructor() {
    // Lazy init
  }

  public init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 256;
      this.gainNode = this.ctx.createGain();
      this.gainNode.gain.value = 0.3; // Master volume
      this.gainNode.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public getAnalyser(): AnalyserNode | null {
    return this.analyser;
  }

  // --- Real-time Playback ---
  public playSequence(
    blocks: GasBlock[], 
    style: MusicStyle,
    tempo: number,
    onNotePlay: (index: number) => void, 
    onComplete: () => void
  ) {
    this.init();
    if (this.isPlaying) this.stop();
    this.isPlaying = true;
    this.noteIndex = 0;

    const { minUse, useRange, minPrice, priceRange, isPriceFlat } = this.calculateStats(blocks);

    const playNext = () => {
      if (!this.isPlaying || !this.ctx || !this.gainNode) return;

      if (this.noteIndex >= blocks.length) {
        this.stop();
        onComplete();
        return;
      }

      const block = blocks[this.noteIndex];
      onNotePlay(this.noteIndex);

      this.triggerNote(
        this.ctx, 
        this.gainNode, 
        block, 
        this.ctx.currentTime, 
        isPriceFlat, minUse, useRange, minPrice, priceRange,
        style,
        tempo
      );

      this.noteIndex++;
      this.scheduleId = window.setTimeout(playNext, tempo * 1000);
    };

    playNext();
  }

  public stop() {
    this.isPlaying = false;
    if (this.scheduleId) {
      clearTimeout(this.scheduleId);
      this.scheduleId = null;
    }
  }

  // --- Offline Rendering (Export) ---
  public async renderAudio(blocks: GasBlock[], style: MusicStyle, tempo: number): Promise<Blob> {
    const totalDuration = blocks.length * tempo + 2; // +2s tail
    const sampleRate = 44100;
    const offlineCtx = new OfflineAudioContext(1, sampleRate * totalDuration, sampleRate);

    // Setup Master Gain for Offline Context
    const masterGain = offlineCtx.createGain();
    masterGain.gain.value = 0.3;
    masterGain.connect(offlineCtx.destination);

    const { minUse, useRange, minPrice, priceRange, isPriceFlat } = this.calculateStats(blocks);

    // Schedule all notes
    blocks.forEach((block, index) => {
      const time = index * tempo;
      this.triggerNote(
        offlineCtx as unknown as AudioContext, // Cast is safe for common nodes
        masterGain, 
        block, 
        time,
        isPriceFlat, minUse, useRange, minPrice, priceRange,
        style,
        tempo
      );
    });

    const renderedBuffer = await offlineCtx.startRendering();
    return this.bufferToWave(renderedBuffer, renderedBuffer.length);
  }

  // --- Helper Methods ---

  private calculateStats(blocks: GasBlock[]) {
    const prices = blocks.map(b => b.baseFeePerGas);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const isPriceFlat = (maxPrice - minPrice) < 0.0001;

    const minUse = Math.min(...blocks.map(b => b.gasUsed));
    const maxUse = Math.max(...blocks.map(b => b.gasUsed));
    const useRange = maxUse - minUse || 1;
    const priceRange = maxPrice - minPrice || 0.0001;

    return { minUse, useRange, minPrice, priceRange, isPriceFlat };
  }

  private triggerNote(
    ctx: BaseAudioContext, 
    destination: AudioNode, 
    block: GasBlock, 
    startTime: number,
    isPriceFlat: boolean,
    minUse: number,
    useRange: number,
    minPrice: number,
    priceRange: number,
    style: MusicStyle,
    tempo: number
  ) {
    let normalized = 0;
    if (isPriceFlat) {
      normalized = (block.gasUsed - minUse) / useRange;
    } else {
      normalized = (block.baseFeePerGas - minPrice) / priceRange;
    }

    // Add slight randomization for flat activity to prevent robotic repetition
    if (normalized === 0 && isPriceFlat) {
       normalized = Math.random() * 0.1;
    }

    normalized = Math.max(0, Math.min(1, normalized));
    const scaleIndex = Math.floor(normalized * (SCALE.length - 1));
    const frequency = SCALE[scaleIndex] || SCALE[0];

    const osc = ctx.createOscillator();
    const subOsc = ctx.createOscillator(); // Secondary oscillator
    const noteGain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    // --- Sound Engine Logic ---

    if (style === 'CYBERPUNK') {
        // Aggressive Sawtooth
        osc.type = 'sawtooth';
        subOsc.type = 'square';
        
        osc.frequency.setValueAtTime(frequency, startTime);
        subOsc.frequency.setValueAtTime(frequency / 2, startTime); // Sub-octave

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(frequency * 1.5, startTime);
        filter.frequency.exponentialRampToValueAtTime(frequency * 4, startTime + 0.1);
        filter.Q.value = 5;

        // Envelope: Fast Attack, Decay
        noteGain.gain.setValueAtTime(0, startTime);
        noteGain.gain.linearRampToValueAtTime(0.2, startTime + 0.02);
        noteGain.gain.exponentialRampToValueAtTime(0.001, startTime + tempo);

    } else if (style === 'ETHEREAL') {
        // Ambient Sine/Triangle Pad
        osc.type = 'sine';
        subOsc.type = 'triangle';

        osc.frequency.setValueAtTime(frequency, startTime);
        subOsc.frequency.setValueAtTime(frequency, startTime); // Unison slightly detuned?
        
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1000, startTime);
        filter.Q.value = 0;

        // Envelope: Slow Attack, Long Release (Pad-like)
        // Overlap is desirable here, so we let it ring longer than tempo
        const duration = tempo * 1.5; 
        noteGain.gain.setValueAtTime(0, startTime);
        noteGain.gain.linearRampToValueAtTime(0.3, startTime + duration * 0.4);
        noteGain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    } else if (style === 'RETRO') {
        // Chiptune Square
        osc.type = 'square';
        subOsc.type = 'square';

        osc.frequency.setValueAtTime(frequency, startTime);
        subOsc.frequency.setValueAtTime(frequency * 2, startTime); // Octave up for sparkle

        filter.type = 'lowpass'; // Basic filtering to remove harshness
        filter.frequency.setValueAtTime(3000, startTime);

        // Envelope: Instant Attack, Staccato
        const duration = tempo * 0.8; 
        noteGain.gain.setValueAtTime(0, startTime);
        noteGain.gain.setValueAtTime(0.15, startTime + 0.005);
        noteGain.gain.setValueAtTime(0.15, startTime + duration * 0.8);
        noteGain.gain.setValueAtTime(0, startTime + duration);
    }

    // Wiring
    osc.connect(filter);
    // Sub/Secondary osc only for Cyberpunk and Ethereal for richness
    if (style !== 'RETRO') {
        subOsc.connect(filter); 
        // Lower volume of sub
        const subGain = ctx.createGain();
        subGain.gain.value = 0.4;
        subOsc.connect(subGain);
        subGain.connect(filter);
    }

    filter.connect(noteGain);
    noteGain.connect(destination);

    // Play
    osc.start(startTime);
    osc.stop(startTime + tempo + 0.5); // Safety buffer
    if (style !== 'RETRO') {
        subOsc.start(startTime);
        subOsc.stop(startTime + tempo + 0.5);
    }
  }

  private bufferToWave(abuffer: AudioBuffer, len: number) {
    let numOfChan = abuffer.numberOfChannels;
    let length = len * numOfChan * 2 + 44;
    let buffer = new ArrayBuffer(length);
    let view = new DataView(buffer);
    let channels = [], i, sample;
    let offset = 0;
    let pos = 0;

    // write WAVE header
    setUint32(0x46464952);                         // "RIFF"
    setUint32(length - 8);                         // file length - 8
    setUint32(0x45564157);                         // "WAVE"

    setUint32(0x20746d66);                         // "fmt " chunk
    setUint32(16);                                 // length = 16
    setUint16(1);                                  // PCM (uncompressed)
    setUint16(numOfChan);
    setUint32(abuffer.sampleRate);
    setUint32(abuffer.sampleRate * 2 * numOfChan); // avg. bytes/sec
    setUint16(numOfChan * 2);                      // block-align
    setUint16(16);                                 // 16-bit (hardcoded in this parser)

    setUint32(0x61746164);                         // "data" - chunk
    setUint32(length - pos - 4);                   // chunk length

    // write interleaved data
    for(i = 0; i < abuffer.numberOfChannels; i++)
      channels.push(abuffer.getChannelData(i));

    while(pos < length) {
      for(i = 0; i < numOfChan; i++) {             // interleave channels
        sample = Math.max(-1, Math.min(1, channels[i][offset])); // clamp
        sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767)|0; // scale to 16-bit signed int
        view.setInt16(pos, sample, true);          // write 16-bit sample
        pos += 2;
      }
      offset++; // next source sample
    }

    // create Blob
    return new Blob([buffer], { type: "audio/wav" });

    function setUint16(data: any) {
      view.setUint16(pos, data, true);
      pos += 2;
    }

    function setUint32(data: any) {
      view.setUint32(pos, data, true);
      pos += 4;
    }
  }
}
