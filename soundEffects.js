// Short answer-feedback sounds, synthesized on the fly via the Web Audio API (no audio files needed).

let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function playTone(ctx, { frequency, startTime, duration, type = 'sine', peakGain = 0.2 }) {
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, startTime);

  gainNode.gain.setValueAtTime(0, startTime);
  gainNode.gain.linearRampToValueAtTime(peakGain, startTime + 0.01);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.start(startTime);
  oscillator.stop(startTime + duration);
}

function playCorrectSound() {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  // Short two-note ascending chime (A5 -> E6).
  playTone(ctx, { frequency: 880.0, startTime: now, duration: 0.12, type: 'sine', peakGain: 0.22 });
  playTone(ctx, { frequency: 1318.5, startTime: now + 0.09, duration: 0.18, type: 'sine', peakGain: 0.22 });
}

function playWrongSound() {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  // Two dissonant descending tones ("uh-oh" style incorrect-answer sound).
  playTone(ctx, { frequency: 622.3, startTime: now, duration: 0.16, type: 'triangle', peakGain: 0.4 });
  playTone(ctx, { frequency: 493.9, startTime: now + 0.14, duration: 0.28, type: 'triangle', peakGain: 0.4 });
}

// Background clock-tick while a question timer is running.
// Scheduling uses the AudioContext's own clock (not chained setTimeout delays), so ticks stay
// locked to real seconds instead of drifting from JS event-loop jitter. A lightweight 50ms poll
// just looks ahead and books any tick that falls due, so there is no per-tick timer overhead.
const TICK_LOOKAHEAD_SEC = 0.15;
const TICK_POLL_MS = 50;

let tickPollId = null;
let tickGeneration = 0;
let tickIsTock = false;
let clickNoiseBuffer = null;

// A short burst of white noise run through a resonant bandpass filter reads as a
// mechanical "click" rather than an electronic beep - the same trick real clock-app
// sound effects use to fake an escapement tick without a recorded sample.
function getClickNoiseBuffer(ctx) {
  if (clickNoiseBuffer && clickNoiseBuffer.sampleRate === ctx.sampleRate) return clickNoiseBuffer;
  const durationSec = 0.06;
  const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * durationSec), ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) {
    data[i] = Math.random() * 2 - 1;
  }
  clickNoiseBuffer = buffer;
  return buffer;
}

function playClickAt(ctx, time, { filterFrequency, peakGain, duration }) {
  const source = ctx.createBufferSource();
  source.buffer = getClickNoiseBuffer(ctx);

  const bandpass = ctx.createBiquadFilter();
  bandpass.type = 'bandpass';
  bandpass.frequency.setValueAtTime(filterFrequency, time);
  bandpass.Q.value = 1.4;

  const gainNode = ctx.createGain();
  gainNode.gain.setValueAtTime(0, time);
  gainNode.gain.linearRampToValueAtTime(peakGain, time + 0.002);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, time + duration);

  source.connect(bandpass);
  bandpass.connect(gainNode);
  gainNode.connect(ctx.destination);

  source.start(time);
  source.stop(time + duration);
}

function scheduleTickAt(ctx, time, urgent) {
  // Real clocks alternate a slightly higher "tick" and lower "tock" - alternating the
  // filter frequency between the two calls recreates that without extra scheduling.
  const isTick = tickIsTock;
  tickIsTock = !tickIsTock;

  const filterFrequency = isTick
    ? (urgent ? 3400 : 3000)
    : (urgent ? 2500 : 2100);
  const peakGain = urgent ? 0.5 : 0.32;
  const duration = urgent ? 0.035 : 0.045;

  playClickAt(ctx, time, { filterFrequency, peakGain, duration });
}

function startTickingClock(getSecondsLeft, urgentThreshold) {
  stopTickingClock();
  const ctx = getAudioContext();
  if (!ctx) return;

  tickIsTock = false;
  const myGeneration = ++tickGeneration;
  let nextTickTime = ctx.currentTime;

  const pollLoop = () => {
    if (myGeneration !== tickGeneration) return;

    const secondsLeft = getSecondsLeft();
    if (!(secondsLeft > 0)) {
      stopTickingClock();
      return;
    }

    const urgent = secondsLeft <= urgentThreshold;
    const interval = urgent ? 0.5 : 1.0;

    while (nextTickTime < ctx.currentTime + TICK_LOOKAHEAD_SEC) {
      scheduleTickAt(ctx, nextTickTime, urgent);
      nextTickTime += interval;
    }

    tickPollId = setTimeout(pollLoop, TICK_POLL_MS);
  };

  pollLoop();
}

function stopTickingClock() {
  tickGeneration += 1;
  if (tickPollId) {
    clearTimeout(tickPollId);
    tickPollId = null;
  }
}
