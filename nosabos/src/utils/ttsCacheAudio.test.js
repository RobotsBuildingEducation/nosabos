import assert from "node:assert/strict";
import test from "node:test";
import { encodeTTSWav, findTTSStartFrame, prepareTTSCacheAudio } from "./ttsCacheAudio.js";

function buffer(channels, sampleRate = 1000) {
  return { numberOfChannels: channels.length, length: channels[0].length, sampleRate, getChannelData: (index) => channels[index] };
}

test("removes connection silence with a lead-in for quiet consonants, retaining pauses and the last sample", async () => {
  const samples = new Float32Array(7000);
  samples.fill(0.0005, 3900, 4000); // Quiet onset preceding the detection threshold.
  samples.fill(0.3, 4000, 5000);
  samples.fill(0.4, 6000); // Speech after an intentional one-second pause.
  samples[6999] = -0.5;
  const audio = buffer([samples]);
  const start = findTTSStartFrame(audio);
  assert.equal(start, 3880);
  const wav = encodeTTSWav(audio, start);
  assert.equal(wav.type, "audio/wav");
  const data = new DataView(await wav.arrayBuffer());
  assert.equal(data.getUint32(40, true), (7000 - 3880) * 2);
  assert.equal(data.getInt16(44 + (3900 - start) * 2, true), 16, "Quiet first consonant survives");
  assert.equal(data.getInt16(44 + (5500 - start) * 2, true), 0, "Internal pause survives");
  assert.equal(data.getInt16(data.byteLength - 2, true), -16384, "Final sample survives");
});

test("detects speech in either channel and interleaves a valid stereo WAV", async () => {
  const left = new Float32Array(3000);
  const right = new Float32Array(3000);
  right.fill(0.25, 2000);
  left[2999] = -0.25;
  const audio = buffer([left, right]);
  assert.equal(findTTSStartFrame(audio), 1880);
  const bytes = await encodeTTSWav(audio, 1880).arrayBuffer();
  const view = new DataView(bytes);
  assert.equal(new TextDecoder().decode(bytes.slice(0, 4)), "RIFF");
  assert.equal(view.getUint32(4, true), bytes.byteLength - 8);
  assert.equal(view.getUint16(22, true), 2);
  assert.equal(view.getUint32(24, true), 1000);
  assert.equal(view.getUint16(32, true), 4);
  assert.equal(view.getInt16(bytes.byteLength - 4, true), -8192);
  assert.equal(view.getInt16(bytes.byteLength - 2, true), 8192);
});

test("leaves short lead-ins, very quiet recordings, and all-silent recordings intact", () => {
  const samples = new Float32Array(1000);
  assert.equal(findTTSStartFrame(buffer([samples])), 0);
  samples.fill(0.0001);
  assert.equal(findTTSStartFrame(buffer([samples])), 0);
  samples[200] = 0.5;
  assert.equal(findTTSStartFrame(buffer([samples])), 0);
  samples[0] = 0.5;
  assert.equal(findTTSStartFrame(buffer([samples])), 0);
});

test("offline preparation repairs a recording once and preserves playable audio on decoder failures", async (t) => {
  const previous = globalThis.OfflineAudioContext;
  t.after(() => {
    if (previous) globalThis.OfflineAudioContext = previous;
    else delete globalThis.OfflineAudioContext;
  });
  const samples = new Float32Array(3000);
  samples.fill(0.25, 2000);
  globalThis.OfflineAudioContext = class {
    constructor(channels, length, sampleRate) { assert.deepEqual([channels, length, sampleRate], [1, 1, 24000]); }
    async decodeAudioData() { return buffer([samples]); }
  };
  const blob = new Blob(["compressed recording"]);
  const result = await prepareTTSCacheAudio(blob);
  assert.equal(result.prepared, true);
  assert.equal(result.blob.type, "audio/wav");
  globalThis.OfflineAudioContext = class {
    async decodeAudioData() { throw new Error("Unsupported recording format"); }
  };
  assert.deepEqual(await prepareTTSCacheAudio(blob), { blob, prepared: false });
});
