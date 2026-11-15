import { NoteEvent } from "@/types";

export class RadarSonifier {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isPlaying: boolean = false;
  private currentStep: number = 0;
  private timeoutId: NodeJS.Timeout | null = null;
  private noteEvents: NoteEvent[] = [];
  private volume: number = 0.85;
  private speedMultiplier: number = 1.0;
  private baseNoteDuration: number = 0.15;
  private onStepCallback: ((index: number) => void) | null = null;

  constructor() {}

  public initContext() {
    if (!this.ctx && typeof window !== "undefined") {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
  }

  public async ensureAudioRunning(): Promise<boolean> {
    this.initContext();
    if (this.ctx && this.ctx.state === "suspended") {
      try {
        await this.ctx.resume();
      } catch (err) {
        console.warn("AudioContext resume pending user interaction:", err);
      }
    }
    return this.ctx?.state === "running";
  }

  public setNoteEvents(events: NoteEvent[]) {
    this.stop();
    this.noteEvents = events;
    this.currentStep = 0;
  }

  public setBaseNoteDuration(duration: number) {
    this.baseNoteDuration = Math.max(0.04, Math.min(1.0, duration));
  }

  public setOnStepCallback(cb: (index: number) => void) {
    this.onStepCallback = cb;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.ctx && this.masterGain) {
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    }
  }

  public setSpeed(speed: number) {
    this.speedMultiplier = Math.max(0.25, Math.min(3, speed));
  }

  public async play() {
    if (!this.noteEvents || this.noteEvents.length === 0) return;
    await this.ensureAudioRunning();
    this.isPlaying = true;
    this.scheduleNextNote();
  }

  public pause() {
    this.isPlaying = false;
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  public stop() {
    this.pause();
    this.currentStep = 0;
    if (this.onStepCallback) {
      this.onStepCallback(0);
    }
  }

  private scheduleNextNote() {
    if (!this.isPlaying || !this.ctx) return;

    if (this.currentStep >= this.noteEvents.length) {
      this.currentStep = 0;
    }

    const note = this.noteEvents[this.currentStep];
    const now = this.ctx.currentTime;
    const startTime = now + 0.005;
    const noteDuration = (this.baseNoteDuration / this.speedMultiplier);

    // Audio Graph:
    // Osc1 (Carrier: Sawtooth for rich harmonics) + Osc2 (Sine for fundamental warmth) -> Filter -> Envelope Gain -> Master Gain -> Destination
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const envGain = this.ctx.createGain();

    osc1.type = "sawtooth";
    osc2.type = "sine";

    // Pitch: Carrier frequency + warm sub-octave
    const freq = Math.max(60, Math.min(1800, note.frequency_hz));
    osc1.frequency.setValueAtTime(freq, startTime);
    osc2.frequency.setValueAtTime(freq * 0.5, startTime);

    // Filter: Lowpass with resonance tracking surface roughness
    filter.type = "lowpass";
    const cutoff = Math.max(150, Math.min(5000, note.filter_cutoff_hz));
    filter.frequency.setValueAtTime(cutoff, startTime);
    filter.Q.setValueAtTime(4.0, startTime);

    // Volume Envelope: Crisp attack followed by natural decay
    const attackTime = Math.min(0.02, noteDuration * 0.25);
    // Scale gain so it is clearly audible (ranging from 0.2 to 0.75)
    const targetGain = Math.min(0.75, Math.max(0.2, (note.gain || 0.5) * 0.7));

    envGain.gain.setValueAtTime(0.0001, startTime);
    envGain.gain.linearRampToValueAtTime(targetGain, startTime + attackTime);
    envGain.gain.exponentialRampToValueAtTime(0.001, startTime + noteDuration);

    // Connect nodes
    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(envGain);
    if (this.masterGain) {
      envGain.connect(this.masterGain);
    } else {
      envGain.connect(this.ctx.destination);
    }

    // Trigger oscillators
    osc1.start(startTime);
    osc2.start(startTime);
    osc1.stop(startTime + noteDuration);
    osc2.stop(startTime + noteDuration);

    // Notify UI of active step
    if (this.onStepCallback) {
      this.onStepCallback(this.currentStep);
    }

    this.currentStep++;

    // Schedule next beat
    const intervalMs = (noteDuration * 1000);
    this.timeoutId = setTimeout(() => {
      this.scheduleNextNote();
    }, intervalMs);
  }
}
