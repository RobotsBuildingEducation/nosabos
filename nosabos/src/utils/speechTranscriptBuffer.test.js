import assert from 'node:assert/strict';
import test from 'node:test';
import { createSpeechTranscriptBuffer } from './speechTranscriptBuffer.js';

test('repeated words spoken in separate turns remain in the reading transcript', () => {
  const transcript = createSpeechTranscriptBuffer();
  transcript.commit('a', null);
  transcript.commit('b', 'a');
  transcript.complete('a', 'Hola, hola.');
  transcript.complete('b', 'Hola, hola.');
  assert.equal(transcript.text(), 'Hola, hola. Hola, hola.');
});

test('late commit ordering places completed sentences after their predecessor', () => {
  const transcript = createSpeechTranscriptBuffer();
  transcript.complete('b', 'Second sentence.');
  transcript.commit('b', 'a');
  transcript.complete('a', 'First sentence.');
  transcript.commit('a', null);
  assert.equal(transcript.text(), 'First sentence. Second sentence.');
});

test('final text replaces an interim hypothesis and ignores subsequent deltas', () => {
  const transcript = createSpeechTranscriptBuffer();
  transcript.delta('a', 'Buenos', 'one');
  transcript.delta('a', 'Buenos', 'one');
  transcript.delta('a', ' días', 'two');
  assert.equal(transcript.text(), 'Buenos días');
  transcript.complete('a', 'Buenos días.');
  transcript.complete('a', 'Buenos días.');
  transcript.delta('a', ' días', 'three');
  assert.equal(transcript.text(), 'Buenos días.');
});
