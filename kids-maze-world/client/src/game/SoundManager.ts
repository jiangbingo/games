import type { ThemePresentation } from "./themePresentation";

export type SoundEffect = "move" | "bump" | "hint" | "undo" | "restart" | "celebrate" | "click";

const FOREST_AMBIENCE_URL = "/assets/forest-ambience-cc0.mp3";

/**
 * 森林邮差日记：互动音由Web Audio实时生成；真实环境录音仅在首次用户操作后按需加载，避免影响首屏。
 */
export class SoundManager {
  private context: AudioContext | null = null;
  private ambient: HTMLAudioElement | null = null;
  private enabled: boolean;
  private ambientEnabled: boolean;
  private ambientTheme: ThemePresentation["sound"] | null = null;
  private pad: { oscillators: OscillatorNode[]; gain: GainNode; key: string } | null = null;

  constructor(initialEnabled: boolean, initialAmbientEnabled = true) {
    this.enabled = initialEnabled;
    this.ambientEnabled = initialAmbientEnabled;
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    if (enabled) this.unlock();
    else this.syncPad();
  }

  setAmbientEnabled(enabled: boolean) {
    this.ambientEnabled = enabled;
    if (!enabled) this.ambient?.pause();
    else this.unlock();
    this.syncPad();
  }

  setAmbientTheme(theme: ThemePresentation["sound"]) {
    this.ambientTheme = theme;
    if (this.ambient) this.ambient.playbackRate = this.ambientRate();
    this.syncPad();
  }

  unlock() {
    if (typeof window === "undefined") return;
    if (this.enabled) {
      this.context ??= new AudioContext();
      if (this.context.state === "suspended") void this.context.resume();
    }
    if (this.ambientEnabled) this.startAmbience();
    this.syncPad();
  }

  play(effect: SoundEffect, theme?: ThemePresentation["sound"]) {
    if (!this.enabled || typeof window === "undefined") return;
    this.unlock();
    const context = this.context;
    if (!context || context.state !== "running") return;
    const now = context.currentTime;
    const tone = theme ?? { base: 520, bright: 780, texture: "sine" as const };
    const oscillator = tone.texture === "triangle" ? "triangle" : "sine";

    if (effect === "move") this.tone(tone.base, now, 0.06, oscillator, 0.042);
    if (effect === "bump") this.tone(Math.max(130, tone.base * 0.42), now, 0.1, "triangle", 0.03);
    if (effect === "hint") { this.tone(tone.bright * 0.8, now, 0.08, "sine", 0.04); this.tone(tone.bright, now + 0.09, 0.11, "sine", 0.038); }
    if (effect === "undo") this.tone(tone.base * 0.7, now, 0.07, "sine", 0.03);
    if (effect === "restart") { this.tone(tone.base * 0.86, now, 0.06, oscillator, 0.028); this.tone(tone.base * 0.64, now + 0.08, 0.08, oscillator, 0.024); }
    if (effect === "click") this.tone(tone.base * 0.92, now, 0.045, "sine", 0.024);
    if (effect === "celebrate") { this.tone(tone.base, now, 0.11, "sine", 0.052); this.tone(tone.bright * 0.84, now + 0.12, 0.11, "sine", 0.052); this.tone(tone.bright, now + 0.25, 0.18, "sine", 0.058); }
  }

  dispose() {
    this.stopPad(0.1);
    this.ambient?.pause();
    this.ambient = null;
    void this.context?.close();
    this.context = null;
  }

  private startAmbience() {
    if (!this.ambientEnabled || this.isLowBandwidth()) return;
    this.ambient ??= Object.assign(new Audio(FOREST_AMBIENCE_URL), { loop: true, preload: "none", volume: 0.12 });
    this.ambient.playbackRate = this.ambientRate();
    if (this.ambient.paused) void this.ambient.play().catch(() => undefined);
  }

  private ambientRate() {
    const texture = this.ambientTheme?.texture;
    return texture === "soft" ? 0.92 : texture === "triangle" ? 1.06 : 1;
  }

  /* 主题和声垫：用主题自带音色参数合成极轻的持续和弦，随主题切换淡入淡出；无素材成本。 */
  private syncPad() {
    const context = this.context;
    const theme = this.ambientTheme;
    if (!context || context.state !== "running" || !this.enabled || !this.ambientEnabled || !theme || this.isLowBandwidth()) {
      this.stopPad(0.5);
      return;
    }
    const key = `${theme.base}-${theme.bright}-${theme.texture}`;
    if (this.pad?.key === key) return;
    this.stopPad(0.8);
    const now = context.currentTime;
    const gain = context.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.02, now + 2);
    gain.connect(context.destination);
    const lfo = context.createOscillator();
    const lfoDepth = context.createGain();
    lfo.frequency.value = 0.12;
    lfoDepth.gain.value = 0.007;
    lfo.connect(lfoDepth).connect(gain.gain);
    lfo.start();
    const frequencies = [theme.base / 2, theme.base * 0.75, theme.bright / 2];
    const type: OscillatorType = theme.texture === "triangle" ? "triangle" : "sine";
    const voices = frequencies.map((frequency, index) => {
      const oscillator = context.createOscillator();
      oscillator.type = type;
      oscillator.frequency.value = frequency;
      oscillator.detune.value = index * 5 - 5;
      const voice = context.createGain();
      voice.gain.value = 1 / (index + 1.4);
      oscillator.connect(voice).connect(gain);
      oscillator.start();
      return oscillator;
    });
    this.pad = { oscillators: [lfo, ...voices], gain, key };
  }

  private stopPad(fadeSeconds: number) {
    const pad = this.pad;
    const context = this.context;
    if (!pad || !context) return;
    const now = context.currentTime;
    pad.gain.gain.cancelScheduledValues(now);
    pad.gain.gain.setValueAtTime(Math.max(pad.gain.gain.value, 0.0001), now);
    pad.gain.gain.exponentialRampToValueAtTime(0.0001, now + fadeSeconds);
    pad.oscillators.forEach((oscillator) => oscillator.stop(now + fadeSeconds + 0.05));
    this.pad = null;
  }

  private isLowBandwidth() {
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
    return Boolean(connection?.saveData || connection?.effectiveType === "slow-2g" || connection?.effectiveType === "2g");
  }

  private tone(frequency: number, start: number, duration: number, type: OscillatorType, volume: number) {
    const context = this.context;
    if (!context) return;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.02);
  }
}
