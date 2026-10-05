import assert from 'node:assert/strict';
import fs from 'node:fs';
import { Buffer } from 'node:buffer';
import test from 'node:test';
import { parse } from '@babel/parser';
import {
  canEnableRealtimeInput, snapshotRealtimeMessages,
  buildRealtimeResumeContext, closeRealtimeTransport, captureRealtimeSpeech, resumeRealtimeSpeech,
} from './realtimeSessionControls.js';

// Execute the actual component handlers with fake media/provider transports.
// This covers the callbacks that previously overrode the user's mute state.
const componentFunctions = new Map();
function handlers(surface, names, deps) {
  if (!componentFunctions.has(surface)) {
    const source = fs.readFileSync(new URL(`../components/${surface}.jsx`, import.meta.url), 'utf8');
    const ast = parse(source, { sourceType: 'module', plugins: ['jsx'] });
    const functions = new Map();
    function visit(node) {
      if (!node || typeof node !== 'object') return;
      if (node.type === 'FunctionDeclaration') functions.set(node.id.name, source.slice(node.start, node.end));
      for (const value of Object.values(node)) {
        if (Array.isArray(value)) value.forEach(visit);
        else if (value && typeof value === 'object') visit(value);
      }
    }
    visit(ast);
    componentFunctions.set(surface, functions);
  }
  const functions = componentFunctions.get(surface);
  return new Function(...Object.keys(deps), names.map(name => {
    assert.ok(functions.has(name), `Missing ${surface}.${name}`);
    return functions.get(name);
  }).join('\n') + `\nreturn {${names.join(',')}};`)(...Object.values(deps));
}
const ref = current => ({ current });
const noop = () => {};
function environment() {
  const events = [], gates = [], state = {}, calls = [];
  const track = { kind: 'audio', enabled: true, stopped: false, stop() { this.stopped = true; } };
  const sender = { track, replaceTrack(next) { this.track = next; return Promise.resolve(); } };
  const stream = { getTracks: () => [track], getAudioTracks: () => [track] };
  const channel = { readyState: 'open', send(raw) { events.push(JSON.parse(raw)); }, close() { this.readyState = 'closed'; calls.push('channel.close'); }, setInputAudioEnabled(enabled) { gates.push(enabled); } };
  const connection = { getSenders: () => [sender], getReceivers: () => [], close() { calls.push('connection.close'); } };
  const deps = {
    canEnableRealtimeInput, snapshotRealtimeMessages, buildRealtimeResumeContext, closeRealtimeTransport, captureRealtimeSpeech, resumeRealtimeSpeech,
    status: 'connected', isMutedRef: ref(false), isPausedRef: ref(false), aliveRef: ref(true),
    assistantInputLockedRef: ref(true), assistantSpeakingRef: ref(true),
    pausedMessagesRef: ref([]), pausedSpeechRef: ref(null), messagesRef: ref([{ id: 'u', role: 'user', textFinal: 'Me llamo Ana', done: true }, { id: 'a', role: 'assistant', textStream: 'Encant', done: false }]),
    streamBuffersRef: ref(new Map([['a','ada.']])),
    connectionEpochRef: ref(1), connectionTransitionRef: ref(false), micSenderRef: ref(null),
    localRef: ref(stream), dcRef: ref(channel), pcRef: ref(connection),
    audioRef: ref({ pause: noop, srcObject: null, load: noop }), audioCtxRef: ref({ close: noop }),
    pauseMsRef: ref(2000), pauseMs: 800, starterTtsDuckRef: ref(false),
    setIsMuted: value => { state.muted = value; }, setIsPaused: value => { state.paused = value; },
    setStatus: value => { state.status = value; }, setUiState: noop, setMood: noop,
    setMessages: value => { state.messages = value; }, setReplayingId: noop,
    buildEnabledTurnDetectionConfig: () => ({ type: 'server_vad' }),
    buildConversationTurnDetection: () => ({ type: 'server_vad' }),
    buildRealtimeVadSession: turn_detection => ({ turn_detection }),
    clearAutoStopTimer: noop, clearTutorKickoffTimer: noop, clearAssistantUnlockTimer: noop,
    clearAllDebouncers: noop, stopStarterTts: noop, safeCancelActiveResponse: noop,
    stopReplayAudio: noop, stopSpeechSampling: noop,
    queueTutorConversationDraftSave: noop, flushTutorConversationDraftSave: noop,
    normalizeTutorConversationDraftMessages: messages => snapshotRealtimeMessages(messages), sanitizeTutorAssistantText: text => text,
    restoreTutorLessonAfterRepair: noop, start: options => { calls.push(options); },
  };
  for (const name of ['tutorKickoffSentRef','tutorWelcomePendingReplyRef','tutorSessionReadyRef','pendingUserAudioCommitRef','tutorClosingActRecoveryInFlightRef','pendingTutorRepairRestoreRef','manualResponseRequestedRef','audioGraphReadyRef']) deps[name] = ref(false);
  for (const name of ['analyserRef','floatBufRef','micAnalyserRef','micFloatBufRef','captureOutRef','tutorAnalyserRef','tutorFloatBufRef','currentSpeechTurnRef','tutorClosingActRecoveryTurnRef']) deps[name] = ref(null);
  for (const name of ['tutorWelcomeRidSetRef','replayRidSetRef','ignoredRidSetRef','tutorClosingActCheckedKeysRef']) deps[name] = ref(new Set());
  for (const name of ['recMapRef','recChunksRef','recTailRef','respToMsg']) deps[name] = ref(new Map());
  deps.guardrailItemIdsRef = ref([]); deps.pendingGuardrailTextRef = ref(''); deps.isIdleRef = ref(false); deps.idleWaitersRef = ref([]);
  return { deps, events, gates, state, calls, track, sender, stream, channel, connection };
}

for (const surface of ['Tutor','ProficiencyTest','RealTimeTest','Conversations']) {
  test(`${surface}: reply completion cannot reopen muted microphone or VAD`, async () => {
    const env = environment();
    const api = handlers(surface, ['buildTurnDetectionConfig','setLocalMicEnabled','setAssistantInputLocked','enableVAD','toggleMute'], env.deps);
    api.toggleMute();
    assert.equal(env.track.enabled, false);
    assert.equal(env.sender.track, null);
    api.setAssistantInputLocked(false);
    api.enableVAD();
    assert.equal(env.track.enabled, false);
    assert.equal(env.sender.track, null);
    assert.equal(api.buildTurnDetectionConfig(), null);
    if (surface === 'Tutor') assert.ok(env.gates.every(enabled => !enabled));
    assert.ok(!env.events.some(event => event.type === 'response.cancel'));
    api.toggleMute();
    assert.equal(env.track.enabled, true);
    assert.equal(env.sender.track, env.track);
    assert.equal(api.buildTurnDetectionConfig().type, 'server_vad');
  });
  test(`${surface}: unmuting mid-reply waits for the playback lock`, () => {
    const env = environment();
    const api = handlers(surface, ['buildTurnDetectionConfig','setLocalMicEnabled','setAssistantInputLocked','enableVAD','toggleMute'], env.deps);
    api.toggleMute(); api.toggleMute();
    assert.equal(env.deps.isMutedRef.current, false);
    assert.equal(env.track.enabled, false);
    assert.equal(env.sender.track, null);
    assert.equal(api.buildTurnDetectionConfig(), null);
    api.setAssistantInputLocked(false);
    assert.equal(env.track.enabled, true);
    assert.equal(env.sender.track, env.track);
  });
  test(`${surface}: pause closes transports, freezes partial text, and Resume reconnects`, async () => {
    const env = environment();
    env.deps.isMutedRef.current = true;
    const api = handlers(surface, ['buildTurnDetectionConfig','setLocalMicEnabled','stop','togglePause'], env.deps);
    await api.togglePause();
    assert.equal(env.state.status, 'paused');
    assert.equal(env.state.paused, true);
    assert.equal(env.state.muted, true);
    assert.equal(env.deps.aliveRef.current, false);
    assert.equal(env.track.stopped, true);
    assert.equal(env.deps.pcRef.current, null);
    assert.equal(env.deps.dcRef.current, null);
    assert.ok(env.calls.includes('channel.close'));
    assert.ok(env.calls.includes('connection.close'));
    assert.ok(env.events.some(event => event.type === 'response.cancel'));
    assert.equal(env.deps.pausedMessagesRef.current[1].textFinal, 'Encantada.');
    assert.equal(env.deps.pausedMessagesRef.current[1].interrupted, true);
    await api.togglePause();
    assert.deepEqual(env.calls.at(-1), { resume: true });
  });
  test(`${surface}: End clears the saved pause and mute state`, async () => {
    const env = environment();
    env.deps.isMutedRef.current = true; env.deps.isPausedRef.current = true;
    env.deps.pausedMessagesRef.current = env.deps.messagesRef.current;
    const api = handlers(surface, ['buildTurnDetectionConfig','setLocalMicEnabled','stop'], env.deps);
    await api.stop();
    assert.equal(env.state.status, 'disconnected');
    assert.equal(env.state.muted, false);
    assert.equal(env.state.paused, false);
    assert.deepEqual(env.deps.pausedMessagesRef.current, []);
  });
}

test('restored context retains question order, excludes unrelated roles, and bounds older turns', () => {
  const snapshot = snapshotRealtimeMessages([
    { role: 'system', text: 'not transcript' },
    ...Array.from({ length: 30 }, (_, i) => ({ role: i % 2 ? 'assistant' : 'user', text: `turn ${i}` })),
  ]);
  const context = buildRealtimeResumeContext(snapshot);
  const turns = JSON.parse(context.split('\n').at(-1));
  assert.equal(turns.length, 24);
  assert.equal(turns[0].text, 'turn 6');
  assert.equal(turns.at(-1).text, 'turn 29');
  assert.match(context, /do not restart/);
  assert.equal(buildRealtimeResumeContext([]), '');
});

test('pause awaits the Gemini socket close and closes a shared bridge only once', async () => {
  let finishClose;
  let closeCount = 0;
  const calls = [];
  const bridge = { readyState: 'open', send: raw => calls.push(JSON.parse(raw).type), close() { closeCount++; return new Promise(resolve => { finishClose = resolve; }); } };
  const track = { enabled: true, stop() { calls.push('track.stop'); } };
  let finished = false;
  const closing = closeRealtimeTransport({ channel: bridge, connection: bridge, stream: { getTracks: () => [track] } }).then(() => { finished = true; });
  assert.equal(track.enabled, false);
  assert.equal(calls[0], 'track.stop');
  assert.ok(calls.includes('response.cancel'));
  assert.equal(closeCount, 1);
  assert.equal(finished, false);
  finishClose(); await closing;
  assert.equal(finished, true);
});

function prepareStart(env, surface, { provider = 'gemini', fail = false } = {}) {
  const { deps } = env;
  const resetCalls = [];
  const connectionOptions = [];
  let currentChannel;
  const bridge = {
    ...env.channel, mediaStream: env.stream,
    getSenders: () => [], getReceivers: () => [], setOutputGain: noop,
  };
  class PeerConnection {
    constructor() { this.sender = env.sender; }
    getSenders() { return [this.sender]; }
    getReceivers() { return []; }
    addTrack(track) { this.sender.track = track; }
    addTransceiver() {}
    createDataChannel() { currentChannel = { ...env.channel }; return currentChannel; }
    async createOffer() { return { sdp: 'offer' }; }
    async setLocalDescription() {}
    async setRemoteDescription() { if (fail) throw new Error('fake connection failure'); }
    close() { env.calls.push('new connection.close'); }
  }
  Object.assign(deps, {
    playSound: noop, submitActionSound: null, setErr: value => { env.state.error = value; },
    closeSummary: noop, ensureUserDoc: async () => {}, currentNpub: '',
    setSessionXp: value => resetCalls.push(['xp',value]), setSessionTurns: value => resetCalls.push(['turns',value]),
    setGoalsCompleted: value => resetCalls.push(['goals',value]),
    setShowResult: value => resetCalls.push(['result',value]), setAssessedLevel: noop,
    setAssessmentSummary: noop, setAssessmentScores: value => resetCalls.push(['scores',value]),
    assessmentDoneRef: ref(false), speechTurnsRef: ref([{ text: 'Me llamo Ana', durationMs: 500 }]), streamFlushTimerRef: ref(null),
    navigator: { mediaDevices: { getUserMedia: async () => env.stream } }, RTCPeerConnection: PeerConnection,
    MediaStream: class { addTrack() {} },
    appCheckFetch: async () => ({ ok: true, text: async () => 'answer' }), REALTIME_URL: 'fake',
    buildLanguageInstructions: () => 'lesson instructions', buildProficiencyInstructions: () => 'assessment instructions',
    buildRealtimeAudioSession: value => value, selectedVoice: 'marin', targetLanguageCode: 'es',
    scheduleAutoStop: noop, handleRealtimeEvent: () => { env.calls.push('event'); },
    handleRealtimeEventRef: ref(() => { env.calls.push('event'); }),
    applyLanguagePolicyNow: noop, getPreferredTTSVoice: value => value,
    applyLanguagePropOverrides: value => value, primeRefsFromPrefs: noop,
    voiceRef: ref('marin'), targetLangRef: ref('es'), setVoice: noop,
    startFreshTutorConversationSession: () => resetCalls.push(['fresh tutor']),
    ensureSelectedTutorLessonStarted: async () => {}, hasStartedTutorLessonConversation: () => true,
    getCurrentTutorInputLanguageCodes: () => ['es','en'], getCurrentTutorTranscriptionKeywords: () => ['Ana'],
    normalizePracticeLanguage: value => value, normalizeSupportLanguage: value => value,
    supportLangRef: ref('en'), targetLang: 'es', supportLang: 'en',
    resolveTutorRealtimeProvider: () => provider, resolveTutorRealtimeModel: () => 'fake-model',
    normalizeOpenAITutorVoice: value => value, normalizeGeminiLiveVoice: value => value,
    buildOpenAIResponseInstructionsPrefix: () => 'lesson instructions', buildTutorResponseInstructionsSuffix: () => '',
    TUTOR_TOOL_GRADING_ENABLED: false, useSoundSettings: { getState: () => ({ tutorVolume: 1 }) },
    createOpenAIRealtimeBridge: async options => { connectionOptions.push(options); if (fail) throw new Error('fake connection failure'); return bridge; },
    createGeminiLiveRealtimeBridge: async options => { connectionOptions.push(options); if (fail) throw new Error('fake connection failure'); return bridge; },
    console: { info: noop, error: noop },
    setTimeout: noop,
  });
  for (const name of ['tutorKickoffRetryCountRef','tutorWelcomePendingReplyRef','openaiTranscriptionSignatureRef','realtimeProviderRef']) deps[name] = ref(0);
  deps.audioGraphReadyRef.current = true;
  return { resetCalls, connectionOptions, channel: () => currentChannel, bridge };
}

for (const surface of ['Tutor','ProficiencyTest','RealTimeTest','Conversations']) {
  const providers = surface === 'Tutor' ? ['gemini','openai'] : ['openai'];
  for (const provider of providers) {
    test(`${surface} (${provider}): actual Resume preserves transcript/progress and starts muted`, async () => {
      const env = environment();
      env.deps.isMutedRef.current = true; env.deps.isPausedRef.current = true;
      env.deps.pausedMessagesRef.current = snapshotRealtimeMessages(env.deps.messagesRef.current);
      const snapshot = env.deps.pausedMessagesRef.current;
      const originalMessages = env.deps.messagesRef.current;
      const config = prepareStart(env, surface, { provider });
      const api = handlers(surface, ['buildTurnDetectionConfig','setLocalMicEnabled','start','stop'], env.deps);
      await api.start({ resume: true });
      assert.equal(env.state.status, 'connected');
      assert.equal(env.deps.isPausedRef.current, false);
      assert.equal(env.deps.isMutedRef.current, true);
      assert.equal(env.track.enabled, false);
      assert.equal(env.deps.messagesRef.current, originalMessages);
      assert.equal(env.deps.pausedMessagesRef.current, snapshot);
      assert.deepEqual(config.resetCalls, []);
      if (surface === 'ProficiencyTest') assert.equal(env.deps.speechTurnsRef.current.length, 1);
      if (surface === 'Tutor') {
        assert.equal(config.connectionOptions[0].inputAudioEnabled, false);
        const oldEvent = config.connectionOptions[0].onEvent;
        oldEvent({ data: '{}' });
        assert.equal(env.calls.at(-1), 'event');
        await api.stop({ preservePause: true });
        const eventCount = env.calls.filter(call => call === 'event').length;
        oldEvent({ data: '{}' });
        assert.equal(env.calls.filter(call => call === 'event').length, eventCount);
      } else {
        const channel = config.channel();
        channel.onmessage({ data: '{}' });
        assert.equal(env.calls.at(-1), 'event');
        await api.stop({ preservePause: true });
        const eventCount = env.calls.filter(call => call === 'event').length;
        channel.onmessage({ data: '{}' });
        assert.equal(env.calls.filter(call => call === 'event').length, eventCount);
      }
    });
    test(`${surface} (${provider}): failed Resume remains paused and can be retried`, async () => {
      const env = environment();
      env.deps.isPausedRef.current = true;
      env.deps.pausedMessagesRef.current = snapshotRealtimeMessages(env.deps.messagesRef.current);
      const snapshot = env.deps.pausedMessagesRef.current;
      prepareStart(env, surface, { provider, fail: true });
      const api = handlers(surface, ['buildTurnDetectionConfig','setLocalMicEnabled','start','stop'], env.deps);
      await api.start({ resume: true });
      assert.equal(env.state.status, 'paused');
      assert.equal(env.deps.isPausedRef.current, true);
      assert.equal(env.deps.connectionTransitionRef.current, false);
      assert.equal(env.deps.aliveRef.current, false);
      assert.equal(env.deps.pausedMessagesRef.current, snapshot);
      assert.match(env.state.error, /fake connection failure/);
      assert.equal(env.deps.pcRef.current, null);
    });
  }
}

for (const surface of ['Tutor','ProficiencyTest','RealTimeTest','Conversations']) {
  const builders = surface === 'Tutor' ? ['buildLanguageInstructions','buildOpenAIResponseInstructionsPrefix']
    : [surface === 'ProficiencyTest' ? 'buildProficiencyInstructions' : 'buildLanguageInstructions'];
  test(`${surface}: every resumed instruction update keeps the saved conversation context`, () => {
    const deps = { buildRealtimeResumeContext, pausedMessagesRef: ref([{ role: 'user', textFinal: 'Me llamo Ana' }]) };
    for (const builder of builders) deps[`${builder}Base`] = () => 'original lesson policy';
    const api = handlers(surface, builders, deps);
    for (const builder of builders) {
      const instructions = api[builder]();
      assert.match(instructions, /original lesson policy/);
      assert.match(instructions, /Me llamo Ana/);
      assert.match(instructions, /do not restart/);
    }
  });
}

test('RealTimeTest: a late starter-audio ended callback cannot unmute the learner', () => {
  const env = environment();
  env.track.readyState = 'live';
  env.deps.assistantInputLockedRef.current = false;
  env.deps.isMutedRef.current = true;
  env.deps.starterTtsRequestRef = ref(0);
  env.deps.starterTtsAudioRef = ref(null);
  env.deps.starterTtsCleanupRef = ref(null);
  env.deps.starterTtsDuckRef.current = { micTracks: [env.track] };
  env.deps.setStarterTts = noop;
  const api = handlers('RealTimeTest', ['stopStarterTts'], env.deps);
  api.stopStarterTts();
  assert.equal(env.track.enabled, false);
});

function bridgeClass(filename, name, deps) {
  const source = fs.readFileSync(new URL(filename, import.meta.url), 'utf8');
  const ast = parse(source, { sourceType: 'module' });
  const declaration = ast.program.body.find(node => node.type === 'ClassDeclaration' && node.id.name === name);
  assert.ok(declaration);
  return new Function(...Object.keys(deps), source.slice(declaration.start, declaration.end) + `;return ${name};`)(...Object.values(deps));
}

test('Gemini: a muted connection never forwards worklet PCM, including after a session reset', () => {
  let sent = 0;
  const Class = bridgeClass('./geminiLiveBridge.js', 'GeminiLiveRealtimeBridge', {
    normalizeGeminiLiveVoice: value => value, INPUT_SPEECH_HOLD_MS: 1200,
    INPUT_SAMPLE_RATE: 16000, toBase64: () => 'audio',
  });
  const bridge = new Class({ inputAudioEnabled: false, voice: 'Aoede' });
  const track = { enabled: true };
  bridge.mediaStream = { getAudioTracks: () => [track] };
  bridge.readyState = 'open';
  bridge.session = { sendAudioRealtime() { sent++; return Promise.resolve(); } };
  bridge.applyInputAudioEnabled();
  assert.equal(track.enabled, false);
  bridge.handleInputAudioBuffer(new ArrayBuffer(320));
  bridge.sendInputAudioBuffer(new ArrayBuffer(320));
  assert.equal(sent, 0);
  bridge.resettingSession = true; bridge.applyInputAudioEnabled();
  bridge.resettingSession = false; bridge.applyInputAudioEnabled();
  bridge.sendInputAudioBuffer(new ArrayBuffer(320));
  assert.equal(sent, 0);
  bridge.setInputAudioEnabled(true);
  bridge.sendInputAudioBuffer(new ArrayBuffer(320));
  assert.equal(sent, 1);
});

test('OpenAI Tutor: a muted reconnect starts with VAD and its microphone disabled', () => {
  const Class = bridgeClass('./openaiRealtimeBridge.js', 'OpenAIRealtimeBridge', {
    DEFAULT_OPENAI_TUTOR_VOICE: 'marin', DEFAULT_PAUSE_MS: 1200, DEFAULT_REALTIME_MODEL: 'fake',
    DEFAULT_TURN_DETECTION: { type: 'server_vad' }, normalizePauseMs: value => value,
    buildTutorInputTranscription: () => ({ model: 'gpt-4o-mini-transcribe' }),
  });
  const bridge = new Class({ inputAudioEnabled: false });
  const track = { enabled: true };
  bridge.localStream = { getAudioTracks: () => [track] };
  bridge.setInputAudioEnabled(bridge.inputAudioEnabled);
  assert.equal(track.enabled, false);
  assert.equal(bridge.buildInitialSession().turn_detection, null);
  bridge.setInputAudioEnabled(true);
  assert.equal(bridge.buildInitialSession().turn_detection.type, 'server_vad');
});

for (const surface of ['Tutor','ProficiencyTest','RealTimeTest','Conversations']) {
  test(`${surface}: reopening the mic never attaches input to a recvonly sender`, () => {
    const env = environment();
    env.deps.assistantInputLockedRef.current = false;
    const recvonly = { track: null, replaceTrack() { assert.fail('recvonly sender must stay detached'); } };
    env.connection.getSenders = () => [recvonly, env.sender];
    const api = handlers(surface, ['setLocalMicEnabled'], env.deps);
    api.setLocalMicEnabled(true);
    api.setLocalMicEnabled(false);
    assert.equal(env.sender.track, null);
    api.setLocalMicEnabled(true);
    assert.equal(env.sender.track, env.track);
    assert.equal(recvonly.track, null);
  });
}

for (const surface of ['Tutor', 'ProficiencyTest', 'RealTimeTest', 'Conversations']) {
  for (const provider of surface === 'Tutor' ? ['gemini', 'openai'] : ['openai']) {
    test(`${surface} (${provider}): Resume requests interrupted speech before opening the mic`, async () => {
      const env = environment();
      const config = prepareStart(env, surface, { provider });
      Object.assign(env.deps, {
        buildLanguageInstructionsFromRefs: () => 'saved lesson policy',
        setTimeout: fn => { fn(); return 1; },
        finishAssistantOutput: noop,
      });
      env.deps.pausedSpeechRef.current = { text: 'Ahora vamos a practicar' };
      if (surface === 'Tutor') {
        env.deps.pausedSpeechRef.current.cached = { chunks: ['saved-pcm'], complete: true };
        config.bridge.playSavedOutput = () => assert.fail('Tutor must generate a fresh contextual reply instead of replaying PCM');
      }
      env.deps.isPausedRef.current = true;
      const api = handlers(surface, ['buildTurnDetectionConfig', 'setLocalMicEnabled', 'setAssistantInputLocked', 'enableVAD', 'resumePausedSpeech', 'start'], env.deps);
      await api.start({ resume: true });
      if (surface !== 'Tutor') await config.channel().onopen();
      assert.equal(env.track.enabled, false);
      assert.equal(env.deps.assistantInputLockedRef.current, true);
      const request = env.events.find(event => event.type === 'response.create');
      assert.ok(request);
      assert.equal(request.response.metadata.kind, 'pause_resume');
      assert.match(request.response.instructions, /Ahora vamos a practicar/);
      if (surface === 'Tutor') {
        assert.equal(config.connectionOptions[0].inputAudioEnabled, false);
        assert.match(request.response.instructions, /Start a NEW spoken reply/);
        assert.match(request.response.instructions, /So, as I was saying/);
        assert.match(request.response.instructions, /appropriate speaking language/);
        assert.match(request.response.instructions, /lesson instructions/);
        assert.ok(!request.response.instructions.includes('audio has just been replayed'));
        assert.equal(request.response.tool_choice, 'none');
      }
    });
  }
  test(`${surface}: pausing during the learner's turn does not generate a new AI reply`, async () => {
    const env = environment();
    env.deps.assistantInputLockedRef.current = false;
    env.deps.isIdleRef.current = true;
    const api = handlers(surface, ['setLocalMicEnabled', 'stop', 'togglePause'], env.deps);
    await api.togglePause();
    assert.equal(env.deps.pausedSpeechRef.current, null);
  });
}

test('cached completed speech replays locally without requesting generation', () => {
  const requests = [];
  let finishReplay, finished = false;
  const channel = { readyState: 'open', send: request => requests.push(request), playSavedOutput(snapshot, callback) { finishReplay = callback; } };
  resumeRealtimeSpeech({ channel, speech: { text: 'Your question', cached: { chunks: ['pcm'], complete: true } }, onComplete: () => { finished = true; } });
  assert.equal(finished, false);
  assert.deepEqual(requests, []);
  finishReplay();
  assert.equal(finished, true);
  assert.deepEqual(requests, []);
});

test('an unfinished Gemini turn waits for cached audio before generating its missing remainder', () => {
  const requests = [];
  let finishReplay;
  const channel = { readyState: 'open', send: raw => requests.push(JSON.parse(raw)), playSavedOutput(snapshot, callback) { finishReplay = callback; } };
  resumeRealtimeSpeech({ channel, speech: { text: 'Saved partial reply', cached: { chunks: ['pcm'], complete: false } }, instructions: 'Lesson policy', onComplete: () => assert.fail('not finished') });
  assert.deepEqual(requests, []);
  finishReplay();
  assert.equal(requests.length, 1);
  assert.match(requests[0].response.instructions, /Continue directly AFTER/);
  assert.match(requests[0].response.instructions, /Saved partial reply/);
});

test('Gemini snapshots trim played samples and retain queued chunks across repeated pauses', () => {
  const toBase64 = bytes => Buffer.from(bytes).toString('base64');
  const fromBase64 = raw => Uint8Array.from(Buffer.from(raw, 'base64')).buffer;
  const Class = bridgeClass('./geminiLiveBridge.js', 'GeminiLiveRealtimeBridge', {
    normalizeGeminiLiveVoice: value => value, INPUT_SPEECH_HOLD_MS: 1200,
    OUTPUT_SAMPLE_RATE: 24000, toBase64, fromBase64,
  });
  function freshBridge() {
    const bridge = new Class({ inputAudioEnabled: false });
    bridge.playbackAnalyser = {};
    bridge.audioContext = {
      currentTime: 0, state: 'running',
      createBuffer(channels, length, rate) { return { getChannelData: () => new Float32Array(length), duration: length / rate }; },
      createBufferSource() { return { connect() {}, start(at) { this.at = at; }, stop() {} }; },
    };
    return bridge;
  }
  const bridge = freshBridge();
  bridge.activeResponse = { text: 'Received reply' };
  bridge.serverTurnComplete = true;
  const pcm = new Int16Array(24000); pcm.fill(100);
  bridge.playAudio(toBase64(pcm.buffer));
  bridge.playAudio(toBase64(pcm.buffer));
  bridge.audioContext.currentTime = 0.52;
  const snapshot = bridge.capturePausedOutput();
  assert.equal(fromBase64(snapshot.chunks[0]).byteLength, 24000); // half-second remains
  assert.equal(fromBase64(snapshot.chunks[1]).byteLength, 48000); // future chunk untouched
  assert.equal(snapshot.complete, true);
  bridge.interruptPlayback();
  const resumed = freshBridge();
  let finishes = 0;
  resumed.playSavedOutput(snapshot, () => { finishes++; });
  resumed.audioContext.currentTime = 0.27;
  const pausedAgain = resumed.capturePausedOutput();
  assert.equal(fromBase64(pausedAgain.chunks[0]).byteLength, 12000);
  assert.equal(pausedAgain.text, snapshot.text);
  assert.equal(pausedAgain.complete, true);
  assert.equal(finishes, 0);
  const sources = [...resumed.scheduledSources];
  sources.forEach(source => source.onended());
  assert.equal(finishes, 1);
});

test('ProficiencyTest: generation completion keeps the mic locked until audio playback stops', async () => {
  const env = environment();
  env.track.enabled = false;
  env.deps.scheduleAutoStop = noop;
  const api = handlers('ProficiencyTest', ['buildTurnDetectionConfig','setLocalMicEnabled','setAssistantInputLocked','enableVAD','handleRealtimeEvent'], env.deps);
  await api.handleRealtimeEvent({ data: JSON.stringify({ type: 'response.done', response: { id: 'resume-response' } }) });
  assert.equal(env.deps.assistantInputLockedRef.current, true);
  assert.equal(env.track.enabled, false);
  await api.handleRealtimeEvent({ data: JSON.stringify({ type: 'output_audio_buffer.stopped' }) });
  assert.equal(env.deps.assistantInputLockedRef.current, false);
  assert.equal(env.track.enabled, true);
});

test('Gemini: speech continuation cannot execute progress/XP tools', async () => {
  const responses = [];
  const Class = bridgeClass('./geminiLiveBridge.js', 'GeminiLiveRealtimeBridge', {
    normalizeGeminiLiveVoice: value => value, INPUT_SPEECH_HOLD_MS: 1200,
  });
  const bridge = new Class({ inputAudioEnabled: false });
  bridge.session = { sendFunctionResponses: async calls => responses.push(...calls) };
  bridge.activeResponse = { metadata: { kind: 'pause_resume' } };
  bridge.onEvent = () => assert.fail('must not execute resumed grading calls');
  await bridge.handleServerMessage({ type: 'toolCall', functionCalls: [{ id: 'grade', name: 'markTurnSuccessful', args: { correct: true } }] });
  assert.equal(responses.length, 1);
  assert.equal(responses[0].response.allowed, false);
});

test('pause while waiting for a reply uses the latest learner turn rather than repeating an earlier tutor turn', () => {
  const speech = captureRealtimeSpeech({ pending: true, messages: [
    { role: 'assistant', textFinal: 'Say hola' },
    { role: 'user', textFinal: 'What does hola mean?' },
  ] });
  assert.equal(speech.text, '');
  const events = [];
  resumeRealtimeSpeech({ channel: { readyState: 'open', send: raw => events.push(JSON.parse(raw)) }, speech });
  assert.match(events[0].response.instructions, /Answer the latest learner turn/);
});
