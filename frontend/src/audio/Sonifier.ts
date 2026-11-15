import { NoteEvent } from "@/types";

export class RadarSonifier {
  private ctx: AudioContext | null = null;
  private isPlaying: boolean = false;
  private currentStep: number = 0;
  private timeoutId: NodeJS.Timeout | null = null;
  private noteEvents: NoteEvent[] = [];
  private volume: number = 0.8;
  private speedMultiplier: number = 1.0;
  private onStepCallback: ((index: number) => void) | null = null;

  constructor() {}

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  public setNoteEvents(events: NoteEvent[]) {
    this.stop();
    this.noteEvents = events;
    this.currentStep = 0;
  }

  public setOnStepCallback(cb: (index: number) => void) {
    this.onStepCallback = cb;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
  }

  public setSpeed(speed: number) {
    this.speedMultiplier = Math.max(0.25, Math.min(3, speed));
  }

  public play() {
    if (!this.noteEvents || this.noteEvents.length === 0) return;
    this.initContext();
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
      // Loop or stop
      this.currentStep = 0;
    }

    const note = this.noteEvents[this.currentStep];
    const now = this.ctx.currentTime;
    const noteDuration = (0.15 / this.speedMultiplier);

    // Audio Graph:
    // Osc1 (Carrier) + Osc2 (Sub-octave warmth) -> Filter -> Gain -> Destination
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gainNode = this.ctx.createGain();

    // Waveform: sawtooth for rich harmonics, triangle for smooth sub
    osc1.type = "sawtooth";
    osc2.type = "sine";

    // Pitch
    osc1.frequency.setValueAtTime(note.frequency_hz, now);
    osc2.frequency.setValueAtTime(note.frequency_hz * 0.5, now);

    // Filter
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(note.filter_cutoff_hz, now);
    filter.Q.setValueAtTime(3.0, now);

    // Envelope shaping (Attack - Decay)
    const targetGain = note.gain * this.volume * 0.4;
    gainNode.gain.setValueAtTime(0.001, now);
    gainNode.gain.exponentialRampToValueAtTime(Math.max(0.002, targetGain), now + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + noteDuration);

    // Connect nodes
    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.ctx.destination);

    // Trigger oscillators
    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + noteDuration);
    osc2.stop(now + noteDuration);

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
