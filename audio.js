// ===== AUDIO SYSTEM =====
// All sound and audio generation functions

let audioCtx = null;
let tractorOsc = null;
let tractorGain = null;

function initAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();
}

function playTone(startFreq, endFreq, duration, type) {
  try {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(startFreq, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(Math.max(endFreq, 1), audioCtx.currentTime + duration);
    gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch (e) {}
}

function startTractorHum() {
  if (!audioCtx || tractorOsc) return;
  try {
    tractorOsc = audioCtx.createOscillator();
    tractorGain = audioCtx.createGain();
    tractorOsc.type = 'sine';
    tractorOsc.frequency.value = 85;
    tractorGain.gain.setValueAtTime(0.0, audioCtx.currentTime);
    tractorGain.gain.linearRampToValueAtTime(0.10, audioCtx.currentTime + 0.1);
    tractorOsc.connect(tractorGain);
    tractorGain.connect(audioCtx.destination);
    tractorOsc.start();
  } catch (e) {}
}

function stopTractorHum() {
  if (tractorOsc && tractorGain) {
    try {
      tractorGain.gain.linearRampToValueAtTime(0.0, audioCtx.currentTime + 0.1);
      tractorOsc.stop(audioCtx.currentTime + 0.15);
      tractorOsc = null;
    } catch (e) {}
  }
}

function sndLaser(tier) {
  const types = ['sine', 'triangle', 'square', 'sawtooth'];
  const wType = types[Math.min(Math.floor((tier - 1) / 5), 3)];
  playTone(Math.max(200, 1200 - (tier * 60)), Math.max(50, 400 - (tier * 20)), 0.12, wType);
}

function sndExplosion() { playTone(250, 30, 0.5, 'sawtooth'); }
function sndStun() { playTone(800, 600, 0.1, 'sine'); setTimeout(() => playTone(600, 400, 0.1, 'sine'), 100); }
function sndHit() { playTone(400, 200, 0.1, 'square'); }
function sndAbductCow() { playTone(300, 800, 0.2, 'sine'); }
function sndAbductPig() { playTone(400, 1000, 0.2, 'triangle'); }
function sndAbductFarmer() { playTone(500, 1200, 0.25, 'square'); }
function sndDamage() { playTone(200, 60, 0.15, 'square'); }
function sndPowerup() { playTone(600, 1400, 0.25, 'triangle'); }
function sndTick() { playTone(800, 400, 0.1, 'sine'); }
function sndMothership() { playTone(150, 50, 2.0, 'sawtooth'); }
function sndRecharge() { playTone(100, 1000, 1.2, 'sine'); }

function sndLevelUpJingle() {
  try {
    if (!audioCtx) return;
    const notes = [300, 450, 600, 900, 1200];
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.4);
      }, idx * 120);
    });
  } catch (e) {}
}
