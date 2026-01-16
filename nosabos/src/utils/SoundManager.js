/**
 * SoundManager - Synthesized sound effects for HexArt
 *
 * Uses Tone.js to generate all sounds programmatically.
 * Based on Vibecraft's audio system.
 */

import * as Tone from "tone";

// Volume Levels (dB)
const VOL = Object.freeze({
  QUIET: -20,
  SOFT: -16,
  NORMAL: -12,
  PROMINENT: -10,
  LOUD: -8,
});

class SoundManager {
  initialized = false;
  enabled = true;
  volume = 0.7;

  synthPools = new Map([
    ["sine", []],
    ["square", []],
    ["triangle", []],
    ["sawtooth", []],
  ]);

  activeSynths = new Set();
  MAX_POOL_SIZE = 5;

  async init() {
    if (this.initialized) return;
    await Tone.start();
    Tone.Destination.volume.value = Tone.gainToDb(this.volume);
    this.initialized = true;
    console.log("[SoundManager] Audio initialized");
  }

  isReady() {
    return this.initialized;
  }

  setEnabled(enabled) {
    this.enabled = enabled;
  }

  isEnabled() {
    return this.enabled;
  }

  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.initialized) {
      Tone.Destination.volume.value = Tone.gainToDb(this.volume);
    }
  }

  getVolume() {
    return this.volume;
  }

  play(name) {
    if (!this.initialized || !this.enabled) return;
    const soundFn = this.sounds[name];
    if (soundFn) {
      soundFn();
    }
  }

  /**
   * Play hover sound with pitch based on distance from center
   */
  playHover(normalizedDistance) {
    if (!this.initialized || !this.enabled) return;

    const BASE_NOTE = 72; // C5
    const SEMITONE_RANGE = 12;

    const t = Math.max(0, Math.min(1, normalizedDistance));
    const midiNote = BASE_NOTE + t * SEMITONE_RANGE;
    const frequency = 440 * Math.pow(2, (midiNote - 69) / 12);

    const synth = this.getSynth({
      type: "sine",
      attack: 0.001,
      decay: 0.03,
      sustain: 0,
      release: 0.02,
    });
    synth.volume.value = VOL.QUIET - 6;
    synth.triggerAttackRelease(frequency, "64n");
    this.releaseSynth(synth, 80);
  }

  /**
   * Play brush size change sound - rising or falling tone
   */
  playBrushSize(size, maxSize) {
    if (!this.initialized || !this.enabled) return;

    const t = (size - 1) / (maxSize - 1);
    const midiNote = 60 + t * 12; // C4 to C5
    const frequency = 440 * Math.pow(2, (midiNote - 69) / 12);

    const synth = this.getSynth({
      type: "triangle",
      attack: 0.005,
      decay: 0.08,
      sustain: 0,
      release: 0.06,
    });
    synth.volume.value = VOL.SOFT;
    synth.triggerAttackRelease(frequency, "32n");
    this.releaseSynth(synth, 150);
  }

  /**
   * Play color switch with a unique chord for each color
   * Each color has a chord that matches its emotional vibe
   */
  playColorSwitch(index, _total) {
    if (!this.initialized || !this.enabled) return;

    // Chords mapped to colors (index 0-9):
    // 0: Cyan    - Cmaj9 (crystalline, airy)
    // 1: Blue    - Am7 (calm, deep)
    // 2: Teal    - Em9 (oceanic, flowing)
    // 3: Green   - Gmaj7 (natural, warm)
    // 4: Purple  - Bbmaj7 (mystical, dreamy)
    // 5: Amber   - Dmaj7 (golden, sunny)
    // 6: Pink    - Fmaj7 (sweet, soft)
    // 7: Red     - E5 (intense, powerful)
    // 8: White   - Cadd9 (pure, bright)
    // 9: Dark    - Bdim (mysterious, void)
    const chords = [
      ["C4", "E4", "G4", "B4"], // Cyan - Cmaj7
      ["A3", "C4", "E4", "G4"], // Blue - Am7
      ["E3", "G3", "B3", "D4"], // Teal - Em7
      ["G3", "B3", "D4", "F#4"], // Green - Gmaj7
      ["Bb3", "D4", "F4", "A4"], // Purple - Bbmaj7
      ["D4", "F#4", "A4", "C#5"], // Amber - Dmaj7
      ["F3", "A3", "C4", "E4"], // Pink - Fmaj7
      ["E3", "B3", "E4"], // Red - E5 power
      ["C4", "G4", "D5"], // White - Cadd9 (no 3rd, open)
      ["B3", "D4", "F4", "Ab4"], // Dark - Bdim7
    ];

    const chord = chords[index] || chords[0];

    const synth = this.createDisposablePolySynth(
      {
        type: "triangle",
        attack: 0.01,
        decay: 0.15,
        sustain: 0.1,
        release: 0.3,
      },
      VOL.SOFT,
      600
    );

    const now = Tone.now();
    chord.forEach((note, i) => {
      synth.triggerAttackRelease(note, "8n", now + i * 0.015);
    });
  }

  getSynth(config) {
    let pool = this.synthPools.get(config.type);
    if (!pool) {
      pool = [];
      this.synthPools.set(config.type, pool);
    }
    let synth = pool.pop();

    if (!synth) {
      synth = new Tone.Synth({
        oscillator: { type: config.type },
        envelope: {
          attack: config.attack,
          decay: config.decay,
          sustain: config.sustain,
          release: config.release,
        },
      }).toDestination();
    } else {
      synth.oscillator.type = config.type;
      synth.envelope.attack = config.attack;
      synth.envelope.decay = config.decay;
      synth.envelope.sustain = config.sustain;
      synth.envelope.release = config.release;
    }

    this.activeSynths.add(synth);
    return synth;
  }

  releaseSynth(synth, delayMs = 500) {
    setTimeout(() => {
      this.activeSynths.delete(synth);
      const type = synth.oscillator.type;
      const pool = this.synthPools.get(type);
      if (pool && pool.length < this.MAX_POOL_SIZE) {
        pool.push(synth);
      } else {
        synth.dispose();
      }
    }, delayMs);
  }

  createDisposableSynth(config, volume) {
    const synth = new Tone.Synth({
      oscillator: { type: config.type },
      envelope: {
        attack: config.attack,
        decay: config.decay,
        sustain: config.sustain,
        release: config.release,
      },
    }).toDestination();
    synth.volume.value = volume;
    this.activeSynths.add(synth);

    const totalTime =
      (config.attack + config.decay + config.release) * 1000 + 200;
    setTimeout(() => {
      this.activeSynths.delete(synth);
      synth.dispose();
    }, totalTime);

    return synth;
  }

  createDisposablePolySynth(config, volume, disposeAfterMs) {
    const synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: config.type },
      envelope: {
        attack: config.attack,
        decay: config.decay,
        sustain: config.sustain,
        release: config.release,
      },
    }).toDestination();
    synth.volume.value = volume;
    this.activeSynths.add(synth);

    setTimeout(() => {
      this.activeSynths.delete(synth);
      synth.dispose();
    }, disposeAfterMs);

    return synth;
  }

  // Sound definitions
  sounds = {
    click: () => {
      // Soft pop/tap
      const synth = this.getSynth({
        type: "sine",
        attack: 0.001,
        decay: 0.08,
        sustain: 0,
        release: 0.06,
      });
      synth.volume.value = VOL.NORMAL;
      synth.triggerAttackRelease("G4", "32n");

      const harm = this.createDisposableSynth(
        {
          type: "triangle",
          attack: 0.001,
          decay: 0.05,
          sustain: 0,
          release: 0.04,
        },
        VOL.QUIET
      );
      setTimeout(() => harm.triggerAttackRelease("D5", "64n"), 20);
      this.releaseSynth(synth, 200);
    },

    hover: () => {
      this.playHover(0);
    },

    paint: () => {
      // Quick brush stroke
      const synth = this.getSynth({
        type: "triangle",
        attack: 0.001,
        decay: 0.06,
        sustain: 0,
        release: 0.04,
      });
      synth.volume.value = VOL.SOFT;
      synth.triggerAttackRelease("E4", "32n");
      setTimeout(() => synth.triggerAttackRelease("G4", "32n"), 40);
      this.releaseSynth(synth, 200);
    },

    erase: () => {
      // Soft descending
      const synth = this.createDisposableSynth(
        { type: "sine", attack: 0.01, decay: 0.1, sustain: 0, release: 0.08 },
        VOL.SOFT
      );
      synth.triggerAttackRelease("E4", "16n");
      synth.frequency.exponentialRampTo("C4", 0.08);
    },

    pattern: () => {
      // Ascending arpeggio
      const synth = this.getSynth({
        type: "sine",
        attack: 0.001,
        decay: 0.04,
        sustain: 0,
        release: 0.03,
      });
      synth.volume.value = VOL.PROMINENT;
      const notes = ["C5", "E5", "G5", "C6"];
      notes.forEach((note, i) => {
        setTimeout(() => synth.triggerAttackRelease(note, "64n"), i * 40);
      });
      this.releaseSynth(synth, 400);
    },

    clear: () => {
      // Descending sweep
      const synth = this.createDisposablePolySynth(
        {
          type: "triangle",
          attack: 0.01,
          decay: 0.2,
          sustain: 0,
          release: 0.3,
        },
        VOL.NORMAL,
        800
      );
      const now = Tone.now();
      synth.triggerAttackRelease("G4", "16n", now);
      synth.triggerAttackRelease("E4", "16n", now + 0.06);
      synth.triggerAttackRelease("C4", "16n", now + 0.12);
    },

    colorSwitch: () => {
      // Quick blip
      const synth = this.getSynth({
        type: "triangle",
        attack: 0.005,
        decay: 0.06,
        sustain: 0,
        release: 0.05,
      });
      synth.volume.value = VOL.SOFT;
      synth.triggerAttackRelease("A4", "64n");
      this.releaseSynth(synth, 120);
    },

    success: () => {
      // Rising fifth
      const synth = this.createDisposableSynth(
        { type: "sine", attack: 0.01, decay: 0.15, sustain: 0, release: 0.2 },
        VOL.PROMINENT
      );
      synth.triggerAttackRelease("C5", "16n");
      setTimeout(() => synth.triggerAttackRelease("G5", "8n"), 100);
    },

    intro: () => {
      // Jazz welcome chord - Cmaj9
      const synth = this.createDisposablePolySynth(
        {
          type: "triangle",
          attack: 0.08,
          decay: 0.4,
          sustain: 0.3,
          release: 0.8,
        },
        VOL.PROMINENT,
        2000
      );

      const now = Tone.now();
      synth.triggerAttackRelease("C3", "2n", now);
      synth.triggerAttackRelease("B3", "2n", now + 0.05);
      synth.triggerAttackRelease("E4", "2n", now + 0.1);
      synth.triggerAttackRelease("G4", "2n", now + 0.15);
      synth.triggerAttackRelease("D5", "2n", now + 0.2);
    },
  };
}

export const soundManager = new SoundManager();
export { SoundManager };
