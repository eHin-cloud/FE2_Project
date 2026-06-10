// ==========================================================================
// AUDIO SYNTHESIZER UTILITIES (SCI-FI FX ENGINE)
// ==========================================================================
let audioCtx;
let chargingOsc, chargingLFO, chargingGain;
let starfieldSpeedMultiplier = 1.0;
let transitionLoadingActive = false;
let isWarping = false;
let uiBeepAudio = null;
let portalWarpAudio = null;
let lastMenuHoverSoundAt = 0;

// Clean up legacy space state caches to ensure a fresh session on load
localStorage.removeItem("gameNodePositions");
localStorage.removeItem("visitedNodes");

// ==========================================================================
// BACKGROUND MUSIC PLAYER (freefai1.mp3)
// ==========================================================================
let bgMusic = null;
let isAudioMuted = false; // Enabled by default for autoplay in 3D

function initBgMusic() {
  if (!bgMusic) {
    bgMusic = new Audio('./img/freefai1.mp3');
    bgMusic.loop = true;
    bgMusic.volume = 0.12; // Soft background ambient level
    bgMusic.muted = isAudioMuted;
  }
}

function initSciFiSfx() {
  if (!uiBeepAudio) {
    uiBeepAudio = new Audio('./img/beep.mp3');
    uiBeepAudio.preload = 'auto';
    uiBeepAudio.volume = 0.24;
    uiBeepAudio.muted = false;
  }
  if (!portalWarpAudio) {
    portalWarpAudio = new Audio('./img/warp.mp3');
    portalWarpAudio.preload = 'auto';
    portalWarpAudio.volume = 0.6;
    portalWarpAudio.muted = false;
  }
}

function playBgMusic() {
  initBgMusic();
  if (bgMusic) {
    bgMusic.muted = isAudioMuted;
    if (!isAudioMuted) {
      bgMusic.play().catch(err => {
        console.warn("Background music autoplay was blocked:", err);
      });
    }
  }
}

function stopBgMusic() {
  if (bgMusic) {
    bgMusic.pause();
    bgMusic.currentTime = 0;
  }
}

function updateSoundToggleButtonUI() {
  const soundText2D = document.getElementById("sound-text");
  const soundIcon2D = document.getElementById("sound-toggle-icon");
  const soundText3D = document.getElementById("game-sound-text");
  const soundIcon3D = document.getElementById("game-sound-toggle-icon");
  const isVi = (currentLang === "vi");

  if (isAudioMuted) {
    if (soundText2D) {
      soundText2D.innerText = isVi ? "ÂM THANH: TẮT" : "AUDIO: OFF";
      soundText2D.setAttribute("data-vi", "ÂM THANH: TẮT");
      soundText2D.setAttribute("data-en", "AUDIO: OFF");
    }
    if (soundIcon2D) {
      soundIcon2D.className = "fa-solid fa-volume-xmark text-[10px]";
    }
    if (soundText3D) {
      soundText3D.innerText = isVi ? "ÂM THANH: TẮT" : "AUDIO: OFF";
      soundText3D.setAttribute("data-vi", "ÂM THANH: TẮT");
      soundText3D.setAttribute("data-en", "AUDIO: OFF");
    }
    if (soundIcon3D) {
      soundIcon3D.className = "fa-solid fa-volume-xmark text-[10px]";
    }
  } else {
    if (soundText2D) {
      soundText2D.innerText = isVi ? "ÂM THANH: BẬT" : "AUDIO: ON";
      soundText2D.setAttribute("data-vi", "ÂM THANH: BẬT");
      soundText2D.setAttribute("data-en", "AUDIO: ON");
    }
    if (soundIcon2D) {
      soundIcon2D.className = "fa-solid fa-volume-high text-[10px]";
    }
    if (soundText3D) {
      soundText3D.innerText = isVi ? "ÂM THANH: BẬT" : "AUDIO: ON";
      soundText3D.setAttribute("data-vi", "ÂM THANH: BẬT");
      soundText3D.setAttribute("data-en", "AUDIO: ON");
    }
    if (soundIcon3D) {
      soundIcon3D.className = "fa-solid fa-volume-high text-[10px]";
    }
  }
}

function toggleAudio() {
  isAudioMuted = !isAudioMuted;
  
  if (isAudioMuted) {
    if (bgMusic) {
      bgMusic.muted = true;
      bgMusic.pause();
    }
  } else {
    if (bgMusic) {
      bgMusic.muted = false;
      if (is3DMode) {
        bgMusic.play().catch(err => console.warn(err));
      }
    }
    
    try {
      if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
    } catch(e) {}
    
    if (is3DMode) {
      playBgMusic();
    } else {
      playBeep(880, 0.08, "sine", 0.03);
    }
  }
  
  updateSoundToggleButtonUI();
}

function setupAudioToggle() {
  const soundBtn2D = document.getElementById("sound-toggle-btn");
  const soundBtn3D = document.getElementById("game-sound-toggle-btn");

  if (soundBtn2D) {
    soundBtn2D.addEventListener("click", () => {
      toggleAudio();
    });
  }

  if (soundBtn3D) {
    soundBtn3D.addEventListener("click", () => {
      toggleAudio();
    });
  }

  updateSoundToggleButtonUI();
}

function playAudioFile(audio, fallback) {
  initSciFiSfx();
  if (!audio) {
    if (typeof fallback === "function") fallback();
    return;
  }

  try {
    const sound = audio.cloneNode();
    sound.volume = audio.volume;
    sound.muted = false;
    sound.play().catch(() => {
      if (typeof fallback === "function") fallback();
    });
  } catch (e) {
    if (typeof fallback === "function") fallback();
  }
}

function playMenuHoverSound() {
  const now = performance.now();
  if (now - lastMenuHoverSoundAt < 90) return;
  lastMenuHoverSoundAt = now;

  initSciFiSfx();
  playAudioFile(uiBeepAudio, () => playBeep(960, 0.035, "sine", 0.018));
}

function playPortalWarpSound() {
  initSciFiSfx();
  playAudioFile(portalWarpAudio, () => {
    playBeep(180, 0.12, "sawtooth", 0.04);
    setTimeout(() => playBeep(420, 0.12, "triangle", 0.035), 80);
    setTimeout(() => playBeep(900, 0.16, "sine", 0.035), 190);
    setTimeout(() => playBeep(1500, 0.2, "sine", 0.025), 330);
  });
}

function playWhooshSound() {
  if (isAudioMuted) return;
  try {
    initAudio();
    if (!audioCtx) return;
    const time = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    const filter = audioCtx.createBiquadFilter();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(80, time);
    osc.frequency.exponentialRampToValueAtTime(800, time + 0.35);

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(200, time);
    filter.frequency.exponentialRampToValueAtTime(1800, time + 0.3);

    gain.gain.setValueAtTime(0.01, time);
    gain.gain.exponentialRampToValueAtTime(0.03, time + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.00001, time + 0.4);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start(time);
    osc.stop(time + 0.4);
  } catch (e) {
    console.warn("Whoosh sound failed:", e);
  }
}

function pause2DParticleLoopForTransition() {
  // Placeholder: pause/dispose any 2D canvas particle RAF or interval here before the 3D scene starts.
}

function init3DSpacePortfolio() {
  if (typeof initGame3D === "function") {
    initGame3D();
  }
}

function initAudio() {
  console.log("initAudio called. Current state:", audioCtx ? audioCtx.state : "uninitialized");
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    console.log("AudioContext created. State:", audioCtx.state);
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().then(() => {
      console.log("AudioContext resumed successfully. State:", audioCtx.state);
    });
  }
}

function playBeep(freq = 440, duration = 0.1, type = 'sine', volume = 0.05) {
  try {
    initAudio();
    if (!audioCtx) return;
    console.log(`playBeep: freq=${freq}, duration=${duration}, type=${type}, volume=${volume}`);
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

    gain.gain.setValueAtTime(volume, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + duration);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch (e) {
    console.warn("Audio playback context failed: ", e);
  }
}

function startChargingHum() {
  if (isAudioMuted) return;
  try {
    initAudio();
    if (!audioCtx) return;
    chargingOsc = audioCtx.createOscillator();
    chargingLFO = audioCtx.createOscillator();
    chargingGain = audioCtx.createGain();
    const lfoGain = audioCtx.createGain();

    chargingOsc.type = 'sawtooth';
    chargingOsc.frequency.setValueAtTime(60, audioCtx.currentTime);

    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(150, audioCtx.currentTime);

    chargingLFO.type = 'sine';
    chargingLFO.frequency.setValueAtTime(8, audioCtx.currentTime);

    lfoGain.gain.setValueAtTime(15, audioCtx.currentTime);

    chargingGain.gain.setValueAtTime(0.01, audioCtx.currentTime);

    chargingLFO.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    chargingOsc.connect(filter);
    filter.connect(chargingGain);
    chargingGain.connect(audioCtx.destination);

    chargingOsc.start();
    chargingLFO.start();
  } catch (e) {
    console.warn("Charging hum failed: ", e);
  }
}

function updateChargingHum(progress) {
  if (!chargingOsc || !chargingGain) return;
  try {
    const currentFreq = 60 + (progress / 100) * 260;
    chargingOsc.frequency.setTargetAtTime(currentFreq, audioCtx.currentTime, 0.05);

    const currentVol = 0.01 + (progress / 100) * 0.02;
    chargingGain.gain.setTargetAtTime(currentVol, audioCtx.currentTime, 0.05);
  } catch (e) { }
}

function stopChargingHum() {
  try {
    if (chargingOsc) {
      chargingGain.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 0.3);
      setTimeout(() => {
        chargingOsc.stop();
        chargingLFO.stop();
      }, 350);
    }
  } catch (e) { }
}

function playSuccessChime() {
  playBeep(330, 0.1, 'sine', 0.05);
  setTimeout(() => playBeep(440, 0.1, 'sine', 0.05), 80);
  setTimeout(() => playBeep(554.37, 0.1, 'sine', 0.05), 160);
  setTimeout(() => playBeep(659.25, 0.15, 'sine', 0.05), 240);
  setTimeout(() => {
    playBeep(880, 0.3, 'sine', 0.04);
    playBeep(1320, 0.4, 'sine', 0.02);
  }, 320);
}

let lastBeepTime = 0;
function playInterfaceClick() {
  const now = Date.now();
  if (now - lastBeepTime > 100) {
    playBeep(1000, 0.05, 'sine', 0.015);
    lastBeepTime = now;
  }
}

function playDataTelemetryNoise() {
  if (!audioCtx || audioCtx.state === 'suspended') return;
  try {
    const time = audioCtx.currentTime;

    // Create a tiny bandpass filtered white noise burst for data packets
    const bufferSize = audioCtx.sampleRate * 0.02; // 20ms burst
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noiseNode = audioCtx.createBufferSource();
    noiseNode.buffer = buffer;

    const filter = audioCtx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1000 + Math.random() * 3000, time);
    filter.Q.setValueAtTime(5, time);

    const gainNode = audioCtx.createGain();
    gainNode.gain.setValueAtTime(0.005, time);
    gainNode.gain.exponentialRampToValueAtTime(0.00001, time + 0.02);

    noiseNode.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    noiseNode.start(time);

    // High-tech sweeps/blips
    const osc = audioCtx.createOscillator();
    const oscGain = audioCtx.createGain();

    osc.type = 'sine';
    const baseFreq = 1200 + Math.random() * 1800;
    osc.frequency.setValueAtTime(baseFreq, time);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, time + 0.03);

    oscGain.gain.setValueAtTime(0.008, time);
    oscGain.gain.exponentialRampToValueAtTime(0.00001, time + 0.03);

    osc.connect(oscGain);
    oscGain.connect(audioCtx.destination);

    osc.start(time);
    osc.stop(time + 0.03);
  } catch (e) { }
}

function playScrambleChirp() {
  if (!audioCtx || audioCtx.state === 'suspended') return;
  try {
    const time = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    // Use a very high-pitched triangle blip for micro CPU tickers
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(2200 + Math.random() * 800, time);

    gain.gain.setValueAtTime(0.003, time); // low volume so it is pleasant and not loud
    gain.gain.exponentialRampToValueAtTime(0.00001, time + 0.015);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start(time);
    osc.stop(time + 0.015);
  } catch (e) { }
}

let currentDuckTimeout = null;

function duckBgMusic(targetVolume = 0.03, duration = 3000) {
  if (!bgMusic || isAudioMuted) return;
  
  // Transition volume down instantly
  bgMusic.volume = targetVolume;
  
  if (currentDuckTimeout) clearTimeout(currentDuckTimeout);
  
  // Restore volume after duration
  currentDuckTimeout = setTimeout(() => {
    if (bgMusic && !isAudioMuted) {
      bgMusic.volume = 0.12; // original volume
    }
  }, duration);
}

function playLaserShootSound() {
  try {
    initAudio();
    if (!audioCtx || audioCtx.state === 'suspended') return;
    
    // Duck music during laser fire
    duckBgMusic(0.03, 1800);

    const time = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const osc2 = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    const filter = audioCtx.createBiquadFilter();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(880, time);
    osc.frequency.exponentialRampToValueAtTime(110, time + 0.4);

    osc2.type = "triangle";
    osc2.frequency.setValueAtTime(880, time);
    osc2.frequency.exponentialRampToValueAtTime(80, time + 0.45);

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(2000, time);
    filter.frequency.exponentialRampToValueAtTime(400, time + 0.4);

    gainNode.gain.setValueAtTime(0.08, time);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, time + 0.45);

    osc.connect(filter);
    osc2.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    osc.start(time);
    osc2.start(time);
    osc.stop(time + 0.5);
    osc2.stop(time + 0.5);
  } catch (e) {
    console.warn("Laser sound failed:", e);
  }
}

function playExplosionSound() {
  try {
    initAudio();
    if (!audioCtx || audioCtx.state === 'suspended') return;
    
    // Duck music deeply for explosion
    duckBgMusic(0.01, 3800);

    const time = audioCtx.currentTime;

    // 1. Core \"ĐÙNG\" Shockwave (Triangle wave for grit/punch)
    const oscBoom = audioCtx.createOscillator();
    const boomGain = audioCtx.createGain();
    oscBoom.type = "triangle";
    oscBoom.frequency.setValueAtTime(120, time);
    oscBoom.frequency.exponentialRampToValueAtTime(10, time + 0.5);

    boomGain.gain.setValueAtTime(1.2, time);
    boomGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.5);

    oscBoom.connect(boomGain);
    boomGain.connect(audioCtx.destination);
    oscBoom.start(time);
    oscBoom.stop(time + 0.5);

    // 2. Sub-bass rumble (Sine wave for low-end body)
    const oscSub = audioCtx.createOscillator();
    const subGain = audioCtx.createGain();
    oscSub.type = "sine";
    oscSub.frequency.setValueAtTime(80, time);
    oscSub.frequency.linearRampToValueAtTime(20, time + 0.8);

    subGain.gain.setValueAtTime(0.8, time);
    subGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.8);

    oscSub.connect(subGain);
    subGain.connect(audioCtx.destination);
    oscSub.start(time);
    oscSub.stop(time + 0.8);

    // 3. White noise debris explosion (massive blast & crackle)
    const bufferSize = audioCtx.sampleRate * 2.5; // 2.5 seconds rumble
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noiseNode = audioCtx.createBufferSource();
    noiseNode.buffer = buffer;

    // Lowpass filter for deep explosion rumble
    const lowpass = audioCtx.createBiquadFilter();
    lowpass.type = "lowpass";
    lowpass.frequency.setValueAtTime(500, time);
    lowpass.frequency.exponentialRampToValueAtTime(15, time + 2.2);

    const noiseGain = audioCtx.createGain();
    noiseGain.gain.setValueAtTime(0.9, time);
    noiseGain.gain.linearRampToValueAtTime(0.3, time + 0.3);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, time + 2.4);

    noiseNode.connect(lowpass);
    lowpass.connect(noiseGain);
    noiseGain.connect(audioCtx.destination);

    // Bandpass filter for physical "shattering/cracking" debris textures
    const bandpass = audioCtx.createBiquadFilter();
    bandpass.type = "bandpass";
    bandpass.frequency.setValueAtTime(1000, time);
    bandpass.frequency.exponentialRampToValueAtTime(80, time + 0.6);
    bandpass.Q.setValueAtTime(3, time);

    const bandpassGain = audioCtx.createGain();
    bandpassGain.gain.setValueAtTime(0.5, time);
    bandpassGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.6);

    noiseNode.connect(bandpass);
    bandpass.connect(bandpassGain);
    bandpassGain.connect(audioCtx.destination);

    noiseNode.start(time);
    noiseNode.stop(time + 2.5);
  } catch (e) {
    console.warn("Explosion sound failed:", e);
  }
}


// Scramble characters for sci-fi decoding effect
function scrambleString(str, ratio) {
  const chars = "!@#$%" + "^&*()_+~`|}{[]:;?><,./-=";
  let result = "";
  for (let i = 0; i < str.length; i++) {
    if (str[i] === " ") {
      result += " ";
      continue;
    }
    const threshold = i / str.length;
    if (ratio > threshold) {
      result += str[i];
    } else {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
  }
  return result;
}

// ==========================================================================
// BOOTLOADER ANIMATOR
// ==========================================================================
function startBootloader() {
  const steps = [
    { text: "ESTABLISHING NEURAL LINK TO SPACE STATION...", weight: 12 },
    { text: "INITIATING GRAVITATIONAL SINGULARITY COMPENSATORS...", weight: 13 },
    { text: "WARMING UP FUSION REACTOR ENERGY CORE...", weight: 15 },
    { text: "MAPPING DEEP SPACE GALAXY PLANET COORDINATES...", weight: 15 },
    { text: "CALIBRATING SAFETY RUNWAY ENERGY FLOW BEACONS...", weight: 15 },
    { text: "ESTABLISHING ENCRYPTED TELEMETRY TO ORBITING APEX DRONE...", weight: 15 },
    { text: "STATION BOOT NOMINAL. CORE IS STABLE. READY TO BOARD.", weight: 15 }
  ];

  const statusPercent = document.getElementById("loader-percentage");
  const progressBar = document.getElementById("loader-progress-bar");
  const logTerminal = document.getElementById("loader-terminal-logs");
  const overlay = document.getElementById("bootloader-overlay");
  const startBtn = document.getElementById("loader-start-btn");

  let progress = 0;
  let activeStep = 0;
  let lastActiveStep = 0;

  // Initialize live clocks & hex hash generator
  const clockEl = document.getElementById("loader-time");
  if (clockEl) {
    const updateClock = () => {
      const now = new Date();
      const pad = (n) => String(n).padStart(2, '0');
      clockEl.textContent = `SYS_CLOCK: ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    };
    updateClock();
    setInterval(updateClock, 1000);
  }

  const matrixEl = document.getElementById("loader-matrix");
  if (matrixEl) {
    const updateMatrix = () => {
      const chars = "0123456789ABCDEF";
      let hex = "HASH: 0x";
      for (let i = 0; i < 12; i++) {
        hex += chars[Math.floor(Math.random() * chars.length)];
      }
      matrixEl.textContent = hex;
    };
    setInterval(updateMatrix, 150);
  }

  // Initialize welcome message in the console
  if (logTerminal) {
    if (window.location.protocol === 'file:') {
      logTerminal.innerHTML = `
        <div class="text-amber-500 font-mono text-xs mb-3 border border-amber-500/20 bg-amber-500/5 p-3 rounded-lg text-center tracking-wide font-bold uppercase">
          ▲ LỖI BẢO MẬT: Bạn đang mở bằng file://. Trình duyệt chặn âm thanh. Hãy mở qua địa chỉ: http://127.0.0.1:8080 ▲
        </div>
      `;
    }
  }

  // Try to play sound immediately (works if browser autoplay policy allows it)
  try {
    initAudio();
    startChargingHum();
  } catch (e) { }

  // Interaction fallback to unlock/resume audio as soon as the user hovers or interacts
  const initEvents = ['click', 'mousedown', 'keydown', 'touchstart', 'mousemove', 'pointerdown'];
  const unlockAudio = () => {
    initAudio();
    startChargingHum();
    initEvents.forEach(evt => document.removeEventListener(evt, unlockAudio));
  };
  initEvents.forEach(evt => document.addEventListener(evt, unlockAudio, { once: true }));

  // Start loader progress automatically on load
  setTimeout(tick, 300);

  function tick() {
    progress++;

    // Update Percentage & Progress Bar HUD
    if (statusPercent) statusPercent.textContent = `${progress}%`;
    if (progressBar) progressBar.style.width = `${progress}%`;

    // Update warp drive audio frequency
    updateChargingHum(progress);

    // Check step status
    let sum = 0;
    for (let i = 0; i < steps.length; i++) {
      sum += steps[i].weight;
      if (progress <= sum) {
        activeStep = i;
        break;
      }
    }

    // Play a distinct beep when a new step checkmark appears
    if (activeStep > lastActiveStep) {
      playBeep(1200, 0.08, 'sine', 0.025); // Checkmark confirmation chime
      lastActiveStep = activeStep;
    }

    // Scramble active step based on progress within its weight
    let stepStart = 0;
    for (let i = 0; i < activeStep; i++) {
      stepStart += steps[i].weight;
    }
    const stepWeight = steps[activeStep]?.weight || 1;
    const stepRatio = (progress - stepStart) / stepWeight;
    const scrambledText = scrambleString(steps[activeStep]?.text || "FINALIZING...", stepRatio);

    // Play micro scramble chirp on every scramble tick (for typewriter noise)
    playScrambleChirp();

    // Play data telemetry sweeps/bursts every few ticks
    if (progress % 4 === 0) {
      playDataTelemetryNoise();
    }

    // Write Terminal Logs with sci-fi decoding effect
    if (logTerminal) {
      let html = '';
      for (let i = 0; i < activeStep; i++) {
        html += `<div class="text-[#888] font-mono text-xs mb-1">✔ ${steps[i].text}</div>`;
      }

      html += `
        <div class="text-cyan-400 font-mono text-xs mb-1 flex items-center gap-2">
          <svg class="animate-spin w-3 h-3 text-cyan-400" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          ${scrambledText}
        </div>
      `;
      logTerminal.innerHTML = html;
      logTerminal.scrollTop = logTerminal.scrollHeight; // Auto-scroll
    }

    // Update single-line status bar for minimal HUD mode
    const statusTextEl = document.getElementById("loader-status-text");
    if (statusTextEl) {
      statusTextEl.textContent = scrambledText;
    }

    if (progress < 100) {
      setTimeout(tick, 20); // slightly slower tick for better text appreciation
    } else {
      // Completed loading
      stopChargingHum();
      playSuccessChime();

      // Show Start Button
      const chargingCore = document.getElementById("loader-core-charging");
      if (chargingCore) {
        chargingCore.classList.add("hidden");
      }
      if (startBtn) {
        startBtn.classList.remove("hidden");
        startBtn.addEventListener("click", () => {
          playBeep(880, 0.15, 'triangle', 0.08);

          // Fade out the diagnostic card or HUD container
          const bootloaderCard = document.getElementById("bootloader-card") || document.getElementById("bootloader-hud");
          if (bootloaderCard) {
            bootloaderCard.style.opacity = '0';
          }

          // Set overlay background to transparent so we see the stars behind it
          if (overlay) {
            overlay.style.backgroundColor = 'transparent';
          }

          // Accelerate background stars to warp speed!
          starfieldSpeedMultiplier = 20.0;

          setTimeout(() => {
            // Dismiss bootloader overlay screen completely
            if (overlay) {
              overlay.style.opacity = '0';
              setTimeout(() => {
                overlay.remove();
                // Reset background starfield speed
                starfieldSpeedMultiplier = 1.0;
              }, 500);
            }

            // Trigger animations inside site
            startSiteAnimations();
            isBootFinished = true;

            // Show chatbot toggle button after entering
            const chatbotToggle = document.getElementById("chatbot-toggle");
            if (chatbotToggle) {
              updateChatbotVisibility();
            }

            // Trigger appropriate view mode transitions
            if (typeof setupViewModeToggle === 'function') {
              const btn = document.getElementById("view-mode-btn");
              if (btn) {
                const mainContent = document.getElementById("main-content");
                const gameContainer = document.getElementById("game-container");
                const canvasBg = document.getElementById("canvas-bg");

                if (is3DMode && mainContent && gameContainer && canvasBg) {
                  syncViewModeText();
                  const mainNav = document.getElementById("main-nav");
                  if (mainNav) mainNav.classList.add("hidden");

                  mainContent.classList.add("hidden");
                  gameContainer.classList.remove("hidden");
                  canvasBg.style.display = "none";
                  initGame3D();
                  triggerSpaceTransition();
                } else if (!is3DMode && mainContent && canvasBg) {
                  syncViewModeText();
                  const mainNav = document.getElementById("main-nav");
                  if (mainNav) mainNav.classList.remove("hidden");
                  mainContent.classList.remove("hidden");
                  canvasBg.style.display = "block";
                }
              }
            }
          }, 1200); // 1.2s of warp speed intro flight
        });
      }
    }
  };

  setTimeout(tick, 300);
}

// ==========================================================================
// LANGUAGE TRANSLATION & TYPING EFFECT
// ==========================================================================
let currentLang = localStorage.getItem("portfolio-lang") || "vi";
let typingTimeoutId = null;

function syncViewModeText() {
  const viewModeText = document.getElementById("view-mode-text");
  if (!viewModeText) return;

  const viText = "🎮 KHÔNG GIAN 3D";
  const enText = "🎮 3D WORKSPACE";

  viewModeText.setAttribute("data-vi", viText);
  viewModeText.setAttribute("data-en", enText);
  viewModeText.textContent = currentLang === "vi" ? viText : enText;
}

function updateLanguageUI() {
  // Update toggle button text
  const langTexts = [
    document.getElementById("lang-text"),
    document.getElementById("game-lang-text")
  ].filter(Boolean);
  langTexts.forEach(el => {
    el.textContent = currentLang.toUpperCase();
  });

  if (typeof updateSoundToggleButtonUI === "function") {
    updateSoundToggleButtonUI();
  }

  // Update elements with data-vi and data-en
  const translatableElements = document.querySelectorAll("[data-vi][data-en]");
  translatableElements.forEach(el => {
    const text = currentLang === "vi" ? el.getAttribute("data-vi") : el.getAttribute("data-en");
    el.textContent = text;
    if (el.hasAttribute("data-text-vi") && el.hasAttribute("data-text-en")) {
      el.setAttribute("data-text", currentLang === "vi" ? el.getAttribute("data-text-vi") : el.getAttribute("data-text-en"));
    }
  });

  // Update view mode toggle text based on current mode, not stale translated attributes
  syncViewModeText();

  if (typeof updateGameLanguageUI === "function") {
    updateGameLanguageUI();
  }

  // Update placeholders
  const placeholderElements = document.querySelectorAll("[data-vi-placeholder][data-en-placeholder]");
  placeholderElements.forEach(el => {
    const placeholder = currentLang === "vi" ? el.getAttribute("data-vi-placeholder") : el.getAttribute("data-en-placeholder");
    el.setAttribute("placeholder", placeholder);
  });

  // Re-trigger typing effect ONLY if bootloader has already been dismissed
  const overlay = document.getElementById("bootloader-overlay");
  if (!overlay) {
    triggerTypingEffect();
  }
}

function togglePortfolioLanguage() {
  currentLang = currentLang === "vi" ? "en" : "vi";
  localStorage.setItem("portfolio-lang", currentLang);
  updateLanguageUI();
  if (typeof playBeep === "function") {
    playBeep(900, 0.08, 'sine', 0.02);
  }
}

function triggerTypingEffect() {
  const target = document.getElementById("typing-desc");
  if (!target) return;

  if (typingTimeoutId) {
    clearTimeout(typingTimeoutId);
  }

  const texts = {
    vi: "Là sinh viên trường Cao đẳng Công nghệ Thủ Đức (TDC), tôi thiết kế trang web này như một sự kết hợp độc đáo giữa giao diện website truyền thống và vũ trụ 3D tương tác. Hãy nhấn vào vết nứt Cổng Không Gian ở phía dưới để cất cánh bay lượn khám phá các hành tinh, hoặc cuộn chuột xuống để tiếp tục xem dạng website thông thường.",
    en: "As a student at Thu Duc College of Technology (TDC), I designed this website as a unique combination of a traditional web interface and an interactive 3D space cosmos. Click the Space Portal crack below to take off and explore the planets, or scroll down to view it as a standard website."
  };

  const text = texts[currentLang] || texts.vi;
  target.textContent = "";
  let i = 0;
  const type = () => {
    if (i < text.length) {
      target.textContent += text.charAt(i);
      i++;
      typingTimeoutId = setTimeout(type, 25);
    }
  };
  typingTimeoutId = setTimeout(type, 500);
}

// ==========================================================================
// SCROLL TIMELINE ANIMATION
// ==========================================================================
function setupTimelineScrollTrigger() {
  const items = document.querySelectorAll(".timeline-item");
  const observerOptions = {
    root: null,
    rootMargin: "0px",
    threshold: 0.3
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("active");
        entry.target.querySelector(".timeline-content").style.opacity = "1";
        entry.target.querySelector(".timeline-content").style.transform = "translateY(0)";
      }
    });
  }, observerOptions);

  items.forEach(item => {
    const content = item.querySelector(".timeline-content");
    if (content) {
      content.style.opacity = "0";
      content.style.transform = "translateY(20px)";
      content.style.transition = "all 0.5s ease-out";
    }
    observer.observe(item);
  });
}

function setupScrollRevealAnimations() {
  const mainContent = document.getElementById("main-content");
  if (!mainContent || mainContent.dataset.revealBound === "true") return;
  mainContent.dataset.revealBound = "true";

  const revealSelectors = [
    "#about > div",
    "#about .glass-panel",
    "#skills .max-w-7xl > div",
    "#skills .grid > div",
    "#experience .text-center",
    "#experience .timeline-item",
    "#projects > div:first-child",
    "#projects .grid > div",
    "#testimonials > div",
    "#testimonials .grid > div",
    "#contact .grid > div"
  ];

  const revealEls = Array.from(mainContent.querySelectorAll(revealSelectors.join(",")))
    .filter(el => !el.closest("#hero") && !el.classList.contains("scroll-reveal"));

  revealEls.forEach((el, index) => {
    el.classList.add("scroll-reveal");
    el.style.setProperty("--reveal-delay", `${Math.min(index % 4, 3) * 90}ms`);
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, {
    root: null,
    rootMargin: "0px 0px -8% 0px",
    threshold: 0.12
  });

  revealEls.forEach(el => observer.observe(el));
}

// ==========================================================================
// THREE.JS GRAPHICS ENGINES
// ==========================================================================
let mouseX = 0, mouseY = 0;
window.addEventListener("mousemove", (e) => {
  mouseX = (e.clientX - window.innerWidth / 2) / 100;
  mouseY = (e.clientY - window.innerHeight / 2) / 100;
});

// 1. Starfield Particle Engine
function initStarfieldBackground() {
  const canvas = document.getElementById("canvas-bg");
  if (!canvas) return;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);
  camera.position.z = 100;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // Particles
  const count = 2000;
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);

  for (let i = 0; i < count * 3; i += 3) {
    // Spatial positioning
    positions[i] = (Math.random() - 0.5) * 600;
    positions[i + 1] = (Math.random() - 0.5) * 600;
    positions[i + 2] = (Math.random() - 0.5) * 400;

    // Harmonious violet/cyan colors
    colors[i] = 0.5 + Math.random() * 0.3; // R
    colors[i + 1] = 0.4 + Math.random() * 0.2; // G
    colors[i + 2] = 0.9 + Math.random() * 0.1; // B
  }

  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: 2.0,
    vertexColors: true,
    transparent: true,
    opacity: 0.8,
    sizeAttenuation: true
  });

  const starField = new THREE.Points(geometry, material);
  scene.add(starField);

  // 3D Space Lights for Planets
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.1);
  scene.add(ambientLight);

  const dirLight1 = new THREE.DirectionalLight(0x06b6d4, 2.5); // Cyan light
  dirLight1.position.set(200, 150, 150);
  scene.add(dirLight1);

  const dirLight2 = new THREE.DirectionalLight(0xa855f7, 1.8); // Purple light
  dirLight2.position.set(-200, -150, 100);
  scene.add(dirLight2);

  // PLANET 1: Ice Gas Giant with Rings (Right Side)
  const planet1Group = new THREE.Group();
  planet1Group.position.set(130, 50, -150);
  scene.add(planet1Group);

  const planet1CoreGeom = new THREE.SphereGeometry(28, 32, 32);
  const planet1CoreMat = new THREE.MeshPhongMaterial({
    color: 0x020617,
    emissive: 0x063a46,
    emissiveIntensity: 0.45,
    shininess: 80,
    bumpScale: 0.05
  });
  const planet1Core = new THREE.Mesh(planet1CoreGeom, planet1CoreMat);
  planet1Group.add(planet1Core);

  const planet1ShellGeom = new THREE.SphereGeometry(28.5, 32, 32);
  const planet1ShellMat = new THREE.MeshPhongMaterial({
    color: 0x06b6d4,
    emissive: 0x06b6d4,
    emissiveIntensity: 0.35,
    wireframe: true,
    transparent: true,
    opacity: 0.25
  });
  const planet1Shell = new THREE.Mesh(planet1ShellGeom, planet1ShellMat);
  planet1Group.add(planet1Shell);

  // Rings
  const planet1RingGeom = new THREE.RingGeometry(34, 52, 64);
  const planet1RingMat = new THREE.MeshBasicMaterial({
    color: 0x06b6d4,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.18,
    wireframe: true
  });
  const planet1Ring = new THREE.Mesh(planet1RingGeom, planet1RingMat);
  planet1Ring.rotation.x = Math.PI / 2.2;
  planet1Ring.rotation.y = Math.PI / 8;
  planet1Group.add(planet1Ring);

  // PLANET 2: Purple Cyber Core (Left Side)
  const planet2Group = new THREE.Group();
  planet2Group.position.set(-100, -40, -100);
  scene.add(planet2Group);

  const planet2CoreGeom = new THREE.SphereGeometry(16, 32, 32);
  const planet2CoreMat = new THREE.MeshPhongMaterial({
    color: 0x0d0824,
    emissive: 0x3b1268,
    emissiveIntensity: 0.5,
    shininess: 60
  });
  const planet2Core = new THREE.Mesh(planet2CoreGeom, planet2CoreMat);
  planet2Group.add(planet2Core);

  const planet2ShellGeom = new THREE.SphereGeometry(16.4, 16, 16);
  const planet2ShellMat = new THREE.MeshPhongMaterial({
    color: 0xa855f7,
    emissive: 0xa855f7,
    emissiveIntensity: 0.35,
    wireframe: true,
    transparent: true,
    opacity: 0.3
  });
  const planet2Shell = new THREE.Mesh(planet2ShellGeom, planet2ShellMat);
  planet2Group.add(planet2Shell);

  // PLANET 3: Emerald Low-Poly Moon (Upper Left)
  const planet3Group = new THREE.Group();
  planet3Group.position.set(-60, 80, -200);
  scene.add(planet3Group);

  const planet3Geom = new THREE.IcosahedronGeometry(10, 1);
  const planet3Mat = new THREE.MeshPhongMaterial({
    color: 0x052e16,
    shininess: 40,
    flatShading: true
  });
  const planet3Core = new THREE.Mesh(planet3Geom, planet3Mat);
  planet3Group.add(planet3Core);

  const planet3ShellMat = new THREE.MeshBasicMaterial({
    color: 0x10b981,
    wireframe: true,
    transparent: true,
    opacity: 0.25
  });
  const planet3Shell = new THREE.Mesh(planet3Geom, planet3ShellMat);
  planet3Group.add(planet3Shell);

  // Resize Listener
  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // Loop
  const animate = () => {
    requestAnimationFrame(animate);

    // Move particles forward towards camera
    const pos = geometry.attributes.position.array;
    for (let i = 2; i < pos.length; i += 3) {
      const speed = (starfieldSpeedMultiplier > 1.0) ? (0.6 * starfieldSpeedMultiplier) : 0.4;
      pos[i] -= speed;
      if (pos[i] < -200) {
        pos[i] = 200;
        pos[i - 2] = (Math.random() - 0.5) * 600;
        pos[i - 1] = (Math.random() - 0.5) * 600;
      }
    }
    geometry.attributes.position.needsUpdate = true;

    // Drifting rotation animation (slight secondary rotation)
    starField.rotation.y += 0.0002;
    starField.rotation.x += 0.0001;

    // Rotate planets and shells
    if (planet1Group) {
      const time = Date.now() * 0.0005;
      const pulse = 0.5 + Math.sin(time * 2.6) * 0.5;
      planet1Core.rotation.y += 0.0022;
      planet1Core.rotation.x += 0.0004;
      planet1Shell.rotation.y += 0.0055;
      planet1Shell.rotation.x -= 0.0016;
      planet1Ring.rotation.z -= 0.0012;
      planet1Shell.material.opacity = 0.23 + pulse * 0.16;
      planet1Ring.material.opacity = 0.14 + pulse * 0.12;
      planet1Core.material.emissiveIntensity = 0.35 + pulse * 0.35;
      planet1Group.scale.setScalar(1 + pulse * 0.025);
      planet1Group.position.y = 50 + Math.sin(time) * 4;
    }
    if (planet2Group) {
      const time = Date.now() * 0.0007;
      const pulse = 0.5 + Math.sin(time * 2.9 + 1.4) * 0.5;
      planet2Core.rotation.y -= 0.0032;
      planet2Core.rotation.z += 0.0007;
      planet2Shell.rotation.x += 0.0045;
      planet2Shell.rotation.y -= 0.002;
      planet2Shell.material.opacity = 0.24 + pulse * 0.2;
      planet2Core.material.emissiveIntensity = 0.4 + pulse * 0.45;
      planet2Group.scale.setScalar(1 + pulse * 0.035);
      planet2Group.position.y = -40 + Math.sin(time) * 3;
    }
    if (planet3Group) {
      planet3Core.rotation.y += 0.002;
      planet3Shell.rotation.x -= 0.001;

      const time = Date.now() * 0.0004;
      planet3Group.position.y = 80 + Math.sin(time) * 2;
    }

    // Parallax mouse movements
    camera.position.x += (mouseX - camera.position.x) * 0.05;
    camera.position.y += (-mouseY - camera.position.y) * 0.05;
    camera.lookAt(scene.position);

    renderer.render(scene, camera);
  };

  animate();
}

// 2. Hero Interactive Mesh (Dodecahedron wireframe mesh)
function initHeroMesh() {
  const canvas = document.getElementById("canvas-hero-3d");
  if (!canvas) return;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
  camera.position.z = 8;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setSize(canvas.clientWidth, canvas.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // Lights
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
  scene.add(ambientLight);

  const dirLight1 = new THREE.DirectionalLight(0x915eff, 2.5);
  dirLight1.position.set(5, 5, 5);
  scene.add(dirLight1);

  const dirLight2 = new THREE.DirectionalLight(0x06b6d4, 1.5);
  dirLight2.position.set(-5, -5, 5);
  scene.add(dirLight2);

  // Geometry
  const geom = new THREE.IcosahedronGeometry(2.5, 1);
  const mat = new THREE.MeshPhongMaterial({
    color: 0x915eff,
    wireframe: true,
    transparent: true,
    opacity: 0.75,
    shininess: 100
  });

  const mesh = new THREE.Mesh(geom, mat);
  const outerWireGroup = new THREE.Group();
  outerWireGroup.add(mesh);
  scene.add(outerWireGroup);

  // Inner solid core
  const innerGeom = new THREE.IcosahedronGeometry(1.2, 0);
  const innerMat = new THREE.MeshPhongMaterial({
    color: 0x06b6d4,
    transparent: true,
    opacity: 0.8,
    shininess: 120
  });
  const innerMesh = new THREE.Mesh(innerGeom, innerMat);
  const innerCoreGroup = new THREE.Group();
  innerCoreGroup.add(innerMesh);
  scene.add(innerCoreGroup);

  // Resize handler for wrapper container
  const resize = () => {
    const w = canvas.parentElement.clientWidth;
    const h = canvas.parentElement.clientHeight || 400;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  window.addEventListener("resize", resize);
  resize();

  let lastFrameTime = performance.now();
  const animate = () => {
    requestAnimationFrame(animate);

    const now = performance.now();
    const delta = Math.min((now - lastFrameTime) / 16.6667, 2);
    lastFrameTime = now;

    // Outer wireframe sphere: slow, continuous orbit around Y.
    outerWireGroup.rotation.y += 0.006 * delta;
    outerWireGroup.rotation.x += 0.0018 * delta;

    // Inner cyan polyhedron: counter-rotates and tilts on X for depth.
    innerCoreGroup.rotation.y -= 0.009 * delta;
    innerCoreGroup.rotation.x += 0.006 * delta;
    innerMesh.rotation.z -= 0.0035 * delta;

    // Pulse core
    const scale = 1 + Math.sin(now * 0.002) * 0.15;
    innerMesh.scale.set(scale, scale, scale);

    renderer.render(scene, camera);
  };
  animate();
}

// 3. Contact Rotating Earth Globe
function initContactGlobe() {
  const canvas = document.getElementById("canvas-earth-3d");
  if (!canvas) return;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.z = 7.0; // Zoom out slightly to prevent edge clipping

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // Lights
  const dirLight1 = new THREE.DirectionalLight(0x915eff, 2.5);
  dirLight1.position.set(5, 3, 5);
  scene.add(dirLight1);

  const dirLight2 = new THREE.DirectionalLight(0x00ffff, 1.5);
  dirLight2.position.set(-5, -3, -5);
  scene.add(dirLight2);

  const ambient = new THREE.AmbientLight(0x0a0f2d, 0.6);
  scene.add(ambient);

  // Group to rotate everything together
  const globeGroup = new THREE.Group();
  scene.add(globeGroup);

  // Solid dark inner core to block background stars
  const coreGeom = new THREE.SphereGeometry(1.38, 24, 24);
  const coreMat = new THREE.MeshBasicMaterial({
    color: 0x050816,
    transparent: false
  });
  const innerCore = new THREE.Mesh(coreGeom, coreMat);
  globeGroup.add(innerCore);

  // Old Style Globe: Sphere wireframe
  const globeGeom = new THREE.SphereGeometry(1.4, 24, 24);
  const globeMat = new THREE.MeshBasicMaterial({
    color: 0x06b6d4,
    wireframe: true,
    transparent: true,
    opacity: 0.35
  });
  const globe = new THREE.Mesh(globeGeom, globeMat);
  globeGroup.add(globe);

  // Orbit ring 1 (purple) - reduced radius to prevent clipping
  const ringGeom1 = new THREE.RingGeometry(1.9, 1.96, 64);
  const ringMat1 = new THREE.MeshBasicMaterial({
    color: 0x915eff,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.6
  });
  const ring1 = new THREE.Mesh(ringGeom1, ringMat1);
  ring1.rotation.x = Math.PI / 2.5;
  scene.add(ring1);

  // Orbit ring 2 (cyan, diagonal angle) - reduced radius to prevent clipping
  const ringGeom2 = new THREE.RingGeometry(2.15, 2.2, 64);
  const ringMat2 = new THREE.MeshBasicMaterial({
    color: 0x00ffff,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.35
  });
  const ring2 = new THREE.Mesh(ringGeom2, ringMat2);
  ring2.rotation.x = Math.PI / 6;
  ring2.rotation.y = Math.PI / 4;
  scene.add(ring2);

  const resize = () => {
    const rect = canvas.parentElement.getBoundingClientRect();
    const w = rect.width || 350;
    const h = rect.height || 350;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };

  window.addEventListener("resize", resize);
  resize();

  // Timeout triggers to stabilize layout sizing delays
  setTimeout(resize, 100);
  setTimeout(resize, 400);

  const animate = () => {
    requestAnimationFrame(animate);

    globeGroup.rotation.y += 0.0035;
    globeGroup.rotation.x += 0.001;

    ring1.rotation.z -= 0.002;
    ring2.rotation.z += 0.0012;

    renderer.render(scene, camera);
  };
  animate();
}

// ==========================================================================
// SITE ANIMATION INITIALIZATION
// ==========================================================================
function startSiteAnimations() {
  triggerTypingEffect();
  setupScrollRevealAnimations();
  setupTimelineScrollTrigger();
  initHeroMesh();
  initContactGlobe();
}

// ==========================================================================
// FORM SUBMISSION & VALIDATION
// ==========================================================================
function setupContactForm() {
  const forms = document.querySelectorAll("#contact-form");
  forms.forEach(form => {
    if (form.dataset.bound) return;
    form.dataset.bound = "true";

    // Press Enter to submit form from textarea
    const messageInput = form.querySelector("#message") || form.querySelector("textarea[name='message']");
    const submitBtn = form.querySelector("button[type='submit']");
    if (messageInput && submitBtn) {
      messageInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          submitBtn.click();
        }
      });
    }

    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const nameInput = form.querySelector("#name") || form.querySelector("input[name='name']");
      const emailInput = form.querySelector("#email") || form.querySelector("input[name='email']");
      const messageInput2 = form.querySelector("#message") || form.querySelector("textarea[name='message']");

      const name = nameInput ? nameInput.value.trim() : "";
      const email = emailInput ? emailInput.value.trim() : "";
      const message = messageInput2 ? messageInput2.value.trim() : "";

      const nameErr = form.querySelector("#name-error") || document.getElementById("name-error");
      const emailErr = form.querySelector("#email-error") || document.getElementById("email-error");
      const msgErr = form.querySelector("#message-error") || document.getElementById("message-error");

      let isValid = true;

      // Validate Name
      if (name.length < 3) {
        if (nameErr) nameErr.classList.remove("hidden");
        isValid = false;
      } else {
        if (nameErr) nameErr.classList.add("hidden");
      }

      // Validate Email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        if (emailErr) emailErr.classList.remove("hidden");
        isValid = false;
      } else {
        if (emailErr) emailErr.classList.add("hidden");
      }

      // Validate Message
      if (message.length < 5) {
        if (msgErr) msgErr.classList.remove("hidden");
        isValid = false;
      } else {
        if (msgErr) msgErr.classList.add("hidden");
      }

      if (!isValid) {
        playBeep(220, 0.2, 'sawtooth', 0.05); // low buzz fail audio
        return;
      }

      // Submit Success
      const btn = form.querySelector("button[type='submit']");
      const sendingText = currentLang === "vi" ? "Đang gửi..." : "Sending...";
      btn.textContent = sendingText;
      btn.disabled = true;
      playBeep(440, 0.1, 'sine', 0.05);

      const formAction = form.getAttribute("action");
      const accessKeyInput = form.querySelector('input[name="access_key"]');
      const accessKey = accessKeyInput ? accessKeyInput.value : "";
      const isMock = !formAction || !accessKey || accessKey.includes("YOUR_");

      const showToast = (success, msg) => {
        const toast = document.createElement("div");
        toast.className = `fixed bottom-5 right-5 ${success ? 'bg-[#10b981]' : 'bg-[#ef4444]'} text-white py-3 px-6 rounded-xl font-bold z-50 shadow-lg flex items-center gap-2 transform translate-y-20 transition-all duration-300`;

        toast.innerHTML = success
          ? `<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"></path></svg>${msg}`
          : `<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"></path></svg>${msg}`;

        document.body.appendChild(toast);

        if (success) {
          playSuccessChime();
        } else {
          playBeep(220, 0.2, 'sawtooth', 0.05);
        }

        // Animate toast in and out
        setTimeout(() => toast.className = toast.className.replace("translate-y-20", "translate-y-0"), 50);
        setTimeout(() => {
          toast.className = toast.className.replace("translate-y-0", "translate-y-20");
          setTimeout(() => toast.remove(), 300);
        }, 4000);
      };

      if (isMock) {
        setTimeout(() => {
          const successText = currentLang === "vi"
            ? "Cảm ơn bạn! Tin nhắn đã được gửi thành công (Chế độ Demo)."
            : "Thank you! Your message was sent successfully (Demo Mode).";
          showToast(true, successText);
          form.reset();
          btn.textContent = currentLang === "vi" ? "Gửi" : "Send";
          btn.disabled = false;
        }, 1200);
      } else {
        // Real API send to Web3Forms
        fetch(formAction, {
          method: "POST",
          headers: {
            "Accept": "application/json",
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            access_key: accessKey,
            name: name,
            email: email,
            message: message
          })
        })
          .then(response => {
            if (response.ok) {
              const successText = currentLang === "vi"
                ? "Cảm ơn bạn! Tin nhắn đã được gửi thành công."
                : "Thank you! Your message was sent successfully.";
              showToast(true, successText);
              form.reset();
            } else {
              const errorText = currentLang === "vi"
                ? "Đã xảy ra lỗi khi gửi. Vui lòng thử lại sau."
                : "An error occurred while sending. Please try again later.";
              showToast(false, errorText);
            }
          })
          .catch(error => {
            const errorText = currentLang === "vi"
              ? "Không thể kết nối máy chủ. Vui lòng thử lại sau."
              : "Unable to connect to server. Please try again later.";
            showToast(false, errorText);
          })
          .finally(() => {
            btn.textContent = currentLang === "vi" ? "Gửi" : "Send";
            btn.disabled = false;
          });
      }
    });
  });
}

// ==========================================================================
// 3D INTERACTIVE WORKSPACE ENGINE (GAME MODE)
// ==========================================================================
let gameScene, gameCamera, gameRenderer;
let gamePlayer;
let gameNodes = [];
let gameUnderGlobe;
let centralCoreGroup = null;
let moveIndicator;
let gameStars = null;
let gameStarsTwinkleA = null;
let gameStarsTwinkleB = null;
let gameNebulaClouds = [];
let gameSpaceDust = null;
let activeShootingStars = [];
let gameTechFloor = null;
let gameGridHelper = null;
let gameFloorPointLight = null;
let gameWalkwayTextures = [];
let gameBlackHoleGroup = null;
let gameBgPlanets = [];
let gameSweepRing = null;
let gameFenceBeacons = [];
let gamePerimeterRail = null;
let gameWalkwayMeshes = [];
let gamePlayerVeloY = 0;
let gameInitialized = false;
let gamePortalGroup = null, gamePortalVortex = null, gamePortalRing = null, gamePortalSprite = null;
let portalAngle = 0, portalDist = 30.0;
let is3DMode = false;
let isBootFinished = false;
let isShootingEarth = false;
let shootEarthTimeStart = 0;
let isShootingPlanet = false;
let shootPlanetTimeStart = 0;
let shootingPlanetNode = null;
let laserBeamMesh = null;
let earthExplosionParticles = [];
let planetExplosionParticles = [];
let planetExplosionFx = [];
let gameCamShakeOffset = new THREE.Vector3(0, 0, 0);
let gameAnimationId = null;
let activeModalNode = null;
let lastOpenedNode = null;
let visitedNodes = ["home"];
let sunChargeSurge = 1.0;
let laserSoundPlayed = false;
let explosionSoundPlayed = false;
let isPortalHovered = false;

let joystickActive = false;
let joystickStartPos = { x: 0, y: 0 };
let joystickDir = { x: 0, y: 0 };

let keysPressed = {
  w: false, a: false, s: false, d: false,
  ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false
};

let gameCameraYawAngle = 0;
let gameCameraPitchAngle = 0.5; // default view pitch
let gameCameraRadius = 16;
let gameCameraTargetRadius = 16;
let gamePlayerTargetPos = null;
let homeUnlockEffectShown = false;
let shouldShowAllUnlockedEffectAfterClose = false;
let allUnlockedEffectShown = false;

const nodeDefs = [
  {
    id: "home",
    name: "TRÁI ĐẤT (HƯỚNG DẪN)",
    nameEn: "EARTH (MANUAL)",
    color: 0x3b82f6, // blue
    x: 0,
    z: -28,
    iconType: "earth",
    targetId: "hero"
  },
  {
    id: "about",
    name: "SAO KIM (GIỚI THIỆU)",
    nameEn: "VENUS (ABOUT)",
    color: 0xeab308, // yellow
    x: 0,
    z: -22,
    iconType: "venus",
    targetId: "about"
  },
  {
    id: "skills",
    name: "SAO HỎA (KỸ NĂNG)",
    nameEn: "MARS (SKILLS)",
    color: 0xef4444, // red
    x: 19,
    z: -11,
    iconType: "mars",
    targetId: "skills"
  },
  {
    id: "experience",
    name: "SAO MỘC (KINH NGHIỆM)",
    nameEn: "JUPITER (EXPERIENCE)",
    color: 0xf97316, // orange
    x: 19,
    z: 11,
    iconType: "jupiter",
    targetId: "experience"
  },
  {
    id: "projects",
    name: "SAO THỔ (SẢN PHẨM)",
    nameEn: "SATURN (PROJECTS)",
    color: 0xf59e0b, // amber yellow
    x: -19,
    z: 11,
    iconType: "saturn",
    targetId: "projects"
  },
  {
    id: "testimonials",
    name: "SAO THIÊN VƯƠNG (ĐÁNH GIÁ)",
    nameEn: "URANUS (REVIEWS)",
    color: 0x06b6d4, // cyan
    x: -19,
    z: -11,
    iconType: "uranus",
    targetId: "testimonials"
  },
  {
    id: "contact",
    name: "SAO HẢI VƯƠNG (LIÊN HỆ)",
    nameEn: "NEPTUNE (CONTACT)",
    color: 0x3b82f6, // blue
    x: 0,
    z: 22,
    iconType: "neptune",
    targetId: "contact"
  },
  {
    id: "cv",
    name: "SAO DIÊM VƯƠNG (KHOÁ - 0/6)",
    nameEn: "PLUTO (LOCKED - 0/6)",
    color: 0xa8a29e, // slate gray
    x: 0,
    z: -38,
    iconType: "pluto",
    targetId: "cv"
  }
];

function randomizeStationLayout() {
  const solarOrbitRadius = {
    about: 23.0,        // Venus
    home: 28.0,         // Earth
    skills: 32.0,       // Mars
    experience: 36.0,   // Jupiter
    projects: 40.0,     // Saturn
    testimonials: 43.0, // Uranus
    contact: 46.0,      // Neptune
    cv: 49.0            // Pluto
  };

  const orbitBodies = [
    { type: "portal", radius: 18.0 }, // Mercury exit portal
    ...nodeDefs.map(def => ({ type: "node", def, radius: solarOrbitRadius[def.id] || 34.0 }))
  ];
  const sectorIndexes = orbitBodies.map((_, index) => index);
  const baseAngleOffset = Math.random() * Math.PI * 2;

  for (let i = sectorIndexes.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [sectorIndexes[i], sectorIndexes[j]] = [sectorIndexes[j], sectorIndexes[i]];
  }

  orbitBodies.forEach((body, index) => {
    const sectorAngle = baseAngleOffset + (sectorIndexes[index] * Math.PI * 2) / orbitBodies.length;
    const angle = sectorAngle + (Math.random() - 0.5) * 0.24;

    if (body.type === "portal") {
      portalAngle = angle;
      portalDist = body.radius;
    } else {
      body.def.x = Math.sin(angle) * body.radius;
      body.def.z = Math.cos(angle) * body.radius;
    }
  });
}

function createTextTexture(text, color = '#ffffff') {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'rgba(0,0,0,0)';
  ctx.fillRect(0, 0, 512, 64);

  ctx.font = 'Bold 26px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = color;
  ctx.shadowBlur = 8;
  ctx.fillStyle = color;
  ctx.fillText(text, 256, 32);

  return new THREE.CanvasTexture(canvas);
}

function createTextSprite(text, color = '#ffffff') {
  const texture = createTextTexture(text, color);
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(8, 1, 1);
  return sprite;
}

function createNebulaTexture(colorHex) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");

  const grad = ctx.createRadialGradient(256, 256, 10, 256, 256, 240);
  grad.addColorStop(0, colorHex + "2f"); // slightly glowing center
  grad.addColorStop(0.35, colorHex + "15");
  grad.addColorStop(1, "rgba(0,0,0,0)");

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  return new THREE.CanvasTexture(canvas);
}

function createWalkwayTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");

  // Dark slate glowing background
  ctx.fillStyle = "rgba(10, 15, 36, 0.9)";
  ctx.fillRect(0, 0, 64, 256);

  // Outer metallic white rails
  ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
  ctx.fillRect(0, 0, 6, 256);
  ctx.fillRect(58, 0, 6, 256);

  // Translucent glowing center stripe
  ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
  ctx.fillRect(6, 0, 52, 256);

  // Chevron flow arrows pointing forward
  ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
  ctx.lineWidth = 3.5;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  for (let y = 32; y < 256; y += 64) {
    ctx.beginPath();
    ctx.moveTo(18, y);
    ctx.lineTo(32, y - 14);
    ctx.lineTo(46, y);
    ctx.stroke();
  }

  // Horizontal grid lines
  ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
  ctx.lineWidth = 1;
  for (let y = 0; y < 256; y += 16) {
    ctx.beginPath();
    ctx.moveTo(6, y);
    ctx.lineTo(58, y);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  return tex;
}

function createClickIndicatorTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");

  ctx.clearRect(0, 0, 128, 128);

  // Draw 4 inward pointing green arrows
  ctx.strokeStyle = "#10b981"; // Emerald green
  ctx.lineWidth = 6;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // Arrow size/length
  // Center is (64, 64)
  const d1 = 45;
  const d2 = 25;
  const w = 12;

  // Top chevron pointing down
  ctx.beginPath();
  ctx.moveTo(64 - w, d1);
  ctx.lineTo(64, d2);
  ctx.lineTo(64 + w, d1);
  ctx.stroke();

  // Bottom chevron pointing up
  ctx.beginPath();
  ctx.moveTo(64 - w, 128 - d1);
  ctx.lineTo(64, 128 - d2);
  ctx.lineTo(64 + w, 128 - d1);
  ctx.stroke();

  // Left chevron pointing right
  ctx.beginPath();
  ctx.moveTo(d1, 64 - w);
  ctx.lineTo(d2, 64);
  ctx.lineTo(d1, 64 + w);
  ctx.stroke();

  // Right chevron pointing left
  ctx.beginPath();
  ctx.moveTo(128 - d1, 64 - w);
  ctx.lineTo(128 - d2, 64);
  ctx.lineTo(128 - d1, 64 + w);
  ctx.stroke();

  // Also draw a small central glow dot
  ctx.fillStyle = "#34d399";
  ctx.beginPath();
  ctx.arc(64, 64, 5, 0, Math.PI * 2);
  ctx.fill();

  return new THREE.CanvasTexture(canvas);
}

function createAccretionDiskTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");

  ctx.clearRect(0, 0, 512, 512);

  const numArms = 8;
  const centerX = 256;
  const centerY = 256;

  for (let i = 0; i < numArms; i++) {
    const baseAngle = (i / numArms) * Math.PI * 2;
    ctx.beginPath();

    for (let r = 20; r < 240; r += 2) {
      const angle = baseAngle + (r * 0.024);
      const x = centerX + Math.cos(angle) * r;
      const y = centerY + Math.sin(angle) * r;

      const alpha = Math.max(0, 1.0 - r / 240);
      let colorStr = `rgba(255, 140, 0, ${alpha * 0.65})`;
      if (r < 70) colorStr = `rgba(255, 255, 255, ${alpha * 0.85})`;
      else if (r > 160) colorStr = `rgba(145, 94, 255, ${alpha * 0.45})`;
      else if (r > 100) colorStr = `rgba(239, 68, 68, ${alpha * 0.55})`;

      ctx.fillStyle = colorStr;
      ctx.fillRect(x - 3, y - 3, 6, 6);
    }
  }

  const grad = ctx.createRadialGradient(256, 256, 10, 256, 256, 120);
  grad.addColorStop(0, "rgba(255, 255, 255, 0.9)");
  grad.addColorStop(0.2, "rgba(253, 186, 116, 0.75)");
  grad.addColorStop(0.5, "rgba(239, 68, 68, 0.4)");
  grad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(256, 256, 120, 0, Math.PI * 2);
  ctx.fill();

  return new THREE.CanvasTexture(canvas);
}

function createGasGiantTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");

  const grad = ctx.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, "#083344");
  grad.addColorStop(1, "#164e63");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 256);

  const bandColors = [
    "rgba(6, 182, 212, 0.3)",
    "rgba(14, 116, 144, 0.45)",
    "rgba(145, 94, 255, 0.25)",
    "rgba(30, 41, 59, 0.6)",
    "rgba(255, 255, 255, 0.12)"
  ];

  for (let y = 0; y < 256; y += 4) {
    const colorIdx = Math.floor((Math.sin(y * 0.08) + 1.0) * 2.5) % bandColors.length;
    ctx.fillStyle = bandColors[colorIdx];

    ctx.beginPath();
    ctx.rect(0, y, 512, 4);
    ctx.fill();
  }

  ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
  ctx.beginPath();
  ctx.arc(380, 120, 25, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(6, 182, 212, 0.35)";
  ctx.beginPath();
  ctx.arc(380, 120, 15, 0, Math.PI * 2);
  ctx.fill();

  return new THREE.CanvasTexture(canvas);
}

function createLavaPlanetTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#0c0a0f";
  ctx.fillRect(0, 0, 512, 256);

  ctx.strokeStyle = "rgba(239, 68, 68, 0.85)";
  ctx.shadowColor = "#f43f5e";
  ctx.shadowBlur = 10;

  for (let i = 0; i < 20; i++) {
    ctx.lineWidth = Math.random() * 3 + 1;
    ctx.strokeStyle = i % 2 === 0 ? "rgba(249, 115, 22, 0.8)" : "rgba(239, 68, 68, 0.85)";

    ctx.beginPath();
    let startX = Math.random() * 512;
    let startY = Math.random() * 256;
    ctx.moveTo(startX, startY);

    for (let j = 0; j < 6; j++) {
      let nextX = startX + (Math.random() - 0.5) * 80;
      let nextY = startY + (Math.random() - 0.5) * 50;
      ctx.lineTo(nextX, nextY);
      startX = nextX;
      startY = nextY;
    }
    ctx.stroke();
  }
  ctx.shadowBlur = 0;

  return new THREE.CanvasTexture(canvas);
}

function createEarthTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");

  // Deep Ocean Blue
  ctx.fillStyle = "#1d4ed8";
  ctx.fillRect(0, 0, 512, 256);

  // Paint realistic organic continents (green & brown tones)
  ctx.fillStyle = "#15803d"; // Forest green

  // Continent shapes
  // North America
  ctx.beginPath();
  ctx.arc(100, 70, 45, 0, Math.PI * 2);
  ctx.arc(140, 100, 30, 0, Math.PI * 2);
  ctx.arc(70, 90, 25, 0, Math.PI * 2);
  ctx.fill();

  // South America
  ctx.beginPath();
  ctx.arc(150, 160, 35, 0, Math.PI * 2);
  ctx.arc(160, 200, 20, 0, Math.PI * 2);
  ctx.fill();

  // Africa
  ctx.beginPath();
  ctx.arc(280, 140, 40, 0, Math.PI * 2);
  ctx.arc(310, 180, 25, 0, Math.PI * 2);
  ctx.arc(260, 110, 30, 0, Math.PI * 2);
  ctx.fill();

  // Europe & Asia
  ctx.beginPath();
  ctx.arc(300, 60, 35, 0, Math.PI * 2);
  ctx.arc(360, 65, 45, 0, Math.PI * 2);
  ctx.arc(420, 80, 40, 0, Math.PI * 2);
  ctx.arc(450, 120, 35, 0, Math.PI * 2);
  ctx.fill();

  // Australia
  ctx.beginPath();
  ctx.arc(430, 190, 22, 0, Math.PI * 2);
  ctx.fill();

  // Antarctica & Greenland (Ice caps)
  ctx.fillStyle = "#f8fafc";
  ctx.fillRect(0, 0, 512, 16);
  ctx.fillRect(0, 240, 512, 16);

  // Clouds layer
  ctx.fillStyle = "rgba(255, 255, 255, 0.45)";
  for (let i = 0; i < 18; i++) {
    const rx = (i * 28 + 15) % 512;
    const ry = (i * 17 + 35) % 200 + 20;
    const size = 15 + (i % 4) * 8;
    ctx.beginPath();
    ctx.arc(rx, ry, size, 0, Math.PI * 2);
    ctx.arc(rx + size * 0.5, ry + size * 0.2, size * 0.7, 0, Math.PI * 2);
    ctx.fill();
  }

  return new THREE.CanvasTexture(canvas);
}

function createSunTexture(energyRatio = 1.0) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");

  const gradient = ctx.createLinearGradient(0, 0, 0, 256);
  gradient.addColorStop(0, "#f97316"); // Hot orange
  gradient.addColorStop(0.5, "#facc15"); // Bright yellow
  gradient.addColorStop(1, "#ea580c"); // Darker orange
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 512, 256);

  ctx.fillStyle = "rgba(254, 240, 138, 0.6)"; // Very light yellow flares
  for (let i = 0; i < 25; i++) {
    ctx.beginPath();
    ctx.arc(Math.random() * 512, Math.random() * 256, Math.random() * 45 + 15, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = "rgba(194, 65, 12, 0.45)"; // Dark solar orange
  for (let i = 0; i < 15; i++) {
    ctx.beginPath();
    ctx.arc(Math.random() * 512, Math.random() * 256, Math.random() * 15 + 5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Draw black/dark overlay on the upper part based on energyRatio
  if (energyRatio < 1.0) {
    const darkHeight = 256 * (1.0 - energyRatio);
    // Draw solid black on the top part
    ctx.fillStyle = "#0c0a09"; // Very dark charcoal/black
    ctx.fillRect(0, 0, 512, Math.max(0, darkHeight - 30));

    // Draw smooth transition gradient to merge dark into fiery orange/yellow
    const transitionGrad = ctx.createLinearGradient(0, Math.max(0, darkHeight - 30), 0, Math.min(256, darkHeight + 20));
    transitionGrad.addColorStop(0, "#0c0a09");
    transitionGrad.addColorStop(1, "rgba(12, 10, 9, 0)");
    ctx.fillStyle = transitionGrad;
    ctx.fillRect(0, Math.max(0, darkHeight - 30), 512, 50);
  }

  return new THREE.CanvasTexture(canvas);
}

function updateSunTexture() {
  if (centralCoreGroup) {
    const sun = centralCoreGroup.getObjectByName("sun_mesh");
    if (sun && sun.material) {
      const exploredCount = ["home", "about", "skills", "experience", "projects", "testimonials", "contact", "cv"].filter(id => visitedNodes.includes(id)).length;
      const sunEnergyRatio = exploredCount / 8;

      if (sun.material.map) sun.material.map.dispose();
      sun.material.map = createSunTexture(sunEnergyRatio);
      sun.material.needsUpdate = true;
    }
  }
}

function createMercuryTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 256; canvas.height = 128;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#78716c"; // Gray rocky base
  ctx.fillRect(0, 0, 256, 128);
  ctx.fillStyle = "rgba(41, 37, 36, 0.4)";
  for (let i = 0; i < 40; i++) {
    ctx.beginPath();
    ctx.arc(Math.random() * 256, Math.random() * 128, Math.random() * 8 + 2, 0, Math.PI * 2);
    ctx.fill();
  }
  return new THREE.CanvasTexture(canvas);
}

function createVenusTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 256; canvas.height = 128;
  const ctx = canvas.getContext("2d");
  const gradient = ctx.createLinearGradient(0, 0, 0, 128);
  gradient.addColorStop(0, "#d97706");
  gradient.addColorStop(0.5, "#eab308");
  gradient.addColorStop(1, "#ca8a04");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 128);
  ctx.fillStyle = "rgba(254, 240, 138, 0.35)";
  for (let i = 0; i < 15; i++) {
    ctx.beginPath();
    ctx.arc(Math.random() * 256, Math.random() * 128, Math.random() * 25 + 10, 0, Math.PI * 2);
    ctx.fill();
  }
  return new THREE.CanvasTexture(canvas);
}

function createMarsTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 256; canvas.height = 128;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#c2410c"; // Mars rust red
  ctx.fillRect(0, 0, 256, 128);
  ctx.fillStyle = "rgba(127, 29, 29, 0.5)";
  for (let i = 0; i < 20; i++) {
    ctx.beginPath();
    ctx.arc(Math.random() * 256, Math.random() * 128, Math.random() * 20 + 8, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, 256, 8);
  ctx.fillRect(0, 120, 256, 8);
  return new THREE.CanvasTexture(canvas);
}

function createJupiterTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 512; canvas.height = 256;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#fed7aa"; // Beige
  ctx.fillRect(0, 0, 512, 256);
  const colors = ["#ea580c", "#d97706", "#c2410c", "#fed7aa", "#ffedd5"];
  for (let y = 0; y < 256; y += 12) {
    ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
    ctx.fillRect(0, y, 512, Math.random() * 16 + 4);
  }
  ctx.fillStyle = "#991b1b"; // Great Red Spot
  ctx.beginPath();
  ctx.ellipse(320, 160, 32, 20, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.6)";
  for (let i = 0; i < 8; i++) {
    ctx.beginPath();
    ctx.arc(Math.random() * 512, Math.random() * 256, Math.random() * 12 + 4, 0, Math.PI * 2);
    ctx.fill();
  }
  return new THREE.CanvasTexture(canvas);
}

function createSaturnTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 256; canvas.height = 128;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#fef08a"; // Butterscotch yellow
  ctx.fillRect(0, 0, 256, 128);
  const colors = ["#fef08a", "#fef9c3", "#ca8a04", "#eab308"];
  for (let y = 0; y < 128; y += 8) {
    ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
    ctx.fillRect(0, y, 256, Math.random() * 10 + 2);
  }
  return new THREE.CanvasTexture(canvas);
}

function createUranusTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 256; canvas.height = 128;
  const ctx = canvas.getContext("2d");
  const gradient = ctx.createLinearGradient(0, 0, 0, 128);
  gradient.addColorStop(0, "#a5f3fc");
  gradient.addColorStop(0.5, "#22d3ee");
  gradient.addColorStop(1, "#0891b2");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 128);
  return new THREE.CanvasTexture(canvas);
}

function createNeptuneTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 256; canvas.height = 128;
  const ctx = canvas.getContext("2d");
  const gradient = ctx.createLinearGradient(0, 0, 0, 128);
  gradient.addColorStop(0, "#1d4ed8");
  gradient.addColorStop(0.5, "#3b82f6");
  gradient.addColorStop(1, "#1e3a8a");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 128);
  ctx.fillStyle = "rgba(30, 58, 138, 0.4)";
  for (let i = 0; i < 4; i++) {
    ctx.fillRect(0, Math.random() * 128, 256, Math.random() * 12 + 4);
  }
  return new THREE.CanvasTexture(canvas);
}

function createPlutoTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 256; canvas.height = 128;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#5c534e"; // Dark icy brown-gray
  ctx.fillRect(0, 0, 256, 128);

  // Paint Tombaugh Regio (the famous heart of Pluto)
  ctx.fillStyle = "#d6d3d1"; // Light ice gray
  ctx.beginPath();
  // Left lobe of the heart
  ctx.arc(100, 75, 18, 0, Math.PI * 2);
  // Right lobe of the heart
  ctx.arc(122, 75, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(82, 79);
  ctx.lineTo(111, 108);
  ctx.lineTo(140, 79);
  ctx.fill();

  // Darker patches on the side
  ctx.fillStyle = "rgba(28, 25, 23, 0.6)";
  for (let i = 0; i < 15; i++) {
    ctx.beginPath();
    ctx.arc(Math.random() * 256, Math.random() * 128, Math.random() * 10 + 3, 0, Math.PI * 2);
    ctx.fill();
  }
  return new THREE.CanvasTexture(canvas);
}

function getNodeName(nodeDef, lang) {
  if (nodeDef.id === "cv") {
    const coreVisitedCount = ["home", "about", "skills", "experience", "projects", "testimonials", "contact"].filter(id => visitedNodes.includes(id)).length;
    const isUnlocked = coreVisitedCount === 7;
    if (lang === 'vi') {
      return isUnlocked ? "SAO DIÊM VƯƠNG (CV)" : `SAO DIÊM VƯƠNG (KHOÁ ${coreVisitedCount}/7)`;
    } else {
      return isUnlocked ? "PLUTO (CV)" : `PLUTO (LOCKED ${coreVisitedCount}/7)`;
    }
  }
  return lang === 'vi' ? nodeDef.name : nodeDef.nameEn;
}

function updateInstructionsHUD() {
  const hudContent = document.getElementById("hud-content");
  if (!hudContent) return;
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  if (isTouchDevice) {
    hudContent.innerHTML = `
      <div data-vi="• Kéo Joystick để di chuyển nhân vật" data-en="• Drag Joystick to move ship">• Kéo Joystick để di chuyển nhân vật</div>
      <div data-vi="• Chạm & Vuốt màn hình để xoay camera" data-en="• Swipe screen to rotate camera">• Chạm & Vuốt màn hình để xoay camera</div>
      <div data-vi="• Đến gần các địa danh để xem thông tin" data-en="• Get close to nodes to connect">• Đến gần các địa danh để xem thông tin</div>
    `;
  } else {
    hudContent.innerHTML = `
      <div data-vi="• WASD / Phím mũi tên để di chuyển" data-en="• WASD / Arrow Keys to move">• WASD / Phím mũi tên để di chuyển</div>
      <div data-vi="• Click chuột phải để di chuyển" data-en="• Right-Click to move">• Click chuột phải để di chuyển</div>
      <div data-vi="• Chuột trái & Kéo để xoay camera" data-en="• Left-Click & Drag to rotate camera">• Chuột trái & Kéo để xoay camera</div>
      <div data-vi="• Cuộn chuột để phóng to / thu nhỏ" data-en="• Scroll to Zoom">• Cuộn chuột để phóng to / thu nhỏ</div>
    `;
  }
}

function updatePlutoLabel() {
  if (!gameNodes) return;
  const plutoNode = gameNodes.find(n => n.def.id === "cv");
  if (!plutoNode) return;
  const nameSprite = plutoNode.group.getObjectByName("name_label");
  if (!nameSprite) return;

  const nameStr = getNodeName(plutoNode.def, currentLang);
  nameSprite.material.map = createTextTexture(nameStr, '#' + plutoNode.def.color.toString(16).padStart(6, '0'));
}

function updateQuestUI() {
  const corePlanets = ["home", "about", "skills", "experience", "projects", "testimonials", "contact"];
  let completedCount = 0;

  corePlanets.forEach(id => {
    const itemEl = document.getElementById(`quest-item-${id}`);
    if (itemEl) {
      if (visitedNodes.includes(id)) {
        completedCount++;
        itemEl.classList.remove("text-zinc-500");
        itemEl.classList.add("text-emerald-400", "font-bold");
        itemEl.innerHTML = `<i class="fa-regular fa-square-check text-emerald-400"></i> ` + 
          (id === "home" ? (currentLang === 'vi' ? 'Trái Đất (Hướng Dẫn)' : 'Earth (Manual)') :
           id === "about" ? (currentLang === 'vi' ? 'Sao Kim (Giới Thiệu)' : 'Venus (About)') :
           id === "skills" ? (currentLang === 'vi' ? 'Sao Hỏa (Kỹ Năng)' : 'Mars (Skills)') :
           id === "experience" ? (currentLang === 'vi' ? 'Sao Mộc (Kinh Nghiệm)' : 'Jupiter (Experience)') :
           id === "projects" ? (currentLang === 'vi' ? 'Sao Thổ (Sản Phẩm)' : 'Saturn (Projects)') :
           id === "testimonials" ? (currentLang === 'vi' ? 'S.Thiên Vương (Đánh Giá)' : 'Uranus (Reviews)') :
           (currentLang === 'vi' ? 'Sao Hải Vương (Liên Hệ)' : 'Neptune (Contact)'));
      } else {
        itemEl.classList.add("text-zinc-500");
        itemEl.classList.remove("text-emerald-400", "font-bold");
        itemEl.innerHTML = `<i class="fa-regular fa-square"></i> ` + 
          (id === "home" ? (currentLang === 'vi' ? 'Trái Đất (Hướng Dẫn)' : 'Earth (Manual)') :
           id === "about" ? (currentLang === 'vi' ? 'Sao Kim (Giới Thiệu)' : 'Venus (About)') :
           id === "skills" ? (currentLang === 'vi' ? 'Sao Hỏa (Kỹ Năng)' : 'Mars (Skills)') :
           id === "experience" ? (currentLang === 'vi' ? 'Sao Mộc (Kinh Nghiệm)' : 'Jupiter (Experience)') :
           id === "projects" ? (currentLang === 'vi' ? 'Sao Thổ (Sản Phẩm)' : 'Saturn (Projects)') :
           id === "testimonials" ? (currentLang === 'vi' ? 'S.Thiên Vương (Đánh Giá)' : 'Uranus (Reviews)') :
           (currentLang === 'vi' ? 'Sao Hải Vương (Liên Hệ)' : 'Neptune (Contact)'));
      }
    }
  });

  const progressText = document.getElementById("quest-progress-text");
  if (progressText) {
    progressText.textContent = `${completedCount}/7`;
  }

  const progressBar = document.getElementById("quest-progress-bar");
  if (progressBar) {
    progressBar.style.width = `${(completedCount / 7) * 100}%`;
  }

  const plutoStatus = document.getElementById("quest-pluto-status");
  if (plutoStatus) {
    const exploredCount = ["home", "about", "skills", "experience", "projects", "testimonials", "contact", "cv"].filter(id => visitedNodes.includes(id)).length;
    if (exploredCount === 8) {
      plutoStatus.innerHTML = currentLang === 'vi' ? 
        `<span class="text-amber-400 font-bold animate-pulse">☀️ MẶT TRỜI ĐÃ ĐẦY NĂNG LƯỢNG - HÃY ĐẾN MẶT TRỜI</span>` : 
        `<span class="text-amber-400 font-bold animate-pulse">☀️ SOLAR CORE CHARGED - PROCEED TO THE SUN</span>`;
    } else if (completedCount === 7) {
      plutoStatus.innerHTML = currentLang === 'vi' ? 
        `<span class="text-emerald-400 font-bold animate-pulse">🔓 PLUTO: ĐÃ MỞ KHÓA (CV)</span>` : 
        `<span class="text-emerald-400 font-bold animate-pulse">🔓 PLUTO: UNLOCKED (CV)</span>`;
    } else {
      plutoStatus.innerHTML = currentLang === 'vi' ? 
        `<span class="text-rose-500/80">🔒 PLUTO: ĐANG KHÓA (KHÁM PHÁ ĐỦ 7 HÀNH TINH)</span>` : 
        `<span class="text-rose-500/80">🔒 PLUTO: LOCKED (EXPLORE ALL 7 PLANETS)</span>`;
    }
  }

  const exploredCount = ["home", "about", "skills", "experience", "projects", "testimonials", "contact", "cv"].filter(id => visitedNodes.includes(id)).length;
  const energyPercent = Math.min(100, Math.round((exploredCount / 8) * 100));

  const sunEnergyText = document.getElementById("quest-sun-energy-text");
  if (sunEnergyText) {
    sunEnergyText.textContent = `${energyPercent}%`;
  }

  const sunEnergyBar = document.getElementById("quest-sun-energy-bar");
  if (sunEnergyBar) {
    sunEnergyBar.style.width = `${energyPercent}%`;
  }
}

function updatePlutoLockState() {
  if (!gameNodes) return;
  const plutoNode = gameNodes.find(n => n.def.id === "cv");
  if (!plutoNode) return;

  const coreVisitedCount = ["home", "about", "skills", "experience", "projects", "testimonials", "contact"].filter(id => visitedNodes.includes(id)).length;
  const isUnlocked = coreVisitedCount === 7;

  const lockShield = plutoNode.group.getObjectByName("lock_shield");
  if (isUnlocked) {
    if (lockShield) {
      plutoNode.group.remove(lockShield);
    }
  } else {
    if (!lockShield) {
      const shieldGeom = new THREE.SphereGeometry(0.7 * 1.4, 12, 12);
      const shieldMat = new THREE.MeshBasicMaterial({
        color: 0xef4444,
        wireframe: true,
        transparent: true,
        opacity: 0.45
      });
      const newShield = new THREE.Mesh(shieldGeom, shieldMat);
      newShield.name = "lock_shield";
      newShield.position.y = 0.3; // matches iconMesh.position.y
      plutoNode.group.add(newShield);
    }
  }
  updatePlutoLabel();
  updateQuestUI();
}

function initGame3D() {
  isAudioMuted = false;
  updateSoundToggleButtonUI();
  
  playBgMusic();
  gameCameraTargetRadius = 16;
  gameCameraRadius = 16;
  gameCameraPitchAngle = 0.5;

  if (gameInitialized) {
    if (!gameAnimationId) {
      gameAnimate();
    }
    window.dispatchEvent(new Event('resize'));
    return;
  }

  randomizeStationLayout();

  gameWalkwayTextures = [];
  gameSweepRing = null;
  gameFenceBeacons = [];

  const canvas = document.getElementById("canvas-game-3d");
  if (!canvas) return;
  canvas.addEventListener("contextmenu", e => e.preventDefault());
  canvas.style.cursor = 'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'32\' height=\'32\' viewBox=\'0 0 32 32\'><polygon points=\'0,0 20,10 12,12 22,22 18,24 8,14 4,18\' fill=\'%2300f3ff\' stroke=\'%23111827\' stroke-width=\'1.5\'/></svg>") 0 0, auto';

  gameScene = new THREE.Scene();

  // Perspective Camera
  gameCamera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);

  // WebGL Renderer
  gameRenderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  gameRenderer.setSize(window.innerWidth, window.innerHeight);
  gameRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // Light sources
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.35);
  gameScene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 0.85);
  dirLight.position.set(10, 20, 15);
  gameScene.add(dirLight);

  // Concentric / Twinkling Starfields
  // 1. Static far stars (white)
  const starCount = 800;
  const starGeom = new THREE.BufferGeometry();
  const starPos = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount * 3; i += 3) {
    starPos[i] = (Math.random() - 0.5) * 250;
    starPos[i + 1] = (Math.random() - 0.5) * 200 + 30;
    starPos[i + 2] = (Math.random() - 0.5) * 250;
  }
  starGeom.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
  const starMat = new THREE.PointsMaterial({ size: 0.7, color: 0xffffff, transparent: true, opacity: 0.5 });
  gameStars = new THREE.Points(starGeom, starMat);
  gameScene.add(gameStars);

  // 2. Twinkling Cyan Stars
  const starCountA = 400;
  const starGeomA = new THREE.BufferGeometry();
  const starPosA = new Float32Array(starCountA * 3);
  for (let i = 0; i < starCountA * 3; i += 3) {
    starPosA[i] = (Math.random() - 0.5) * 250;
    starPosA[i + 1] = (Math.random() - 0.5) * 200 + 30;
    starPosA[i + 2] = (Math.random() - 0.5) * 250;
  }
  starGeomA.setAttribute("position", new THREE.BufferAttribute(starPosA, 3));
  const starMatA = new THREE.PointsMaterial({ size: 0.9, color: 0x06b6d4, transparent: true, opacity: 0.7 });
  gameStarsTwinkleA = new THREE.Points(starGeomA, starMatA);
  gameScene.add(gameStarsTwinkleA);

  // 3. Twinkling Purple Stars
  const starCountB = 400;
  const starGeomB = new THREE.BufferGeometry();
  const starPosB = new Float32Array(starCountB * 3);
  for (let i = 0; i < starCountB * 3; i += 3) {
    starPosB[i] = (Math.random() - 0.5) * 250;
    starPosB[i + 1] = (Math.random() - 0.5) * 200 + 30;
    starPosB[i + 2] = (Math.random() - 0.5) * 250;
  }
  starGeomB.setAttribute("position", new THREE.BufferAttribute(starPosB, 3));
  const starMatB = new THREE.PointsMaterial({ size: 0.8, color: 0xd946ef, transparent: true, opacity: 0.6 });
  gameStarsTwinkleB = new THREE.Points(starGeomB, starMatB);
  gameScene.add(gameStarsTwinkleB);

  // 4. Milky Way Galaxy Band (Dải thiên hà chạy xéo qua bầu trời)
  const galaxyCount = 1800;
  const galaxyGeom = new THREE.BufferGeometry();
  const galaxyPos = new Float32Array(galaxyCount * 3);
  const galaxyColors = new Float32Array(galaxyCount * 3);

  const warmColor = new THREE.Color("#ffe7d6"); // Warm starlight core
  const blueColor = new THREE.Color("#60a5fa"); // Cosmic blue gas
  const pinkColor = new THREE.Color("#f472b6"); // Nebula pink

  for (let i = 0; i < galaxyCount; i++) {
    // Parameter along the galaxy band line
    const t = (Math.random() - 0.5) * 350; // Length of the band
    
    // Core line of the band running diagonally across the sky
    const cx = t * 0.8;
    const cy = t * 0.3 + 30.0 + (Math.random() - 0.5) * 10.0; // Lifted up in the sky
    const cz = -t * 0.5;

    // Radial spread (denser at center, sparse at edges)
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.pow(Math.random(), 2) * 28.0; // Quadratic distribution for dense core

    const px = cx + Math.cos(angle) * radius;
    const py = cy + Math.sin(angle) * radius * 0.6; // Slightly flattened band
    const pz = cz + Math.sin(angle) * radius * 0.8;

    const idx = i * 3;
    galaxyPos[idx] = px;
    galaxyPos[idx + 1] = py;
    galaxyPos[idx + 2] = pz;

    // Assign colors based on distance from core
    let starColor = warmColor;
    if (radius > 15.0) {
      starColor = Math.random() > 0.5 ? blueColor : pinkColor;
    } else if (radius > 8.0) {
      starColor = Math.random() > 0.3 ? warmColor : blueColor;
    }
    
    galaxyColors[idx] = starColor.r;
    galaxyColors[idx + 1] = starColor.g;
    galaxyColors[idx + 2] = starColor.b;
  }

  galaxyGeom.setAttribute("position", new THREE.BufferAttribute(galaxyPos, 3));
  galaxyGeom.setAttribute("color", new THREE.BufferAttribute(galaxyColors, 3));

  const galaxyMat = new THREE.PointsMaterial({
    size: 1.0,
    vertexColors: true,
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending
  });

  const galaxyBand = new THREE.Points(galaxyGeom, galaxyMat);
  gameScene.add(galaxyBand);

  // Space Dust Particles (Bụi không gian lơ lửng)
  const dustGeom = new THREE.BufferGeometry();
  const dustCount = 400;
  const dustPositions = new Float32Array(dustCount * 3);
  const dustVelocities = [];
  const dustColors = new Float32Array(dustCount * 3);
  const dustPalette = [
    new THREE.Color("#00f3ff"), // Cyan
    new THREE.Color("#d946ef"), // Pink/Purple
    new THREE.Color("#3b82f6"), // Blue
    new THREE.Color("#10b981")  // Emerald
  ];

  for (let i = 0; i < dustCount; i++) {
    dustPositions[i * 3] = (Math.random() - 0.5) * 80;
    dustPositions[i * 3 + 1] = Math.random() * 12 - 4; // floating slightly above/below deck
    dustPositions[i * 3 + 2] = (Math.random() - 0.5) * 80;
    
    dustVelocities.push({
      x: (Math.random() - 0.5) * 0.02,
      y: (Math.random() - 0.5) * 0.01,
      z: (Math.random() - 0.5) * 0.02
    });

    const c = dustPalette[Math.floor(Math.random() * dustPalette.length)];
    dustColors[i * 3] = c.r;
    dustColors[i * 3 + 1] = c.g;
    dustColors[i * 3 + 2] = c.b;
  }
  dustGeom.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
  dustGeom.setAttribute('color', new THREE.BufferAttribute(dustColors, 3));
  
  const dustMat = new THREE.PointsMaterial({
    size: 0.22,
    vertexColors: true,
    transparent: true,
    opacity: 0.65,
    blending: THREE.AdditiveBlending
  });
  gameSpaceDust = new THREE.Points(dustGeom, dustMat);
  gameSpaceDust.userData = { velocities: dustVelocities };
  gameScene.add(gameSpaceDust);

  // Dynamic Background Nebula / Gas Clouds
  gameNebulaClouds = [];
  const nebulaColors = ["#0284c7", "#7c3aed", "#0891b2"];
  const nebulaPositions = [
    { x: -70, y: -20, z: -100 },
    { x: 80, y: 30, z: -80 },
    { x: -50, y: 50, z: 90 }
  ];
  const nebulaScales = [150, 180, 160];

  for (let i = 0; i < 3; i++) {
    const nebTex = createNebulaTexture(nebulaColors[i]);
    const nebMat = new THREE.MeshBasicMaterial({
      map: nebTex,
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide
    });
    const nebGeom = new THREE.PlaneGeometry(nebulaScales[i], nebulaScales[i]);
    const nebMesh = new THREE.Mesh(nebGeom, nebMat);
    nebMesh.position.set(nebulaPositions[i].x, nebulaPositions[i].y, nebulaPositions[i].z);

    // Rotate to face scene center generally
    nebMesh.lookAt(0, 0, 0);
    gameScene.add(nebMesh);
    gameNebulaClouds.push(nebMesh);
  }

  // ==========================================================================
  // BACKGROUND COSMIC BODIES: BLACK HOLE & GALAXY PLANETS
  // ==========================================================================

  // 1. GIGANTIC DEEP-SPACE BLACK HOLE (Hố đen vũ trụ)
  gameBlackHoleGroup = new THREE.Group();
  gameBlackHoleGroup.position.set(-110, 40, -170);

  // The black hole singularity event horizon
  const singularityGeom = new THREE.SphereGeometry(14, 32, 32);
  const singularityMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
  const singularity = new THREE.Mesh(singularityGeom, singularityMat);
  gameBlackHoleGroup.add(singularity);

  // Glowing accretion disk (Đĩa bồi tụ)
  const accretionDiskGeom = new THREE.RingGeometry(15, 42, 64);
  const accretionDiskMat = new THREE.MeshBasicMaterial({
    map: createAccretionDiskTexture(),
    side: THREE.DoubleSide,
    transparent: true,
    blending: THREE.AdditiveBlending,
    opacity: 0.9
  });
  const accretionDisk = new THREE.Mesh(accretionDiskGeom, accretionDiskMat);
  accretionDisk.name = "accretion_disk";
  accretionDisk.rotation.x = Math.PI / 2.6;
  accretionDisk.rotation.y = Math.PI / 12;
  gameBlackHoleGroup.add(accretionDisk);

  // Outer gravitational lensing aura (Hào quang bẻ cong ánh sáng)
  const holeAuraGeom = new THREE.SphereGeometry(18, 32, 32);
  const holeAuraMat = new THREE.MeshBasicMaterial({
    color: 0xef4444, // Red glow
    transparent: true,
    opacity: 0.12,
    blending: THREE.AdditiveBlending
  });
  const holeAura = new THREE.Mesh(holeAuraGeom, holeAuraMat);
  gameBlackHoleGroup.add(holeAura);

  gameScene.add(gameBlackHoleGroup);

  // 2. BACKGROUND ORBITING PLANETS
  gameBgPlanets = [];

  // Planet A: Ice Gas Giant (Hành tinh băng khổng lồ)
  const planetAGroup = new THREE.Group();
  planetAGroup.position.set(100, 25, -130);

  const planetAGeom = new THREE.SphereGeometry(11, 32, 32);
  const planetAMat = new THREE.MeshBasicMaterial({ map: createGasGiantTexture() });
  const planetAMesh = new THREE.Mesh(planetAGeom, planetAMat);
  planetAMesh.name = "sphere";
  planetAGroup.add(planetAMesh);

  // Ice Rings
  const ringAGeom = new THREE.RingGeometry(13.5, 22, 64);
  const ringAMat = new THREE.MeshBasicMaterial({
    color: 0x06b6d4,
    transparent: true,
    opacity: 0.4,
    side: THREE.DoubleSide
  });
  const ringAMesh = new THREE.Mesh(ringAGeom, ringAMat);
  ringAMesh.rotation.x = Math.PI / 2.3;
  ringAMesh.rotation.y = Math.PI / 8;
  planetAGroup.add(ringAMesh);

  gameScene.add(planetAGroup);
  gameBgPlanets.push(planetAGroup);

  // Planet B: Lava/Magma Volcanic Planet (Hành tinh dung nham)
  const planetBGroup = new THREE.Group();
  planetBGroup.position.set(-90, -20, 120);

  const planetBGeom = new THREE.SphereGeometry(8, 32, 32);
  const planetBMat = new THREE.MeshBasicMaterial({ map: createLavaPlanetTexture() });
  const planetBMesh = new THREE.Mesh(planetBGeom, planetBMat);
  planetBMesh.name = "sphere";
  planetBGroup.add(planetBMesh);

  gameScene.add(planetBGroup);
  gameBgPlanets.push(planetBGroup);

  // Planet C: Cyber Grid Matrix Planet (Hành tinh mạng công nghệ)
  const planetCGroup = new THREE.Group();
  planetCGroup.position.set(120, -10, 80);

  const planetCGeom = new THREE.SphereGeometry(6, 32, 32);
  const planetCMat = new THREE.MeshBasicMaterial({ color: 0x090d16 });
  const planetCMesh = new THREE.Mesh(planetCGeom, planetCMat);
  planetCMesh.name = "sphere";
  planetCGroup.add(planetCMesh);

  // Cyber grid shell
  const gridShellGeom = new THREE.SphereGeometry(7.0, 16, 16);
  const gridShellMat = new THREE.MeshBasicMaterial({
    color: 0x22c55e, // green tech glow
    wireframe: true,
    transparent: true,
    opacity: 0.25
  });
  const gridShellMesh = new THREE.Mesh(gridShellGeom, gridShellMat);
  gridShellMesh.name = "grid_shell";
  planetCGroup.add(gridShellMesh);

  gameScene.add(planetCGroup);
  gameBgPlanets.push(planetCGroup);

  // Grid floor helper
  gameGridHelper = new THREE.GridHelper(100, 50, 0xffffff, 0x444444);
  gameGridHelper.position.y = -1.5;
  gameScene.add(gameGridHelper);

  // Dynamic floor glow point light under player/active node
  gameFloorPointLight = new THREE.PointLight(0xffffff, 0, 50);
  gameFloorPointLight.position.set(0, -1.0, 0);
  gameScene.add(gameFloorPointLight);

  // Futuristic Canvas-Based Ground / Tech Grid Floor Deck
  const techCanvas = document.createElement("canvas");
  techCanvas.width = 1024;
  techCanvas.height = 1024;
  const ctx = techCanvas.getContext("2d");

  // Fill dark background
  ctx.fillStyle = "rgba(7, 10, 32, 0.55)";
  ctx.fillRect(0, 0, 1024, 1024);

  // Draw Hex grid texture in background
  const hexSize = 24;
  const hA = hexSize / 2;
  const hB = hexSize * Math.sqrt(3) / 2;
  ctx.strokeStyle = "rgba(255, 255, 255, 0.04)";
  ctx.lineWidth = 1;
  for (let y = -hB; y < 1024 + hB; y += hB * 2) {
    for (let x = -hexSize; x < 1024 + hexSize; x += hexSize * 3) {
      // Row 1
      ctx.beginPath();
      ctx.moveTo(x + hA, y);
      ctx.lineTo(x + hA + hexSize, y);
      ctx.lineTo(x + hA + hexSize + hA, y + hB);
      ctx.lineTo(x + hA + hexSize, y + hB + hB);
      ctx.lineTo(x + hA, y + hB + hB);
      ctx.lineTo(x - hA, y + hB);
      ctx.closePath();
      ctx.stroke();

      // Row 2 (offset)
      ctx.beginPath();
      ctx.moveTo(x + hA + hexSize * 1.5, y + hB);
      ctx.lineTo(x + hA + hexSize * 1.5 + hexSize, y + hB);
      ctx.lineTo(x + hA + hexSize * 1.5 + hexSize + hA, y + hB + hB);
      ctx.lineTo(x + hA + hexSize * 1.5 + hexSize, y + hB * 3);
      ctx.lineTo(x + hA + hexSize * 1.5, y + hB * 3);
      ctx.lineTo(x + hA + hexSize * 1.5 - hA, y + hB + hB);
      ctx.closePath();
      ctx.stroke();
    }
  }

  // Draw glowing cyan tech borders
  ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
  ctx.lineWidth = 4;
  ctx.strokeRect(16, 16, 992, 992);

  // Corner brackets
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 10;
  const bracketLen = 80;
  ctx.beginPath(); ctx.moveTo(16, 16 + bracketLen); ctx.lineTo(16, 16); ctx.lineTo(16 + bracketLen, 16); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(1008 - bracketLen, 16); ctx.lineTo(1008, 16); ctx.lineTo(1008, 16 + bracketLen); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(16, 1008 - bracketLen); ctx.lineTo(16, 1008); ctx.lineTo(16 + bracketLen, 1008); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(1008 - bracketLen, 1008); ctx.lineTo(1008, 1008); ctx.lineTo(1008, 1008 - bracketLen); ctx.stroke();

  // Central core docking base circle
  ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(512, 512, 60, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
  ctx.setLineDash([8, 12]);
  ctx.beginPath();
  ctx.arc(512, 512, 85, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // Concentric radar sector circles
  ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
  ctx.lineWidth = 2;
  const center = 512;
  const radiuses = [160, 320, 440];
  radiuses.forEach(r => {
    ctx.beginPath();
    ctx.arc(center, center, r, 0, Math.PI * 2);
    ctx.stroke();
  });

  // Center crosshair axis lines
  ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(512, 40); ctx.lineTo(512, 984);
  ctx.moveTo(40, 512); ctx.lineTo(984, 512);
  ctx.stroke();

  // Custom Node Target Landing Pads (Exact math alignment to 3D Nodes)
  const drawLandingPad = (cx, cy, label, colorHex) => {
     // Outer dashed ring
    ctx.strokeStyle = colorHex + "44";
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 8]);
    ctx.beginPath();
    ctx.arc(cx, cy, 64, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Inner solid ring
    ctx.strokeStyle = colorHex + "88";
    ctx.beginPath();
    ctx.arc(cx, cy, 54, 0, Math.PI * 2);
    ctx.stroke();

    // Crosshair ticks
    ctx.strokeStyle = colorHex + "aa";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - 76, cy); ctx.lineTo(cx - 60, cy);
    ctx.moveTo(cx + 60, cy); ctx.lineTo(cx + 76, cy);
    ctx.moveTo(cx, cy - 76); ctx.lineTo(cx, cy - 60);
    ctx.moveTo(cx, cy + 60); ctx.lineTo(cx, cy + 76);
    ctx.stroke();

    // Text label
    ctx.fillStyle = colorHex;
    ctx.font = "bold 13px monospace";
    ctx.textAlign = "center";
    ctx.fillText(label, cx, cy + 86);
  };

  // Draw landing pads dynamically for all 6 nodes
  nodeDefs.forEach((def, index) => {
    const cx = 512 + def.x * (1024 / 100);
    const cy = 512 + def.z * (1024 / 100);
    const label = `BAY 0${index + 1} // ${def.nameEn}`;
    drawLandingPad(cx, cy, label, "#" + def.color.toString(16).padStart(6, '0'));
  });

  // Draw Departure Gate (Exit Portal at randomized location)
  const portalCx = 512 + Math.sin(portalAngle) * portalDist * (1024 / 100);
  const portalCy = 512 + Math.cos(portalAngle) * portalDist * (1024 / 100);
  drawLandingPad(portalCx, portalCy, "DEPARTURE GATE // WARP GATE", "#f43f5e");

  // Telemetry indicators
  ctx.textAlign = "left";
  ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
  ctx.font = "bold 15px monospace";
  ctx.fillText("STATION CONTROL DECK AREA A-1 // SYS: SECURE", 40, 50);
  ctx.fillText("RADAR LINK STATUS: ONLINE // BEACON STABLE", 40, 75);

  ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
  ctx.fillText("DOCKING GRID: SYMMETRICAL SECTORS", 680, 50);
  ctx.fillText("POWER CORES: 98% FLUID REACTION", 680, 75);

  const floorTex = new THREE.CanvasTexture(techCanvas);
  const floorMat = new THREE.MeshBasicMaterial({
    map: floorTex,
    transparent: true,
    opacity: 0.75,
    side: THREE.DoubleSide
  });
  const floorGeom = new THREE.PlaneGeometry(100, 100);
  gameTechFloor = new THREE.Mesh(floorGeom, floorMat);
  gameTechFloor.rotation.x = Math.PI / 2;
  gameTechFloor.position.y = -1.48; // resting slightly above the gridHelper line floor
  gameScene.add(gameTechFloor);

  // Dynamic expanding radar energy pulse sweep ring
  const sweepGeom = new THREE.RingGeometry(0.9, 1.0, 64);
  const sweepMat = new THREE.MeshBasicMaterial({
    color: 0x00ffff,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0,
    depthWrite: false
  });
  gameSweepRing = new THREE.Mesh(sweepGeom, sweepMat);
  gameSweepRing.rotation.x = Math.PI / 2;
  gameSweepRing.position.set(0, -1.40, 0); // slightly above tech floor
  gameScene.add(gameSweepRing);

  // Perimeter neon fence posts & beacons (Skip node paths/walkways)
  gameFenceBeacons = [];
  gameWalkwayMeshes = [];
  const fenceGroup = new THREE.Group();
  const postGeom = new THREE.CylinderGeometry(0.04, 0.04, 1.0, 8);
  const postMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4, transparent: true, opacity: 0.8 });
  const beaconGeom = new THREE.SphereGeometry(0.08, 8, 8);

  const numPosts = 16;
  const fenceRadius = 33.0;
  for (let i = 0; i < numPosts; i++) {
    const angle = (i / numPosts) * Math.PI * 2;

    let closeToWalkway = false;
    for (let k = 0; k < nodeDefs.length; k++) {
      const def = nodeDefs[k];
      const targetAngle = Math.atan2(def.x, def.z);
      const diff = Math.min(
        Math.abs(angle - targetAngle),
        Math.abs(angle - targetAngle - Math.PI * 2),
        Math.abs(angle - targetAngle + Math.PI * 2)
      );
      if (diff < 0.25) {
        closeToWalkway = true;
        break;
      }
    }
    // Check exit portal walkway angle too
    const diffPortal = Math.min(
      Math.abs(angle - portalAngle),
      Math.abs(angle - portalAngle - Math.PI * 2),
      Math.abs(angle - portalAngle + Math.PI * 2)
    );
    if (diffPortal < 0.25) {
      closeToWalkway = true;
    }
    if (closeToWalkway) continue;

    const px = Math.cos(angle) * fenceRadius;
    const pz = Math.sin(angle) * fenceRadius;

    const postGroup = new THREE.Group();
    postGroup.position.set(px, -1.0, pz);

    const postMesh = new THREE.Mesh(postGeom, postMat);
    postGroup.add(postMesh);

    const beaconMat = new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.9 });
    const beaconMesh = new THREE.Mesh(beaconGeom, beaconMat);
    beaconMesh.position.y = 0.5;
    postGroup.add(beaconMesh);

    gameFenceBeacons.push(beaconMesh);
    fenceGroup.add(postGroup);
  }

  // Perimeter rails connecting fence posts
  const railsGeom = new THREE.TorusGeometry(33.0, 0.02, 4, 128);
  const railsMat = new THREE.MeshBasicMaterial({ color: 0x915eff, transparent: true, opacity: 0.35 });
  gamePerimeterRail = new THREE.Mesh(railsGeom, railsMat);
  gamePerimeterRail.rotation.x = Math.PI / 2;
  gamePerimeterRail.position.y = -1.0;
  fenceGroup.add(gamePerimeterRail);

  gameScene.add(fenceGroup);

  // Multi-layered Gyroscopic Energy Reactor Core deep below grid floor
  gameUnderGlobe = new THREE.Group();
  gameUnderGlobe.position.set(0, -28, 0); // Positioned deep below grid floor

  // 1. Pulsing Inner Core Singularity (Core Sphere)
  const innerCoreGeom = new THREE.SphereGeometry(8, 16, 16);
  const innerCoreMat = new THREE.MeshBasicMaterial({
    color: 0xd946ef,
    wireframe: true,
    transparent: true,
    opacity: 0.35
  });
  const innerCore = new THREE.Mesh(innerCoreGeom, innerCoreMat);
  innerCore.name = "inner_core";
  gameUnderGlobe.add(innerCore);

  // Inner solid core center light orb
  const innerSolidGeom = new THREE.SphereGeometry(3.5, 16, 16);
  const innerSolidMat = new THREE.MeshBasicMaterial({
    color: 0xff00ff,
    transparent: true,
    opacity: 0.6
  });
  const innerSolid = new THREE.Mesh(innerSolidGeom, innerSolidMat);
  innerCore.add(innerSolid);

  // 2. Middle Holographic Grid Matrix Shell
  const globeGeom = new THREE.SphereGeometry(24, 24, 24);
  const globeMat = new THREE.MeshBasicMaterial({
    color: 0x06b6d4,
    wireframe: true,
    transparent: true,
    opacity: 0.12
  });
  const middleShell = new THREE.Mesh(globeGeom, globeMat);
  gameUnderGlobe.add(middleShell);

  // 3. Gyroscopic Gimbal Rings (3-axis Armillary rings)
  // Axis 1: Equator (Horizontal Ring)
  const ringGeom1 = new THREE.TorusGeometry(26, 0.25, 8, 64);
  const ringMat1 = new THREE.MeshBasicMaterial({
    color: 0x915eff,
    transparent: true,
    opacity: 0.3
  });
  const gimbalRing1 = new THREE.Mesh(ringGeom1, ringMat1);
  gimbalRing1.name = "gimbal_1";
  gimbalRing1.rotation.x = Math.PI / 2;
  gameUnderGlobe.add(gimbalRing1);

  // Axis 2: Meridian Y (Vertical X-aligned Ring)
  const ringGeom2 = new THREE.TorusGeometry(26.4, 0.2, 8, 64);
  const ringMat2 = new THREE.MeshBasicMaterial({
    color: 0x06b6d4,
    transparent: true,
    opacity: 0.25
  });
  const gimbalRing2 = new THREE.Mesh(ringGeom2, ringMat2);
  gimbalRing2.name = "gimbal_2";
  gimbalRing2.rotation.y = Math.PI / 2;
  gameUnderGlobe.add(gimbalRing2);

  // Axis 3: Meridian Z (Vertical Z-aligned Ring)
  const ringGeom3 = new THREE.TorusGeometry(26.8, 0.2, 8, 64);
  const ringMat3 = new THREE.MeshBasicMaterial({
    color: 0xf43f5e,
    transparent: true,
    opacity: 0.25
  });
  const gimbalRing3 = new THREE.Mesh(ringGeom3, ringMat3);
  gimbalRing3.name = "gimbal_3";
  gameUnderGlobe.add(gimbalRing3);

  gameScene.add(gameUnderGlobe);

  // Destination indicator mesh (LMHT green arrows)
  const indGeom = new THREE.PlaneGeometry(1.6, 1.6);
  const indMat = new THREE.MeshBasicMaterial({
    map: createClickIndicatorTexture(),
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });
  moveIndicator = new THREE.Mesh(indGeom, indMat);
  moveIndicator.rotation.x = Math.PI / 2;
  moveIndicator.position.set(0, -1.47, 0); // Flat on grid floor (above gridHelper which is at -1.5)
  moveIndicator.visible = false;
  gameScene.add(moveIndicator);

  // Create player - Dark Cosmic Jhin (In-game model style)
  gamePlayer = new THREE.Group();
  const darkMat = new THREE.MeshPhongMaterial({ color: 0x0a0420, shininess: 60, specular: 0x4c1d95 });
  const goldMat = new THREE.MeshPhongMaterial({ color: 0xd97706, shininess: 150, specular: 0xffffff });

  // 1. LEGS (visible, armored, with golden boots)
  const legGeom = new THREE.CylinderGeometry(0.06, 0.045, 0.65, 8);
  const legMat = new THREE.MeshPhongMaterial({ color: 0x1e1b4b, shininess: 100, specular: 0x6d28d9 });
  const bootGeom = new THREE.BoxGeometry(0.11, 0.09, 0.2);

  const leftLegGroup = new THREE.Group();
  leftLegGroup.position.set(-0.14, -1.3, 0);
  leftLegGroup.name = "leftLegGroup";
  const leftLegMesh = new THREE.Mesh(legGeom, legMat);
  leftLegMesh.position.y = -0.32;
  leftLegGroup.add(leftLegMesh);
  const leftBoot = new THREE.Mesh(bootGeom, goldMat);
  leftBoot.position.set(0, -0.65, 0.04);
  leftLegGroup.add(leftBoot);
  gamePlayer.add(leftLegGroup);

  const rightLegGroup = new THREE.Group();
  rightLegGroup.position.set(0.14, -1.3, 0);
  rightLegGroup.name = "rightLegGroup";
  const rightLegMesh = new THREE.Mesh(legGeom, legMat);
  rightLegMesh.position.y = -0.32;
  rightLegGroup.add(rightLegMesh);
  const rightBoot = new THREE.Mesh(bootGeom, goldMat);
  rightBoot.position.set(0, -0.65, 0.04);
  rightLegGroup.add(rightBoot);
  gamePlayer.add(rightLegGroup);

  // 2. CAPE (wide flowing cloak behind the character)
  const capeMat = new THREE.MeshPhongMaterial({ 
    color: 0x0f0828, shininess: 40, specular: 0x4c1d95,
    side: THREE.DoubleSide 
  });

  // Main cape panel (wide, attached at shoulders, flows down)
  const capeMainGeom = new THREE.BoxGeometry(0.5, 1.1, 0.03);
  const capeMain = new THREE.Mesh(capeMainGeom, capeMat);
  capeMain.position.set(0, -1.1, -0.2);
  capeMain.name = "capeMain";
  gamePlayer.add(capeMain);

  // Left cape flap
  const capeFlap = new THREE.BoxGeometry(0.2, 0.85, 0.025);
  const coatL = new THREE.Mesh(capeFlap, capeMat);
  coatL.position.set(-0.28, -1.2, -0.22);
  coatL.rotation.y = 0.15;
  coatL.name = "coatLeft";
  gamePlayer.add(coatL);

  // Right cape flap
  const coatR = new THREE.Mesh(capeFlap, capeMat);
  coatR.position.set(0.28, -1.2, -0.22);
  coatR.rotation.y = -0.15;
  coatR.name = "coatRight";
  gamePlayer.add(coatR);

  // 3. TORSO
  const torsoGeom = new THREE.BoxGeometry(0.46, 0.5, 0.26);
  const torsoMesh = new THREE.Mesh(torsoGeom, darkMat);
  torsoMesh.position.y = -0.8;
  torsoMesh.name = "torso";
  gamePlayer.add(torsoMesh);

  // Chest core (glowing crimson)
  const chestCore = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 12), new THREE.MeshBasicMaterial({ color: 0xdc2626 }));
  chestCore.position.set(0, -0.72, 0.14);
  chestCore.name = "chestCore";
  gamePlayer.add(chestCore);

  // V-trim on chest
  const trimMat = new THREE.MeshPhongMaterial({ color: 0x94a3b8, shininess: 200 });
  const trimL = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.02, 0.02), trimMat);
  trimL.position.set(-0.07, -0.67, 0.14); trimL.rotation.z = -0.4;
  gamePlayer.add(trimL);
  const trimR = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.02, 0.02), trimMat);
  trimR.position.set(0.07, -0.67, 0.14); trimR.rotation.z = 0.4;
  gamePlayer.add(trimR);

  // 4. HEAD GROUP
  const headGroup = new THREE.Group();
  headGroup.position.set(0, -0.28, 0);
  headGroup.name = "headGroup";

  // Head sphere
  const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.24, 16, 16), new THREE.MeshPhongMaterial({ color: 0x080316 }));
  headGroup.add(headMesh);

  // Hood
  const hoodMesh = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.7, 8), new THREE.MeshPhongMaterial({ color: 0x0a0420, shininess: 60, specular: 0x312e81 }));
  hoodMesh.position.set(0, 0.18, -0.04);
  hoodMesh.rotation.x = -0.15;
  headGroup.add(hoodMesh);

  // Hood inner glow
  const hoodInner = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.25, 8), new THREE.MeshBasicMaterial({ color: 0x991b1b, transparent: true, opacity: 0.4 }));
  hoodInner.position.set(0, -0.06, 0.06);
  headGroup.add(hoodInner);

  // Forehead gem
  const gemMesh = new THREE.Mesh(new THREE.OctahedronGeometry(0.06), new THREE.MeshBasicMaterial({ color: 0xff2244 }));
  gemMesh.position.set(0, 0.15, 0.22);
  gemMesh.name = "starCrown";
  headGroup.add(gemMesh);

  // Mask
  const maskMat = new THREE.MeshPhongMaterial({ color: 0xd1d5db, shininess: 200, specular: 0xffffff });
  const maskMesh = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.14, 0.04), maskMat);
  maskMesh.position.set(0, -0.03, 0.22);
  maskMesh.name = "mask";
  headGroup.add(maskMesh);
  // Chin
  const chinMesh = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.1, 3), maskMat);
  chinMesh.position.set(0, -0.13, 0.22); chinMesh.rotation.x = Math.PI;
  headGroup.add(chinMesh);

  // Sniper eye
  const eyeMesh = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 8), new THREE.MeshBasicMaterial({ color: 0xff0040 }));
  eyeMesh.position.set(0.05, -0.01, 0.26);
  headGroup.add(eyeMesh);

  gamePlayer.add(headGroup);

  // 5. SHOULDER PAD (asymmetric, right side massive)
  const shoulderPadGroup = new THREE.Group();
  shoulderPadGroup.name = "shoulderPad";
  shoulderPadGroup.position.set(0.36, -0.48, 0);

  const padShell = new THREE.Mesh(
    new THREE.SphereGeometry(0.22, 12, 12, 0, Math.PI * 2, 0, Math.PI / 1.5),
    new THREE.MeshPhongMaterial({ color: 0x1e1b4b, shininess: 120, specular: 0x8b5cf6, side: THREE.DoubleSide })
  );
  shoulderPadGroup.add(padShell);
  const padOrb = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 12), new THREE.MeshBasicMaterial({ color: 0xf97316 }));
  padOrb.position.y = 0.02;
  shoulderPadGroup.add(padOrb);
  const padRing = new THREE.Mesh(new THREE.TorusGeometry(0.19, 0.018, 8, 16), goldMat);
  padRing.rotation.x = Math.PI / 3;
  shoulderPadGroup.add(padRing);
  gamePlayer.add(shoulderPadGroup);

  // Small left shoulder
  const lShoulder = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 8), new THREE.MeshPhongMaterial({ color: 0x1e1b4b, shininess: 80, specular: 0x6d28d9 }));
  lShoulder.position.set(-0.32, -0.54, 0);
  gamePlayer.add(lShoulder);

  // 6. ARMS
  const armGeom = new THREE.CylinderGeometry(0.04, 0.035, 0.42, 8);

  const leftArmGroup = new THREE.Group();
  leftArmGroup.position.set(-0.28, -0.6, 0);
  leftArmGroup.name = "leftArmGroup";
  const leftArmMesh = new THREE.Mesh(armGeom, darkMat);
  leftArmMesh.position.y = -0.21;
  leftArmGroup.add(leftArmMesh);
  gamePlayer.add(leftArmGroup);

  const rightArmGroup = new THREE.Group();
  rightArmGroup.position.set(0.28, -0.6, 0);
  rightArmGroup.name = "rightArmGroup";
  const rightArmMesh = new THREE.Mesh(armGeom, goldMat);
  rightArmMesh.position.y = -0.21;
  rightArmGroup.add(rightArmMesh);
  // Gun barrel in right hand
  const gunBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.025, 0.35, 6), new THREE.MeshPhongMaterial({ color: 0x312e81, shininess: 120 }));
  gunBarrel.position.set(0, -0.38, 0.12);
  gunBarrel.rotation.x = Math.PI / 4;
  rightArmGroup.add(gunBarrel);
  gamePlayer.add(rightArmGroup);

  // 7. ORBITAL RINGS (golden rings spinning around the character base - signature look!)
  const orbitGroup = new THREE.Group();
  orbitGroup.name = "orbitRings";
  orbitGroup.position.y = -1.2;

  const orbitMat = new THREE.MeshBasicMaterial({ color: 0xd97706, transparent: true, opacity: 0.7 });
  const ring1 = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.012, 8, 32), orbitMat);
  ring1.rotation.x = Math.PI / 2.2;
  ring1.name = "ring1";
  orbitGroup.add(ring1);

  const ring2 = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.01, 8, 32), orbitMat);
  ring2.rotation.x = Math.PI / 2.5;
  ring2.rotation.y = Math.PI / 3;
  ring2.name = "ring2";
  orbitGroup.add(ring2);

  gamePlayer.add(orbitGroup);

  // 8. FLOATING ORBS (purple spheres orbiting around)
  const orbGroup = new THREE.Group();
  orbGroup.name = "floatingOrbs";
  const orbMat = new THREE.MeshBasicMaterial({ color: 0xa855f7 });
  [0, Math.PI * 0.66, Math.PI * 1.33].forEach((angle, i) => {
    const orb = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), orbMat);
    orb.position.set(Math.cos(angle) * 0.6, -0.8 + i * 0.15, Math.sin(angle) * 0.6);
    orb.name = `orb_${i}`;
    orbGroup.add(orb);
  });
  gamePlayer.add(orbGroup);

  // 9. COSMIC CAPE SHARDS
  const shardsGroup = new THREE.Group();
  shardsGroup.name = "shards";
  const shardMat = new THREE.MeshPhongMaterial({ color: 0xd946ef, emissive: 0x6b21a8, transparent: true, opacity: 0.85 });
  [
    { x: -0.3, y: -0.7, z: -0.3 },
    { x: 0, y: -0.85, z: -0.4 },
    { x: 0.3, y: -0.7, z: -0.3 }
  ].forEach((pos, idx) => {
    const shard = new THREE.Mesh(new THREE.OctahedronGeometry(0.07), shardMat);
    shard.position.set(pos.x, pos.y, pos.z);
    shard.name = `shard_${idx}`;
    shardsGroup.add(shard);
  });
  gamePlayer.add(shardsGroup);

  // 10. Lighting
  const playerLight = new THREE.PointLight(0xd946ef, 2.5, 8);
  playerLight.position.set(0, -0.5, 0.2);
  gamePlayer.add(playerLight);
  gamePlayer.add(new THREE.PointLight(0xf97316, 1.5, 3)).position.set(0.36, -0.48, 0);

  // 11. Label - just "YOU"
  const playerLabel = createTextSprite('YOU', '#d946ef');
  playerLabel.position.y = 1.0;
  playerLabel.name = "player_label";
  gamePlayer.add(playerLabel);

  // Scale player group up by 68% (initial 40% + 20% additional)
  gamePlayer.scale.set(1.68, 1.68, 1.68);

  gameScene.add(gamePlayer);
  const earthDef = nodeDefs.find(def => def.id === "home");
  if (earthDef) {
    const distToEarth = Math.hypot(earthDef.x, earthDef.z);
    if (distToEarth > 0) {
      // Spawn 3.0 units away from Earth, directly within the active connection range (3.2 units)
      const ratio = (distToEarth - 3.0) / distToEarth;
      gamePlayer.position.set(earthDef.x * ratio, 1.78, earthDef.z * ratio);
    } else {
      gamePlayer.position.set(0, 1.78, 0);
    }
  } else {
    gamePlayer.position.set(0, 1.78, 0);
  }

  // ==========================================================================
  // CENTRAL SPACE STATION COMMAND CORE & CONNECTING BRIDGES
  // ==========================================================================
  centralCoreGroup = new THREE.Group();
  centralCoreGroup.position.set(0, 0, 0);

  // Central Sun (Mặt trời)
  const sunGeom = new THREE.SphereGeometry(3.2, 32, 32);
  const initExploredCount = ["home", "about", "skills", "experience", "projects", "testimonials", "contact", "cv"].filter(id => visitedNodes.includes(id)).length;
  const initSunEnergyRatio = initExploredCount / 8;
  const sunMat = new THREE.MeshBasicMaterial({
    map: createSunTexture(initSunEnergyRatio),
  });
  const sunMesh = new THREE.Mesh(sunGeom, sunMat);
  sunMesh.name = "sun_mesh";
  sunMesh.position.y = 0.5; // Raised slightly above deck level
  centralCoreGroup.add(sunMesh);

  // Solar Corona Atmosphere Glow
  const coronaGeom = new THREE.SphereGeometry(3.6, 32, 32);
  const coronaMat = new THREE.MeshBasicMaterial({
    color: 0xf59e0b,
    transparent: true,
    opacity: 0.35,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide
  });
  const coronaMesh = new THREE.Mesh(coronaGeom, coronaMat);
  coronaMesh.position.y = 0.5;
  centralCoreGroup.add(coronaMesh);

  // Sun Light source radiating from center
  const sunLight = new THREE.PointLight(0xf59e0b, 2.0, 70, 0.8);
  sunLight.position.set(0, 0.5, 0);
  centralCoreGroup.add(sunLight);

  gameScene.add(centralCoreGroup);

  // High-Tech Metal Walkway / Connectors to Node Platforms
  nodeDefs.forEach(def => {
    const dist = Math.hypot(def.x, def.z);
    const dx = def.x / dist;
    const dz = def.z / dist;

    // Calculate space between center reactor (radius ~2.0) and node base (radius ~2.5)
    const len = dist - 2.0 - 2.5;
    const bridgeDist = 2.0 + len / 2;
    const px = bridgeDist * dx;
    const pz = bridgeDist * dz;

    // Create animated canvas texture for the walkway
    const walkwayTex = createWalkwayTexture();
    walkwayTex.wrapT = THREE.RepeatWrapping;
    walkwayTex.repeat.set(1, len / 1.5); // Repeat chevron pattern along length
    gameWalkwayTextures.push(walkwayTex);

    const walkwayMat = new THREE.MeshBasicMaterial({
      map: walkwayTex,
      transparent: true,
      opacity: 0.85
    });

    const walkwayGeom = new THREE.BoxGeometry(0.8, 0.08, len);
    const walkway = new THREE.Mesh(walkwayGeom, walkwayMat);
    walkway.position.set(px, -1.35, pz);
    walkway.rotation.y = Math.atan2(def.x, def.z);

    // Add side glowing neon laser guide rails
    const railGeom = new THREE.BoxGeometry(0.04, 0.12, len);
    const railMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });

    const leftRail = new THREE.Mesh(railGeom, railMat);
    leftRail.position.set(-0.42, 0.06, 0);
    walkway.add(leftRail);

    const rightRail = leftRail.clone();
    rightRail.position.x = 0.42;
    walkway.add(rightRail);

    walkway.name = "walkway_" + def.id;
    walkway.visible = visitedNodes.includes(def.id) || def.id === "home";

    gameScene.add(walkway);
    gameWalkwayMeshes.push(walkway);
  });

  // Walkway to Exit Portal (Portal at randomized coordinates)
  const portalLen = portalDist - 2.0 - 3.2; // portal base radius is 3.2
  const portalBridgeDist = 2.0 + portalLen / 2;
  const portalPx = portalBridgeDist * Math.sin(portalAngle);
  const portalPz = portalBridgeDist * Math.cos(portalAngle);

  const portalWalkwayTex = createWalkwayTexture();
  portalWalkwayTex.wrapT = THREE.RepeatWrapping;
  portalWalkwayTex.repeat.set(1, portalLen / 1.5);
  gameWalkwayTextures.push(portalWalkwayTex);

  const portalWalkwayMat = new THREE.MeshBasicMaterial({
    map: portalWalkwayTex,
    transparent: true,
    opacity: 0.85
  });

  const portalWalkway = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.08, portalLen), portalWalkwayMat);
  portalWalkway.position.set(portalPx, -1.35, portalPz);
  portalWalkway.rotation.y = portalAngle;

  // Side glowing pink guide rails for exit portal bridge
  const portalRailMat = new THREE.MeshBasicMaterial({ color: 0xf43f5e });
  const portalLeftRail = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.12, portalLen), portalRailMat);
  portalLeftRail.position.set(-0.42, 0.06, 0);
  portalWalkway.add(portalLeftRail);

  const portalRightRail = portalLeftRail.clone();
  portalRightRail.position.x = 0.42;
  portalWalkway.add(portalRightRail);

  gameScene.add(portalWalkway);
  gameWalkwayMeshes.push(portalWalkway);

  // Build Nodes/Platforms
  gameNodes = [];
  nodeDefs.forEach(def => {
    const nodeGroup = new THREE.Group();
    nodeGroup.position.set(def.x, 0, def.z);

    // Base cylinder (Scaled up to 3.5 radius)
    const baseGeom = new THREE.CylinderGeometry(3.5, 3.8, 0.5, 6);
    const baseMat = new THREE.MeshPhongMaterial({ color: 0x151030, shininess: 50, emissive: 0x0a0518 });
    const baseMesh = new THREE.Mesh(baseGeom, baseMat);
    baseMesh.name = "node_base";
    baseMesh.position.y = -1.3;
    nodeGroup.add(baseMesh);

    // Outer border ring (Scaled up to 3.7 radius)
    const borderGeom = new THREE.TorusGeometry(3.7, 0.1, 8, 32);
    const borderMat = new THREE.MeshBasicMaterial({ color: def.color });
    const borderMesh = new THREE.Mesh(borderGeom, borderMat);
    borderMesh.name = "pad_ring";
    borderMesh.rotation.x = Math.PI / 2;
    borderMesh.position.y = -1.1;
    nodeGroup.add(borderMesh);

    // 3D Sci-Fi Planet creation
    let iconMesh = new THREE.Group();
    iconMesh.position.y = 0.3;

    // Core planet sphere with relative physical size scaling & procedural textures
    let planetRadius = 1.4;
    let planetTex = null;

    if (def.id === "home") {
      planetRadius = 1.4; // Earth
      planetTex = createEarthTexture();
    } else if (def.id === "about") {
      planetRadius = 1.2; // Venus
      planetTex = createVenusTexture();
    } else if (def.id === "skills") {
      planetRadius = 1.0; // Mars
      planetTex = createMarsTexture();
    } else if (def.id === "experience") {
      planetRadius = 2.0; // Jupiter
      planetTex = createJupiterTexture();
    } else if (def.id === "projects") {
      planetRadius = 1.7; // Saturn
      planetTex = createSaturnTexture();
    } else if (def.id === "testimonials") {
      planetRadius = 1.4; // Uranus
      planetTex = createUranusTexture();
    } else if (def.id === "contact") {
      planetRadius = 1.4; // Neptune
      planetTex = createNeptuneTexture();
    }

    const coreGeom = new THREE.SphereGeometry(planetRadius, 32, 32);
    const coreMat = new THREE.MeshPhongMaterial({
      map: planetTex,
      shininess: 40,
      specular: 0x111111
    });
    const coreMesh = new THREE.Mesh(coreGeom, coreMat);
    coreMesh.name = "planet_core";
    iconMesh.add(coreMesh);

    // Additive glow mesh for hover effect
    const glowGeom = new THREE.SphereGeometry(planetRadius * 1.35, 32, 32);
    const glowMat = new THREE.MeshBasicMaterial({
      color: def.color,
      transparent: true,
      opacity: 0, // start invisible, fade in on hover
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide
    });
    const glowMesh = new THREE.Mesh(glowGeom, glowMat);
    glowMesh.name = "hover_glow";
    iconMesh.add(glowMesh);

    // Unique orbiting features matching actual planet properties
    if (def.id === "home") {
      // Earth: Atmosphere glow + Orbiting Moon!
      const hazeGeom = new THREE.SphereGeometry(planetRadius * 1.08, 32, 32);
      const hazeMat = new THREE.MeshBasicMaterial({
        color: 0x3b82f6,
        transparent: true,
        opacity: 0.25,
        blending: THREE.AdditiveBlending
      });
      const hazeMesh = new THREE.Mesh(hazeGeom, hazeMat);
      iconMesh.add(hazeMesh);

      const moonGroup = new THREE.Group();
      moonGroup.name = "sub_moons";
      const moonGeom = new THREE.SphereGeometry(0.25, 12, 12);
      const moonMat = new THREE.MeshPhongMaterial({ color: 0xcbd5e1 });
      const moon = new THREE.Mesh(moonGeom, moonMat);
      moon.position.set(2.4, 0.2, 0);
      moonGroup.add(moon);
      iconMesh.add(moonGroup);
    } else if (def.id === "about") {
      // Venus yellowish atmospheric haze
      const hazeGeom = new THREE.SphereGeometry(planetRadius * 1.08, 32, 32);
      const hazeMat = new THREE.MeshBasicMaterial({
        color: 0xfef08a,
        transparent: true,
        opacity: 0.15,
        blending: THREE.AdditiveBlending
      });
      const hazeMesh = new THREE.Mesh(hazeGeom, hazeMat);
      iconMesh.add(hazeMesh);

    } else if (def.id === "skills") {
      // Mars: Phobos and Deimos orbiting moons
      const moonGroup = new THREE.Group();
      moonGroup.name = "sub_moons";
      const moonGeom = new THREE.SphereGeometry(0.18, 8, 8);
      const moonMat = new THREE.MeshPhongMaterial({ color: 0xa8a29e });
      
      const phobos = new THREE.Mesh(moonGeom, moonMat);
      phobos.position.set(1.6, 0.2, 0);
      moonGroup.add(phobos);

      const deimos = new THREE.Mesh(moonGeom, moonMat);
      deimos.position.set(-2.0, -0.2, 0.4);
      moonGroup.add(deimos);

      iconMesh.add(moonGroup);

    } else if (def.id === "experience") {
      // Jupiter: 4 Galilean moons
      const moonGroup = new THREE.Group();
      moonGroup.name = "sub_moons";
      const moonGeom = new THREE.SphereGeometry(0.2, 8, 8);
      const moonMat1 = new THREE.MeshPhongMaterial({ color: 0x93c5fd }); // Io
      const moonMat2 = new THREE.MeshPhongMaterial({ color: 0xfde047 }); // Europa
      const moonMat3 = new THREE.MeshPhongMaterial({ color: 0xd97706 }); // Ganymede
      const moonMat4 = new THREE.MeshPhongMaterial({ color: 0xcbd5e1 }); // Callisto

      const io = new THREE.Mesh(moonGeom, moonMat1); io.position.set(2.6, 0.1, 0); moonGroup.add(io);
      const europa = new THREE.Mesh(moonGeom, moonMat2); europa.position.set(-2.9, 0.3, 0.5); moonGroup.add(europa);
      const ganymede = new THREE.Mesh(moonGeom, moonMat3); ganymede.position.set(3.4, -0.2, -0.6); moonGroup.add(ganymede);
      const callisto = new THREE.Mesh(moonGeom, moonMat4); callisto.position.set(-3.8, -0.4, -1.0); moonGroup.add(callisto);

      iconMesh.add(moonGroup);

    } else if (def.id === "projects") {
      // Saturn: Beautiful tilted rings
      const saturnRingsGeom = new THREE.RingGeometry(2.1, 3.8, 64);
      const saturnRingsMat = new THREE.MeshPhongMaterial({
        color: 0xe2ba86,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.8
      });
      const saturnRingsMesh = new THREE.Mesh(saturnRingsGeom, saturnRingsMat);
      saturnRingsMesh.rotation.x = Math.PI / 2.5; // Tilted rings
      saturnRingsMesh.rotation.y = Math.PI / 8;
      iconMesh.add(saturnRingsMesh);

    } else if (def.id === "testimonials") {
      // Uranus: Vertical rings
      const uranusRingsGeom = new THREE.RingGeometry(1.8, 2.5, 64);
      const uranusRingsMat = new THREE.MeshPhongMaterial({
        color: 0xa5f3fc,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.45
      });
      const uranusRingsMesh = new THREE.Mesh(uranusRingsGeom, uranusRingsMat);
      uranusRingsMesh.rotation.y = Math.PI / 2.2; // vertical rings!
      iconMesh.add(uranusRingsMesh);

    } else if (def.id === "contact") {
      // Neptune deep blue atmosphere haze
      const hazeGeom = new THREE.SphereGeometry(planetRadius * 1.1, 32, 32);
      const hazeMat = new THREE.MeshBasicMaterial({
        color: 0x3b82f6,
        transparent: true,
        opacity: 0.2,
        blending: THREE.AdditiveBlending
      });
      const hazeMesh = new THREE.Mesh(hazeGeom, hazeMat);
      iconMesh.add(hazeMesh);
    }

    nodeGroup.add(iconMesh);

    // Floating text label sprite above planet (lifted higher to y = 2.8)
    const nameSprite = createTextSprite(currentLang === 'vi' ? def.name : def.nameEn, '#' + def.color.toString(16).padStart(6, '0'));
    nameSprite.position.y = 3.5;
    nameSprite.name = "name_label";
    nodeGroup.add(nameSprite);

    // Beam cylinder light
    const beamGeom = new THREE.CylinderGeometry(2.2, 2.2, 4.5, 16, 1, true);
    const beamMat = new THREE.MeshBasicMaterial({
      color: def.color,
      transparent: true,
      opacity: 0.15,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending
    });
    const beamMesh = new THREE.Mesh(beamGeom, beamMat);
    beamMesh.name = "node_beam";
    beamMesh.position.y = 0.8;
    nodeGroup.add(beamMesh);

    gameScene.add(nodeGroup);

    gameNodes.push({
      group: nodeGroup,
      mesh: iconMesh,
      sprite: nameSprite,
      def: def
    });
  });

  // Initialize Pluto lock state
  updatePlutoLockState();

  // Listeners
  window.addEventListener("keydown", handleGameKeyDown);
  window.addEventListener("keyup", handleGameKeyUp);
  window.addEventListener("resize", handleGameResize);

  // Drag rotate and right-click move listeners
  let isDragging = false;
  let prevX = 0;
  let prevY = 0;
  let dragStartPos = { x: 0, y: 0 };
  let hasDragged = false;

  window.addEventListener("pointerdown", (e) => {
    if (e.target.id === "canvas-game-3d") {
      if (e.button === 0 || e.pointerType === "touch") {
        isDragging = true;
        hasDragged = false;
        prevX = e.clientX;
        prevY = e.clientY;
        dragStartPos = { x: e.clientX, y: e.clientY };
        canvas.style.cursor = 'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'32\' height=\'32\' viewBox=\'0 0 32 32\'><path d=\'M16,4 L11,9 L15,9 L15,15 L9,15 L9,11 L4,16 L9,21 L9,17 L15,17 L15,23 L11,23 L16,28 L21,23 L17,23 L17,17 L23,17 L23,21 L28,16 L23,11 L23,15 L17,15 L17,9 L21,9 Z\' fill=\'%2300f3ff\' stroke=\'%23111827\' stroke-width=\'1.5\'/></svg>") 16 16, auto';
      }
    }
  });

  // Dedicated mousedown listener for right-click click-to-move to guarantee compatibility
  canvas.addEventListener("mousedown", (e) => {
    if (e.button === 2) {
      const rect = canvas.getBoundingClientRect();
      const mouse = new THREE.Vector2();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, gameCamera);

      const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
      const targetPoint = new THREE.Vector3();
      raycaster.ray.intersectPlane(plane, targetPoint);

      gamePlayerTargetPos = {
        x: targetPoint.x,
        z: targetPoint.z
      };

      // Position and reveal the LMHT green movement indicator
      if (moveIndicator) {
        moveIndicator.position.set(gamePlayerTargetPos.x, -1.47, gamePlayerTargetPos.z);
        moveIndicator.visible = true;
        moveIndicator.scale.set(1.6, 1.6, 1.6);
        moveIndicator.material.opacity = 1.0;
      }

      if (typeof playBeep === 'function') {
        playBeep(650, 0.08, 'sine', 0.02);
      }
      if (typeof playWhooshSound === 'function') {
        playWhooshSound();
      }
    }
  });

  canvas.addEventListener("wheel", (e) => {
    // Zoom in or out by adjusting target camera radius
    gameCameraTargetRadius += e.deltaY * 0.012;
    // Limit zoom distance (6 is close, 30 is far)
    gameCameraTargetRadius = Math.max(6, Math.min(30, gameCameraTargetRadius));
  }, { passive: true });

  canvas.addEventListener("pointermove", (e) => {
    if (!gameCamera) return;
    const rect = canvas.getBoundingClientRect();
    const mouse = new THREE.Vector2();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, gameCamera);

    const targets = [];
    gameNodes.forEach(node => {
      node.group.traverse(child => {
        if (child.isMesh || child.isSprite) {
          targets.push(child);
          child.userData.nodeRef = node;
          child.userData.isPortal = false;
        }
      });
    });

    if (gamePortalGroup) {
      gamePortalGroup.traverse(child => {
        if (child.isMesh || child.isSprite) {
          targets.push(child);
          child.userData.nodeRef = null;
          child.userData.isPortal = true;
        }
      });
    }

    const isSunClickable = visitedNodes.includes("cv");

    if (isSunClickable && centralCoreGroup) {
      const sun = centralCoreGroup.getObjectByName("sun_mesh");
      if (sun) {
        targets.push(sun);
        sun.userData.nodeRef = null;
        sun.userData.isPortal = false;
        sun.userData.isSun = true;
      }
    }

    const intersects = raycaster.intersectObjects(targets);

    // Reset previous hovers
    gameNodes.forEach(node => {
      node.isHovered = false;
    });

    let hoveredNode = null;
    let hoveredPortal = false;
    let hoveredSun = false;
    if (intersects.length > 0) {
      const hitObject = intersects[0].object;
      if (hitObject.userData.isPortal) {
        hoveredPortal = true;
      } else if (hitObject.userData.isSun) {
        hoveredSun = true;
      } else {
        const node = hitObject.userData.nodeRef;
        if (node) {
          node.isHovered = true;
          hoveredNode = node;
        }
      }
    }

    isPortalHovered = hoveredPortal;

    if (!isDragging) {
      if (hoveredPortal || (hoveredNode && !visitedNodes.includes(hoveredNode.def.id))) {
        // Bullet / Target crosshair cursor (when hovering exit portal or unvisited/undestroyed planet)
        canvas.style.cursor = 'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'32\' height=\'32\' viewBox=\'0 0 32 32\'><circle cx=\'16\' cy=\'16\' r=\'10\' fill=\'none\' stroke=\'%23111827\' stroke-width=\'4.5\'/><line x1=\'16\' y1=\'2\' x2=\'16\' y2=\'30\' stroke=\'%23111827\' stroke-width=\'4.5\'/><line x1=\'2\' y1=\'16\' x2=\'30\' y2=\'16\' stroke=\'%23111827\' stroke-width=\'4.5\'/><circle cx=\'16\' cy=\'16\' r=\'2\' fill=\'%23111827\'/><circle cx=\'16\' cy=\'16\' r=\'10\' fill=\'none\' stroke=\'%23ef4444\' stroke-width=\'2.5\'/><line x1=\'16\' y1=\'4\' x2=\'16\' y2=\'28\' stroke=\'%23ef4444\' stroke-width=\'2.5\'/><line x1=\'4\' y1=\'16\' x2=\'28\' y2=\'16\' stroke=\'%23ef4444\' stroke-width=\'2.5\'/><circle cx=\'16\' cy=\'16\' r=\'2\' fill=\'%23ffffff\'/></svg>") 16 16, auto';
      } else if (hoveredSun) {
        // Golden magnifying glass cursor for the Sun thanks letter
        canvas.style.cursor = 'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'32\' height=\'32\' viewBox=\'0 0 32 32\'><circle cx=\'12\' cy=\'12\' r=\'7\' fill=\'none\' stroke=\'%23111827\' stroke-width=\'4.5\'/><line x1=\'17\' y1=\'17\' x2=\'27\' y2=\'27\' stroke=\'%23111827\' stroke-width=\'6.5\' stroke-linecap=\'round\'/><circle cx=\'12\' cy=\'12\' r=\'7\' fill=\'none\' stroke=\'%23f59e0b\' stroke-width=\'2.5\'/><line x1=\'17\' y1=\'17\' x2=\'27\' y2=\'27\' stroke=\'%23f59e0b\' stroke-width=\'3.5\' stroke-linecap=\'round\'/><path d=\'M8,10 A4,4 0 0,1 14,8\' fill=\'none\' stroke=\'%23ffffff\' stroke-width=\'1\' stroke-linecap=\'round\'/></svg>") 12 12, auto';
      } else if (hoveredNode && visitedNodes.includes(hoveredNode.def.id)) {
        // Magnifying glass cursor (when hovering already destroyed/visited planet)
        canvas.style.cursor = 'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'32\' height=\'32\' viewBox=\'0 0 32 32\'><circle cx=\'12\' cy=\'12\' r=\'7\' fill=\'none\' stroke=\'%23111827\' stroke-width=\'4.5\'/><line x1=\'17\' y1=\'17\' x2=\'27\' y2=\'27\' stroke=\'%23111827\' stroke-width=\'6.5\' stroke-linecap=\'round\'/><circle cx=\'12\' cy=\'12\' r=\'7\' fill=\'none\' stroke=\'%23d946ef\' stroke-width=\'2.5\'/><line x1=\'17\' y1=\'17\' x2=\'27\' y2=\'27\' stroke=\'%23d946ef\' stroke-width=\'3.5\' stroke-linecap=\'round\'/><path d=\'M8,10 A4,4 0 0,1 14,8\' fill=\'none\' stroke=\'%23ffffff\' stroke-width=\'1\' stroke-linecap=\'round\'/></svg>") 12 12, auto';
      } else {
        // Default pointer
        canvas.style.cursor = 'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'32\' height=\'32\' viewBox=\'0 0 32 32\'><polygon points=\'0,0 20,10 12,12 22,22 18,24 8,14 4,18\' fill=\'%2300f3ff\' stroke=\'%23111827\' stroke-width=\'1.5\'/></svg>") 0 0, auto';
      }
    }
  });

  window.addEventListener("pointermove", (e) => {
    if (!isDragging) return;
    const dx = e.clientX - prevX;
    const dy = e.clientY - prevY;

    const totalDist = Math.hypot(e.clientX - dragStartPos.x, e.clientY - dragStartPos.y);
    if (totalDist > 5) {
      hasDragged = true;
    }

    gameCameraYawAngle -= dx * 0.005;
    gameCameraPitchAngle = Math.max(0.1, Math.min(Math.PI / 2.2, gameCameraPitchAngle + dy * 0.005));

    prevX = e.clientX;
    prevY = e.clientY;
  });

  window.addEventListener("pointerup", (e) => {
    if (isDragging) {
      isDragging = false;
      canvas.style.cursor = 'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'32\' height=\'32\' viewBox=\'0 0 32 32\'><polygon points=\'0,0 20,10 12,12 22,22 18,24 8,14 4,18\' fill=\'%2300f3ff\' stroke=\'%23111827\' stroke-width=\'1.5\'/></svg>") 0 0, auto';

      if (!hasDragged && e.target.id === "canvas-game-3d") {
        handleCanvasClick(dragStartPos);
      }
    }
  });

  function handleCanvasClick(e) {
    if (!gameCamera) return;
    const rect = canvas.getBoundingClientRect();
    const mouse = new THREE.Vector2();
    const clientX = (e.clientX !== undefined) ? e.clientX : e.x;
    const clientY = (e.clientY !== undefined) ? e.clientY : e.y;
    mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, gameCamera);

    if (visitedNodes.includes("cv") && centralCoreGroup) {
      const sun = centralCoreGroup.getObjectByName("sun_mesh");
      if (sun) {
        const intersects = raycaster.intersectObject(sun);
        if (intersects.length > 0) {
          openSunThanksModal();
          return;
        }
      }
    }

    const targets = [];
    gameNodes.forEach(node => {
      node.group.traverse(child => {
        if (child.isMesh || child.isSprite) {
          targets.push(child);
          child.userData.nodeRef = node;
          child.userData.isPortal = false;
        }
      });
    });

    if (gamePortalGroup) {
      gamePortalGroup.traverse(child => {
        if (child.isMesh || child.isSprite) {
          targets.push(child);
          child.userData.nodeRef = null;
          child.userData.isPortal = true;
        }
      });
    }

    const intersects = raycaster.intersectObjects(targets);
    if (intersects.length > 0) {
      const hitObject = intersects[0].object;
      if (hitObject.userData.isPortal) {
        gamePlayerTargetPos = {
          x: gamePortalGroup.position.x,
          z: gamePortalGroup.position.z
        };
        if (moveIndicator) {
          moveIndicator.position.set(gamePlayerTargetPos.x, -1.47, gamePlayerTargetPos.z);
          moveIndicator.visible = true;
          moveIndicator.scale.set(1.6, 1.6, 1.6);
          moveIndicator.material.opacity = 1.0;
        }
        playBeep(880, 0.08, "sine", 0.03);
        playWhooshSound();
      } else {
        const node = hitObject.userData.nodeRef;
        if (node) {
          gamePlayerTargetPos = {
            x: node.group.position.x,
            z: node.group.position.z
          };
          if (moveIndicator) {
            moveIndicator.position.set(gamePlayerTargetPos.x, -1.47, gamePlayerTargetPos.z);
            moveIndicator.visible = true;
            moveIndicator.scale.set(1.6, 1.6, 1.6);
            moveIndicator.material.opacity = 1.0;
          }
          playBeep(880, 0.08, "sine", 0.03);
          playWhooshSound();
        }
      }
    }
  }

  // Touch joystick listener
  const zone = document.getElementById("joystick-zone");
  const handle = document.getElementById("joystick-handle");

  if (zone && handle) {
    zone.addEventListener("touchstart", (e) => {
      const rect = zone.getBoundingClientRect();
      joystickStartPos = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      };
      joystickActive = true;
      e.preventDefault();
    }, { passive: false });

    zone.addEventListener("touchmove", (e) => {
      if (!joystickActive) return;
      const touch = e.touches[0];
      const dx = touch.clientX - joystickStartPos.x;
      const dy = touch.clientY - joystickStartPos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const maxDist = 36;

      const angle = Math.atan2(dy, dx);
      const finalDist = Math.min(dist, maxDist);

      const px = Math.cos(angle) * finalDist;
      const py = Math.sin(angle) * finalDist;

      handle.style.transform = `translate(${px}px, ${py}px)`;

      joystickDir.x = Math.cos(angle) * (finalDist / maxDist);
      joystickDir.y = Math.sin(angle) * (finalDist / maxDist);
      e.preventDefault();
    }, { passive: false });

    const resetJoy = () => {
      joystickActive = false;
      handle.style.transform = "translate(0, 0)";
      joystickDir = { x: 0, y: 0 };
    };

    zone.addEventListener("touchend", resetJoy, { passive: true });
    zone.addEventListener("touchcancel", resetJoy, { passive: true });
  }

  // Portal Gate to Return to list view
  gamePortalGroup = new THREE.Group();
  const portalX = Math.sin(portalAngle) * portalDist;
  const portalZ = Math.cos(portalAngle) * portalDist;
  gamePortalGroup.position.set(portalX, 1.0, portalZ);

  // Portal Ring: Mercury's Orbit / Ring (Grey color instead of Blue)
  const portalRingGeom = new THREE.TorusGeometry(3.0, 0.04, 8, 64);
  const portalRingMat = new THREE.MeshBasicMaterial({
    color: 0x94a3b8,
    transparent: true,
    opacity: 0.3
  });
  gamePortalRing = new THREE.Mesh(portalRingGeom, portalRingMat);
  gamePortalRing.rotation.x = Math.PI / 2; // Flat horizontal orbit ring
  gamePortalGroup.add(gamePortalRing);

  // Exit Portal is Mercury (Mesh Sphere with procedural Mercury texture)
  const portalVortexGeom = new THREE.SphereGeometry(1.2, 32, 32);
  const portalVortexMat = new THREE.MeshPhongMaterial({
    map: createMercuryTexture(),
    shininess: 30,
    specular: 0x222222
  });
  gamePortalVortex = new THREE.Mesh(portalVortexGeom, portalVortexMat);
  gamePortalGroup.add(gamePortalVortex);

  // Add a nice atmosphere glow
  const atmosphereGeom = new THREE.SphereGeometry(1.28, 32, 32);
  const atmosphereMat = new THREE.MeshBasicMaterial({
    color: 0x94a3b8,
    transparent: true,
    opacity: 0.2,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide
  });
  const atmosphere = new THREE.Mesh(atmosphereGeom, atmosphereMat);
  gamePortalGroup.add(atmosphere);

  if (visitedNodes.includes("exit_portal")) {
    gamePortalVortex.visible = false;
    atmosphere.visible = false;

    // Spawn split halves for Mercury Exit Portal immediately in a shattered state!
    const radius = 1.2;
    const tex = portalVortexMat.map;

    const leftGeom = new THREE.SphereGeometry(radius, 24, 24, 0, Math.PI, 0, Math.PI);
    const rightGeom = new THREE.SphereGeometry(radius, 24, 24, Math.PI, Math.PI, 0, Math.PI);
    
    const halfMat = new THREE.MeshPhongMaterial({
      map: tex,
      color: 0x94a3b8,
      shininess: 30,
      side: THREE.DoubleSide
    });

    const leftHalf = new THREE.Mesh(leftGeom, halfMat);
    leftHalf.name = "left_half";
    leftHalf.position.set(-radius * 1.5, 0, 0);
    leftHalf.rotation.y = 0.5;

    const rightHalf = new THREE.Mesh(rightGeom, halfMat);
    rightHalf.name = "right_half";
    rightHalf.position.set(radius * 1.5, 0, 0);
    rightHalf.rotation.y = -0.5;

    gamePortalGroup.add(leftHalf);
    gamePortalGroup.add(rightHalf);
  }

  // Add text label sprite above portal: "EXIT PORTAL"
  gamePortalSprite = createTextSprite(currentLang === 'vi' ? 'SAO THỦY (CỔNG THOÁT)' : 'MERCURY (EXIT PORTAL)', '#f43f5e');
  gamePortalSprite.position.y = 4.2;
  gamePortalGroup.add(gamePortalSprite);

  // Underneath base
  const portalBaseGeom = new THREE.CylinderGeometry(3.2, 3.5, 0.6, 6);
  const portalBaseMat = new THREE.MeshPhongMaterial({ color: 0x151030, shininess: 50 });
  const portalBase = new THREE.Mesh(portalBaseGeom, portalBaseMat);
  portalBase.position.y = -2.0;
  gamePortalGroup.add(portalBase);

  gameScene.add(gamePortalGroup);

  updateGameCameraPosition();
  updateInstructionsHUD();
  
  if (homeUnlockEffectShown) {
    lastOpenedNode = "home";
  } else {
    lastOpenedNode = null;
  }

  gameInitialized = true;
  gameAnimate();
}

function updateGameCameraPosition() {
  if (!gameCamera || !gamePlayer) return;

  const ox = Math.sin(gameCameraYawAngle) * Math.cos(gameCameraPitchAngle) * gameCameraRadius;
  const oy = Math.sin(gameCameraPitchAngle) * gameCameraRadius;
  const oz = Math.cos(gameCameraYawAngle) * Math.cos(gameCameraPitchAngle) * gameCameraRadius;

  gameCamera.position.set(
    gamePlayer.position.x + ox + gameCamShakeOffset.x,
    gamePlayer.position.y + oy + gameCamShakeOffset.y,
    gamePlayer.position.z + oz + gameCamShakeOffset.z
  );
  gameCamera.lookAt(
    gamePlayer.position.x + gameCamShakeOffset.x * 0.5,
    gamePlayer.position.y + 0.84 + gameCamShakeOffset.y * 0.5,
    gamePlayer.position.z + gameCamShakeOffset.z * 0.5
  );
}

function handleGameKeyDown(e) {
  if (activeModalNode) return;
  if (document.getElementById("bootloader-overlay")) return;

  // Cancel auto target pathing on keyboard input
  gamePlayerTargetPos = null;

  if (e.key in keysPressed) {
    keysPressed[e.key] = true;
  }
  const lowKey = e.key.toLowerCase();
  if (lowKey in keysPressed) {
    keysPressed[lowKey] = true;
  }
}

function handleGameKeyUp(e) {
  if (e.key in keysPressed) {
    keysPressed[e.key] = false;
  }
  const lowKey = e.key.toLowerCase();
  if (lowKey in keysPressed) {
    keysPressed[lowKey] = false;
  }
}

function handleGameResize() {
  if (!gameCamera || !gameRenderer) return;
  gameCamera.aspect = window.innerWidth / window.innerHeight;
  gameCamera.updateProjectionMatrix();
  gameRenderer.setSize(window.innerWidth, window.innerHeight);
}

function checkIfPlayerOnDeck(px, pz) {
  // Biên ranh giới viền trắng của sàn lưới 100x100 là +/-48 đơn vị.
  // Người chơi đi quá viền này sẽ bị rơi xuống không gian.
  return Math.abs(px) < 48.0 && Math.abs(pz) < 48.0;
}

function showSafetyNotice(msg, color) {
  let notice = document.getElementById("quantum-safety-notice");
  if (notice) notice.remove(); // Remove existing one

  const noticeColor = color || "#f43f5e";
  notice = document.createElement("div");
  notice.id = "quantum-safety-notice";
  notice.style.position = "fixed";
  notice.style.top = "12%";
  notice.style.left = "50%";
  notice.style.transform = "translate(-50%, -20px)";
  notice.style.background = "rgba(15, 23, 42, 0.9)";
  notice.style.border = `1px solid ${noticeColor}80`;
  notice.style.boxShadow = `0 0 25px ${noticeColor}50`;
  notice.style.color = noticeColor;
  notice.style.padding = "14px 28px";
  notice.style.borderRadius = "10px";
  notice.style.fontFamily = "monospace";
  notice.style.fontWeight = "bold";
  notice.style.fontSize = "13px";
  notice.style.letterSpacing = "1px";
  notice.style.zIndex = "999999";
  notice.style.textAlign = "center";
  notice.style.pointerEvents = "none";
  notice.style.backdropFilter = "blur(8px)";
  notice.style.transition = "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)";
  notice.style.opacity = "0";

  if (msg) {
    notice.textContent = msg;
  } else {
    const viMsg = "⚠️ BẠN ĐÃ RƠI RA NGOÀI VŨ TRỤ";
    const enMsg = "⚠️ YOU HAVE FALLEN INTO OUTER SPACE";
    notice.textContent = currentLang === 'vi' ? viMsg : enMsg;
  }

  document.body.appendChild(notice);

  // Force reflow
  notice.offsetHeight;

  // Fade in
  notice.style.opacity = "1";
  notice.style.transform = "translate(-50%, 0)";

  setTimeout(() => {
    notice.style.opacity = "0";
    notice.style.transform = "translate(-50%, -20px)";
    setTimeout(() => notice.remove(), 400);
  }, 3000);
}

// =====================================================================
// PLANET UNLOCK CINEMATIC EFFECTS
// =====================================================================

function showPlanetUnlockEffect(nodeDef) {
  const colorHex = '#' + nodeDef.color.toString(16).padStart(6, '0');
  const rgb = hexToRgb(nodeDef.color);

  // ── PHASE 1: Giant Lock Icon appears at center ──
  const lockContainer = document.createElement("div");
  lockContainer.style.cssText = `
    position: fixed; top: 50%; left: 50%; z-index: 999999;
    transform: translate(-50%, -50%) scale(0.3);
    opacity: 0;
    transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    pointer-events: none;
    filter: drop-shadow(0 0 30px ${colorHex}80);
  `;
  lockContainer.innerHTML = `
    <div id="unlock-lock-icon" style="font-size:72px;color:${colorHex};text-shadow:0 0 40px ${colorHex}60;">
      <i class="fa-solid fa-lock"></i>
    </div>
  `;
  document.body.appendChild(lockContainer);

  // Lock sound: deep metallic clang
  if (typeof playBeep === 'function') {
    playBeep(180, 0.2, 'triangle', 0.06);
  }

  // Animate lock in (scale up + fade in)
  requestAnimationFrame(() => {
    lockContainer.style.opacity = "1";
    lockContainer.style.transform = "translate(-50%, -50%) scale(1)";
  });

  // ── PHASE 2: Lock shakes violently (after 500ms) ──
  setTimeout(() => {
    lockContainer.style.animation = "lockShake 0.5s ease-in-out";
    // Metallic rattling sounds
    if (typeof playBeep === 'function') {
      playBeep(300, 0.08, 'square', 0.02);
      setTimeout(() => playBeep(350, 0.08, 'square', 0.02), 60);
      setTimeout(() => playBeep(280, 0.08, 'square', 0.02), 120);
      setTimeout(() => playBeep(400, 0.08, 'square', 0.02), 180);
    }
  }, 500);

  // ── PHASE 3: Lock breaks open (after 1100ms) ──
  setTimeout(() => {
    const iconEl = lockContainer.querySelector("#unlock-lock-icon");
    if (iconEl) {
      // Switch to unlocked icon
      iconEl.innerHTML = '<i class="fa-solid fa-lock-open"></i>';
      iconEl.style.color = "#10b981";
      iconEl.style.textShadow = "0 0 50px rgba(16, 185, 129, 0.7)";
    }
    lockContainer.style.filter = "drop-shadow(0 0 50px rgba(16, 185, 129, 0.8))";
    lockContainer.style.transform = "translate(-50%, -50%) scale(1.3)";

    // Unlock burst sound
    if (typeof playBeep === 'function') {
      playBeep(523, 0.15, 'sine', 0.05);
      setTimeout(() => playBeep(784, 0.12, 'sine', 0.04), 80);
    }

    // Spawn particle sparks around the lock
    for (let i = 0; i < 12; i++) {
      const spark = document.createElement("div");
      const angle = (i / 12) * Math.PI * 2;
      const dist = 60 + Math.random() * 50;
      const dx = Math.cos(angle) * dist;
      const dy = Math.sin(angle) * dist;
      const size = 3 + Math.random() * 4;
      spark.style.cssText = `
        position: fixed; top: 50%; left: 50%; z-index: 999999;
        width: ${size}px; height: ${size}px; border-radius: 50%;
        background: ${colorHex};
        box-shadow: 0 0 8px ${colorHex};
        transform: translate(-50%, -50%);
        transition: all 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        opacity: 1;
        pointer-events: none;
      `;
      document.body.appendChild(spark);
      requestAnimationFrame(() => {
        spark.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
        spark.style.opacity = "0";
      });
      setTimeout(() => spark.remove(), 800);
    }

    // Make the walkway to this planet visible
    if (typeof gameScene !== 'undefined' && gameScene) {
      const walkway = gameScene.getObjectByName("walkway_" + nodeDef.id);
      if (walkway) walkway.visible = true;
    }
  }, 1100);

  // ── PHASE 4: Lock shrinks away, flash + shockwave + banner appear (after 1700ms) ──
  setTimeout(() => {
    // Shrink and fade the lock
    lockContainer.style.transform = "translate(-50%, -50%) scale(0)";
    lockContainer.style.opacity = "0";
    setTimeout(() => lockContainer.remove(), 400);

    // Full-screen flash overlay
    const flash = document.createElement("div");
    flash.style.cssText = `
      position: fixed; inset: 0; z-index: 999998;
      pointer-events: none;
      background: radial-gradient(circle at center, rgba(${rgb}, 0.35) 0%, transparent 70%);
      animation: unlockFlash 1.2s ease-out forwards;
    `;
    document.body.appendChild(flash);
    setTimeout(() => flash.remove(), 1300);

    // Shockwave ring
    const ring = document.createElement("div");
    ring.style.cssText = `
      position: fixed; top: 50%; left: 50%; z-index: 999998;
      width: 10px; height: 10px; border-radius: 50%;
      border: 2px solid rgba(${rgb}, 0.8);
      box-shadow: 0 0 20px rgba(${rgb}, 0.5), inset 0 0 10px rgba(${rgb}, 0.3);
      transform: translate(-50%, -50%) scale(1);
      animation: shockwaveExpand 1s ease-out forwards;
      pointer-events: none;
    `;
    document.body.appendChild(ring);
    setTimeout(() => ring.remove(), 1100);

    // Achievement banner
    const banner = document.createElement("div");
    const planetName = currentLang === 'vi' ? nodeDef.name : nodeDef.nameEn;
    const unlockMsg = currentLang === 'vi' ? 'ĐÃ MỞ KHÓA' : 'UNLOCKED';
    
    const completedCount = ["home", "about", "skills", "experience", "projects", "testimonials", "contact"].filter(id => visitedNodes.includes(id)).length;
    const counterMsg = `${completedCount}/7`;

    banner.innerHTML = `
      <div style="display:flex;align-items:center;gap:12px;">
        <div style="width:36px;height:36px;border-radius:50%;background:${colorHex};box-shadow:0 0 20px ${colorHex}80;display:flex;align-items:center;justify-content:center;animation:unlockPulseGlow 1.5s ease-in-out infinite;">
          <i class="fa-solid fa-lock-open" style="color:#fff;font-size:14px;"></i>
        </div>
        <div style="display:flex;flex-direction:column;gap:2px;">
          <span style="font-size:8px;letter-spacing:3px;color:${colorHex};opacity:0.8;">${unlockMsg}</span>
          <span style="font-size:14px;font-weight:900;color:#fff;text-shadow:0 0 10px ${colorHex}60;">${planetName}</span>
        </div>
        <div style="margin-left:12px;padding:4px 10px;border:1px solid ${colorHex}40;border-radius:6px;font-size:11px;color:${colorHex};font-weight:bold;letter-spacing:2px;">
          ${counterMsg}
        </div>
      </div>
    `;
    banner.style.cssText = `
      position: fixed; top: 10%; left: 50%; z-index: 999999;
      transform: translate(-50%, -30px) scale(0.8);
      background: rgba(5, 8, 22, 0.95);
      border: 1px solid ${colorHex}50;
      box-shadow: 0 0 40px ${colorHex}25, 0 4px 30px rgba(0,0,0,0.5);
      padding: 16px 28px;
      border-radius: 14px;
      font-family: 'Courier New', monospace;
      pointer-events: none;
      backdrop-filter: blur(12px);
      opacity: 0;
      transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
    `;

    document.body.appendChild(banner);
    banner.offsetHeight;
    banner.style.opacity = "1";
    banner.style.transform = "translate(-50%, 0) scale(1)";

    // Sound: ascending victory chime
    if (typeof playBeep === 'function') {
      playBeep(523, 0.12, 'sine', 0.04);
      setTimeout(() => playBeep(659, 0.12, 'sine', 0.04), 80);
      setTimeout(() => playBeep(784, 0.15, 'sine', 0.05), 160);
    }

    setTimeout(() => {
      banner.style.opacity = "0";
      banner.style.transform = "translate(-50%, -20px) scale(0.9)";
      setTimeout(() => banner.remove(), 500);
    }, 3500);
  }, 1700);
}

function showAllUnlockedEffect() {

  // Grand full-screen golden flash
  const flash = document.createElement("div");
  flash.style.cssText = `
    position: fixed; inset: 0; z-index: 999997;
    pointer-events: none;
    background: radial-gradient(circle at center, rgba(234, 179, 8, 0.4) 0%, rgba(168, 85, 247, 0.15) 50%, transparent 80%);
    animation: unlockFlash 2s ease-out forwards;
  `;
  document.body.appendChild(flash);
  setTimeout(() => flash.remove(), 2100);

  // Double shockwave rings
  for (let i = 0; i < 2; i++) {
    const ring = document.createElement("div");
    ring.style.cssText = `
      position: fixed; top: 50%; left: 50%; z-index: 999998;
      width: 10px; height: 10px; border-radius: 50%;
      border: 2px solid rgba(168, 85, 247, ${0.9 - i * 0.3});
      box-shadow: 0 0 30px rgba(168, 85, 247, 0.4);
      transform: translate(-50%, -50%) scale(1);
      animation: shockwaveExpand ${1.2 + i * 0.3}s ease-out forwards;
      animation-delay: ${i * 0.2}s;
      pointer-events: none;
    `;
    document.body.appendChild(ring);
    setTimeout(() => ring.remove(), 1600 + i * 300);
  }

  // Grand celebration banner
  const banner = document.createElement("div");
  const titleMsg = currentLang === 'vi' ? '🏆 TẤT CẢ HÀNH TINH ĐÃ KHÁM PHÁ!' : '🏆 ALL PLANETS EXPLORED!';
  const subMsg = currentLang === 'vi'
    ? 'SAO DIÊM VƯƠNG ĐÃ MỞ KHÓA — HÃY ĐẾN ĐỂ XEM CV'
    : 'PLUTO UNLOCKED — PROCEED TO VIEW CV';
  const arrowMsg = currentLang === 'vi' ? 'HƯỚNG VỀ SAO DIÊM VƯƠNG ↗' : 'HEAD TO PLUTO ↗';

  banner.innerHTML = `
    <div style="display:flex;flex-direction:column;align-items:center;gap:8px;">
      <div style="display:flex;align-items:center;gap:10px;">
        <div style="width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,#a855f7,#eab308);box-shadow:0 0 30px rgba(168,85,247,0.5);display:flex;align-items:center;justify-content:center;animation:unlockPulseGlow 1s ease-in-out infinite;">
          <i class="fa-solid fa-trophy" style="color:#fff;font-size:20px;"></i>
        </div>
        <div style="display:flex;flex-direction:column;gap:3px;">
          <span style="font-size:15px;font-weight:900;color:#eab308;text-shadow:0 0 15px rgba(234,179,8,0.4);letter-spacing:1px;">${titleMsg}</span>
          <span style="font-size:10px;color:#a78bfa;letter-spacing:2px;">${subMsg}</span>
        </div>
      </div>
      <div style="margin-top:6px;padding:6px 18px;background:linear-gradient(90deg,rgba(168,85,247,0.2),rgba(234,179,8,0.2));border:1px solid rgba(168,85,247,0.4);border-radius:8px;font-size:11px;color:#c4b5fd;font-weight:bold;letter-spacing:3px;animation:unlockPulseGlow 2s ease-in-out infinite;">
        ${arrowMsg}
      </div>
    </div>
  `;
  banner.style.cssText = `
    position: fixed; top: 50%; left: 50%; z-index: 999999;
    transform: translate(-50%, -50%) scale(0.7);
    background: rgba(5, 8, 22, 0.97);
    border: 1px solid rgba(168, 85, 247, 0.5);
    box-shadow: 0 0 60px rgba(168, 85, 247, 0.2), 0 0 80px rgba(234, 179, 8, 0.1), 0 4px 40px rgba(0,0,0,0.6);
    padding: 24px 36px;
    border-radius: 18px;
    font-family: 'Courier New', monospace;
    pointer-events: none;
    backdrop-filter: blur(16px);
    opacity: 0;
    transition: all 0.7s cubic-bezier(0.16, 1, 0.3, 1);
  `;

  document.body.appendChild(banner);
  banner.offsetHeight;
  banner.style.opacity = "1";
  banner.style.transform = "translate(-50%, -50%) scale(1)";

  // Victory fanfare sound sequence
  if (typeof playBeep === 'function') {
    playBeep(523.25, 0.12, 'sine', 0.05);
    setTimeout(() => playBeep(659.25, 0.12, 'sine', 0.05), 100);
    setTimeout(() => playBeep(783.99, 0.15, 'sine', 0.05), 200);
    setTimeout(() => playBeep(1046.50, 0.2, 'sine', 0.06), 300);
    setTimeout(() => playBeep(1318.51, 0.25, 'sine', 0.08), 450);
    setTimeout(() => playBeep(1567.98, 0.3, 'sine', 0.1), 600);
  }

  setTimeout(() => {
    banner.style.opacity = "0";
    banner.style.transform = "translate(-50%, -50%) scale(0.9)";
    setTimeout(() => banner.remove(), 600);
  }, 5500);
}

// Helper: convert 0xRRGGBB integer to "R,G,B" string
function hexToRgb(hexInt) {
  const r = (hexInt >> 16) & 255;
  const g = (hexInt >> 8) & 255;
  const b = hexInt & 255;
  return `${r},${g},${b}`;
}

function spawnPlanetExplosionFx(node) {
  if (!node || !node.group || !gameScene) return;

  const color = node.def.color || 0xff4444;
  const origin = node.group.position.clone();
  origin.y = 0.25;

  const flashGeom = new THREE.SphereGeometry(1.1, 24, 24);
  const flashMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const flash = new THREE.Mesh(flashGeom, flashMat);
  flash.position.copy(origin);
  flash.userData = { fxType: "flash", age: 0, life: 32 };
  gameScene.add(flash);
  planetExplosionFx.push(flash);

  const ringGeom = new THREE.RingGeometry(1.1, 1.28, 96);
  const ringMat = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.95,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const shockRing = new THREE.Mesh(ringGeom, ringMat);
  shockRing.position.copy(origin);
  shockRing.position.y = -0.95;
  shockRing.rotation.x = -Math.PI / 2;
  shockRing.userData = { fxType: "ring", age: 0, life: 54 };
  gameScene.add(shockRing);
  planetExplosionFx.push(shockRing);

  for (let i = 0; i < 10; i++) {
    const rayGeom = new THREE.CylinderGeometry(0.025, 0.01, 2.2 + Math.random() * 1.6, 6);
    const rayMat = new THREE.MeshBasicMaterial({
      color: i % 3 === 0 ? 0xffffff : color,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const ray = new THREE.Mesh(rayGeom, rayMat);
    const angle = (i / 10) * Math.PI * 2;
    const radius = 0.4 + Math.random() * 0.8;
    ray.position.set(
      origin.x + Math.cos(angle) * radius,
      origin.y + 0.3 + Math.random() * 0.5,
      origin.z + Math.sin(angle) * radius
    );
    ray.rotation.z = Math.PI / 2 + (Math.random() - 0.5) * 0.8;
    ray.rotation.y = -angle;
    ray.userData = {
      fxType: "ray",
      age: 0,
      life: 34 + Math.random() * 16,
      dir: new THREE.Vector3(Math.cos(angle), 0.35 + Math.random() * 0.4, Math.sin(angle)).multiplyScalar(0.055 + Math.random() * 0.06)
    };
    gameScene.add(ray);
    planetExplosionFx.push(ray);
  }
}

function updatePlanetExplosionFx() {
  for (let i = planetExplosionFx.length - 1; i >= 0; i--) {
    const fx = planetExplosionFx[i];
    fx.userData.age++;
    const t = fx.userData.age / fx.userData.life;

    if (fx.userData.fxType === "flash") {
      const s = 1 + t * 5.5;
      fx.scale.set(s, s, s);
      fx.material.opacity = Math.max(0, 0.9 * (1 - t));
    } else if (fx.userData.fxType === "ring") {
      const s = 1 + t * 8;
      fx.scale.set(s, s, 1);
      fx.rotation.z += 0.025;
      fx.material.opacity = Math.max(0, 0.95 * (1 - t));
    } else if (fx.userData.fxType === "ray") {
      fx.position.add(fx.userData.dir);
      fx.scale.y = 1 + t * 1.6;
      fx.material.opacity = Math.max(0, 0.65 * (1 - t));
    }

    if (t >= 1) {
      gameScene.remove(fx);
      if (fx.geometry) fx.geometry.dispose();
      if (fx.material) fx.material.dispose();
      planetExplosionFx.splice(i, 1);
    }
  }
}

function clearPlanetExplosionFx() {
  planetExplosionFx.forEach(fx => {
    gameScene.remove(fx);
    if (fx.geometry) fx.geometry.dispose();
    if (fx.material) fx.material.dispose();
  });
  planetExplosionFx = [];
}

function drawMinimap() {
  const canvas = document.getElementById("minimap-canvas");
  if (!canvas || !is3DMode) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const w = canvas.width;
  const h = canvas.height;
  const cx = w / 2;
  const cy = h / 2;

  // Clear canvas
  ctx.clearRect(0, 0, w, h);

  // Draw background circular radar grid lines
  ctx.strokeStyle = "rgba(168, 85, 247, 0.15)";
  ctx.lineWidth = 1.0;

  // Draw range rings
  ctx.beginPath(); ctx.arc(cx, cy, 25, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.arc(cx, cy, 45, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.arc(cx, cy, 54, 0, Math.PI * 2); ctx.stroke();

  // Draw crosshairs
  ctx.strokeStyle = "rgba(168, 85, 247, 0.08)";
  ctx.beginPath(); ctx.moveTo(cx - 54, cy); ctx.lineTo(cx + 54, cy); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx, cy - 54); ctx.lineTo(cx, cy + 54); ctx.stroke();

  // Radar sweep scanline
  const time = Date.now() * 0.002;
  ctx.fillStyle = "rgba(168, 85, 247, 0.04)";
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.arc(cx, cy, 54, time, time + 0.4);
  ctx.closePath();
  ctx.fill();

  // Scale: 3D coordinates map to minimap pixels
  // Radius of outer deck boundary is ~48 units, which should map to ~50 pixels on canvas
  const scale = 50 / 48;

  // Draw central Sun
  ctx.fillStyle = "#eab308";
  ctx.beginPath();
  ctx.arc(cx, cy, 4.5, 0, Math.PI * 2);
  ctx.shadowColor = "#f97316";
  ctx.shadowBlur = 5;
  ctx.fill();
  ctx.shadowBlur = 0;

  // Draw Exit Portal (Earth) at fixed position (0, 1.0, 30.0) -> (cx, cy + 30 * scale)
  const pxPortal = cx;
  const pyPortal = cy + 30 * scale;
  ctx.fillStyle = "#3b82f6";
  ctx.beginPath();
  ctx.arc(pxPortal, pyPortal, 3.5, 0, Math.PI * 2);
  ctx.shadowColor = "#06b6d4";
  ctx.shadowBlur = 3;
  ctx.fill();
  ctx.shadowBlur = 0;

  // Draw planet nodes
  if (gameNodes) {
    gameNodes.forEach(node => {
      const nX = node.group.position.x;
      const nZ = node.group.position.z;
      
      const px = cx + nX * scale;
      const py = cy + nZ * scale;

      const nodeColor = '#' + node.def.color.toString(16).padStart(6, '0');
      const isVisited = node.def.id === "cv" ? (visitedNodes.includes("cv")) : visitedNodes.includes(node.def.id);

      ctx.fillStyle = nodeColor;
      ctx.strokeStyle = nodeColor;

      ctx.beginPath();
      if (node.def.id === "cv") {
        const coreVisitedCount = ["home", "about", "skills", "experience", "projects", "testimonials", "contact"].filter(id => visitedNodes.includes(id)).length;
        if (coreVisitedCount < 7) {
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(px - 3, py - 3); ctx.lineTo(px + 3, py + 3);
          ctx.moveTo(px + 3, py - 3); ctx.lineTo(px - 3, py + 3);
          ctx.stroke();
          return;
        }
      }

      if (isVisited) {
        ctx.arc(px, py, 3.2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.lineWidth = 1.2;
        ctx.arc(px, py, 2.8, 0, Math.PI * 2);
        ctx.stroke();
      }
    });
  }

  // Draw Player Drone
  if (gamePlayer) {
    const pX = gamePlayer.position.x;
    const pZ = gamePlayer.position.z;

    const px = cx + pX * scale;
    const py = cy + pZ * scale;

    const flash = Math.sin(Date.now() * 0.01) * 0.5 + 0.5;
    ctx.fillStyle = `rgba(16, 185, 129, ${0.4 + flash * 0.6})`;
    ctx.shadowColor = "#10b981";
    ctx.shadowBlur = 5;

    ctx.beginPath();
    ctx.arc(px, py, 4.0, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Draw direction vector (where camera is looking)
    if (gameCamera) {
      const dir = new THREE.Vector3();
      gameCamera.getWorldDirection(dir);
      const angle = Math.atan2(dir.x, dir.z);
      
      ctx.strokeStyle = "#10b981";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px + Math.sin(angle) * 10, py + Math.cos(angle) * 10);
      ctx.stroke();
    }
  }
}

function gameAnimate() {
  if (!is3DMode) return;
  gameAnimationId = requestAnimationFrame(gameAnimate);

  const time = performance.now() * 0.002;

  if (gamePlayer && !activeModalNode && !document.getElementById("bootloader-overlay")) {
    // Check if player is on deck
    const isOnDeck = checkIfPlayerOnDeck(gamePlayer.position.x, gamePlayer.position.z);
    if (isOnDeck) {
      // Bobbing on the ground
      gamePlayer.position.y = 1.78 + Math.sin(time * 2) * 0.201;
      gamePlayerVeloY = 0;
    } else {
      // Apply gravity falling
      gamePlayerVeloY -= 0.015;
      gamePlayer.position.y += gamePlayerVeloY;

      // Respawn if fallen too deep
      if (gamePlayer.position.y < -15.0) {
        gamePlayer.position.set(0, 1.78, 0);
        gamePlayerVeloY = 0;
        gamePlayerTargetPos = null;
        showSafetyNotice(
          currentLang === 'vi' ? '⚠️ BẠN ĐÃ RƠI RA NGOÀI VŨ TRỤ' : '⚠️ YOU HAVE FALLEN INTO OUTER SPACE'
        );
      }
    }
    // Humanoid walking/idle animations will be processed below after calculating dx and dz

    const speed = 0.22;
    let dx = 0;
    let dz = 0;

    const camForward = new THREE.Vector3(0, 0, -1).applyQuaternion(gameCamera.quaternion);
    camForward.y = 0;
    camForward.normalize();

    const camRight = new THREE.Vector3(1, 0, 0).applyQuaternion(gameCamera.quaternion);
    camRight.y = 0;
    camRight.normalize();

    if (isShootingEarth || isShootingPlanet) {
      dx = 0;
      dz = 0;
      gamePlayerTargetPos = null;
    } else if (joystickActive) {
      gamePlayerTargetPos = null;
      dx = (camForward.x * -joystickDir.y + camRight.x * joystickDir.x) * speed;
      dz = (camForward.z * -joystickDir.y + camRight.z * joystickDir.x) * speed;
    } else if (gamePlayerTargetPos) {
      const dist = Math.hypot(gamePlayerTargetPos.x - gamePlayer.position.x, gamePlayerTargetPos.z - gamePlayer.position.z);
      if (dist > 0.05) {
        const angle = Math.atan2(gamePlayerTargetPos.x - gamePlayer.position.x, gamePlayerTargetPos.z - gamePlayer.position.z);
        dx = Math.sin(angle) * speed;
        dz = Math.cos(angle) * speed;
        if (dist < speed) {
          gamePlayer.position.x = gamePlayerTargetPos.x;
          gamePlayer.position.z = gamePlayerTargetPos.z;
          gamePlayerTargetPos = null;
          dx = 0;
          dz = 0;
        }
      } else {
        gamePlayerTargetPos = null;
      }
    } else {
      let moveForward = 0;
      let moveRight = 0;

      if (keysPressed.w || keysPressed.ArrowUp) moveForward += 1;
      if (keysPressed.s || keysPressed.ArrowDown) moveForward -= 1;
      if (keysPressed.a || keysPressed.ArrowLeft) moveRight -= 1;
      if (keysPressed.d || keysPressed.ArrowRight) moveRight += 1;

      dx = (camForward.x * moveForward + camRight.x * moveRight) * speed;
      dz = (camForward.z * moveForward + camRight.z * moveRight) * speed;
    }

    gamePlayer.position.x += dx;
    gamePlayer.position.z += dz;

    if (dx !== 0 || dz !== 0) {
      const targetAngle = Math.atan2(dx, dz);
      gamePlayer.rotation.y = targetAngle;
    }

    const isMoving = (dx !== 0 || dz !== 0);
    const walkSpeed = 14;

    const torso = gamePlayer.getObjectByName("torso");
    const head = gamePlayer.getObjectByName("headGroup");
    const leftArm = gamePlayer.getObjectByName("leftArmGroup");
    const rightArm = gamePlayer.getObjectByName("rightArmGroup");
    const leftLeg = gamePlayer.getObjectByName("leftLegGroup");
    const rightLeg = gamePlayer.getObjectByName("rightLegGroup");
    const capeMain = gamePlayer.getObjectByName("capeMain");
    const coatL = gamePlayer.getObjectByName("coatLeft");
    const coatR = gamePlayer.getObjectByName("coatRight");

    if (isShootingEarth || isShootingPlanet) {
      if (leftLeg) leftLeg.rotation.x = 0;
      if (rightLeg) rightLeg.rotation.x = 0;
      if (torso) torso.position.y = -0.8;
      if (leftArm) {
        leftArm.rotation.x = 0.5;
        leftArm.rotation.z = -0.4;
      }
      if (rightArm) {
        rightArm.rotation.x = -Math.PI / 2.3;
        rightArm.rotation.z = 0;
        rightArm.rotation.y = 0;
      }
      if (head) head.position.y = -0.28 + Math.sin(time * 2) * 0.01;
      if (capeMain) capeMain.rotation.x = Math.sin(time * 1.5) * 0.02;
      if (coatL) coatL.rotation.x = 0.08;
      if (coatR) coatR.rotation.x = 0.08;
    } else if (isMoving) {
      const swing = Math.sin(time * walkSpeed) * 0.5;
      // Legs walk
      if (leftLeg) leftLeg.rotation.x = swing;
      if (rightLeg) rightLeg.rotation.x = -swing;
      // Arms swing opposite
      if (leftArm) leftArm.rotation.x = -swing * 0.7;
      if (rightArm) rightArm.rotation.x = swing * 0.5;
      // Torso bobs
      if (torso) torso.position.y = -0.8 + Math.abs(Math.sin(time * walkSpeed)) * 0.05;
      // Head bobs
      if (head) head.position.y = -0.28 + Math.sin(time * walkSpeed) * 0.015;
      // Cape flows when walking
      if (capeMain) capeMain.rotation.x = Math.sin(time * walkSpeed) * 0.1;
      if (coatL) coatL.rotation.x = Math.sin(time * walkSpeed + 0.3) * 0.18;
      if (coatR) coatR.rotation.x = -Math.sin(time * walkSpeed + 0.3) * 0.18;
    } else {
      // Idle
      if (leftLeg) leftLeg.rotation.x = 0;
      if (rightLeg) rightLeg.rotation.x = 0;
      if (torso) torso.position.y = -0.8;
      if (leftArm) {
        leftArm.rotation.x = Math.sin(time * 1.5) * 0.04;
        leftArm.rotation.z = -0.12 + Math.sin(time * 2) * 0.03;
      }
      if (rightArm) {
        rightArm.rotation.x = 0;
        rightArm.rotation.z = 0.05 - Math.sin(time * 2) * 0.02;
      }
      if (head) head.position.y = -0.28 + Math.sin(time * 2) * 0.01;
      if (capeMain) capeMain.rotation.x = Math.sin(time * 1.5) * 0.02;
      if (coatL) coatL.rotation.x = Math.sin(time * 1.5) * 0.03;
      if (coatR) coatR.rotation.x = Math.sin(time * 1.5 + 0.5) * 0.03;
    }

    // Shoulder pad orb pulsing
    const shoulder = gamePlayer.getObjectByName("shoulderPad");
    if (shoulder && shoulder.children[1]) {
      shoulder.children[1].scale.setScalar(0.95 + Math.sin(time * 5) * 0.05);
    }

    // Forehead gem pulse
    const gem = gamePlayer.getObjectByName("starCrown");
    if (gem) gem.scale.setScalar(0.9 + Math.sin(time * 4) * 0.1);

    // Orbital rings spinning!
    const orbitRings = gamePlayer.getObjectByName("orbitRings");
    if (orbitRings) {
      orbitRings.rotation.y += 0.02;
      const r2 = orbitRings.getObjectByName("ring2");
      if (r2) r2.rotation.y += 0.01;
    }

    // Floating orbs orbit around character
    const orbGroup = gamePlayer.getObjectByName("floatingOrbs");
    if (orbGroup) {
      orbGroup.rotation.y += 0.015;
      orbGroup.children.forEach((orb, i) => {
        orb.position.y = -0.8 + i * 0.15 + Math.sin(time * 3 + i * 2) * 0.06;
      });
    }

    // Cape shards float
    const shardsGroup = gamePlayer.getObjectByName("shards");
    if (shardsGroup) {
      shardsGroup.rotation.y += 0.008;
      shardsGroup.children.forEach((shard, idx) => {
        shard.position.y += Math.sin(time * 3 + idx * 1.2) * 0.001;
        shard.rotation.x += 0.01;
      });
    }
  }

  let closestNode = null;
  let minDistance = Infinity;

  // Rotate and animate the multi-layered Gyroscopic Reactor Core underneath
  if (gameUnderGlobe) {
    gameUnderGlobe.rotation.y += 0.0008; // slow master rotation

    const g1 = gameUnderGlobe.getObjectByName("gimbal_1");
    const g2 = gameUnderGlobe.getObjectByName("gimbal_2");
    const g3 = gameUnderGlobe.getObjectByName("gimbal_3");
    const innerCore = gameUnderGlobe.getObjectByName("inner_core");

    if (g1) g1.rotation.z += 0.006;
    if (g2) g2.rotation.x -= 0.005;
    if (g3) g3.rotation.y += 0.004;

    if (innerCore) {
      innerCore.rotation.y -= 0.008;
      // Pulse inner core size dynamically
      const sc = 1.0 + Math.sin(time * 3) * 0.12;
      innerCore.scale.set(sc, sc, sc);
    }
  }

  // Twinkle star systems
  if (gameStarsTwinkleA) {
    gameStarsTwinkleA.material.opacity = 0.4 + Math.sin(time * 3.5) * 0.3;
  }
  if (gameStarsTwinkleB) {
    gameStarsTwinkleB.material.opacity = 0.3 + Math.sin(time * 2.5 + 1.0) * 0.3;
  }

  // Rotate background cosmic nebula sheets very slowly
  if (gameNebulaClouds && gameNebulaClouds.length > 0) {
    gameNebulaClouds.forEach((neb, idx) => {
      neb.rotation.z += 0.00015 * (idx % 2 === 0 ? 1 : -1);
    });
  }

  // Rotate black hole accretion disk
  if (gameBlackHoleGroup) {
    const disk = gameBlackHoleGroup.getObjectByName("accretion_disk");
    if (disk) {
      disk.rotation.z += 0.006;
    }
  }

  // Rotate background planets
  if (gameBgPlanets && gameBgPlanets.length > 0) {
    gameBgPlanets.forEach((pGroup, idx) => {
      const sphere = pGroup.getObjectByName("sphere");
      if (sphere) {
        sphere.rotation.y += 0.002 * (idx % 2 === 0 ? 1 : -1);
      }

      // Specifically spin the green cyber grid shell on planet C (index 2)
      if (idx === 2) {
        const gridShell = pGroup.getObjectByName("grid_shell");
        if (gridShell) {
          gridShell.rotation.y -= 0.004;
          gridShell.rotation.x += 0.0025;
        }
      }
    });
  }

  // Rotate central Sun & Corona, scale them dynamically according to explored planets (charging effect)
  if (centralCoreGroup) {
    const exploredCount = ["home", "about", "skills", "experience", "projects", "testimonials", "contact", "cv"].filter(id => visitedNodes.includes(id)).length;
    const sunEnergyRatio = exploredCount / 8; // 0.125 to 1.0

    // Decay the surge multiplier back to 1.0
    sunChargeSurge += (1.0 - sunChargeSurge) * 0.05;

    // Create a continuous breathing/pulsing wave over time
    // Frequency and amplitude of breath increase with energy!
    const breathe = 1.0 + Math.sin(performance.now() * (0.001 + sunEnergyRatio * 0.003)) * (0.015 + sunEnergyRatio * 0.035);
    const combinedScaleFactor = breathe * sunChargeSurge;

    const sun = centralCoreGroup.getObjectByName("sun_mesh");
    if (sun) {
      // Rotation speed increases with energy
      sun.rotation.y += 0.003 + sunEnergyRatio * 0.007;

      // Scale scales smoothly based on energy level and breathes/surges
      const targetSunScale = (0.85 + sunEnergyRatio * 0.35) * combinedScaleFactor; // base 0.9 to 1.2
      sun.scale.lerp(new THREE.Vector3(targetSunScale, targetSunScale, targetSunScale), 0.08);
    }

    const corona = centralCoreGroup.children[1]; // coronaMesh
    if (corona) {
      corona.rotation.z -= (0.001 + sunEnergyRatio * 0.003);
      corona.rotation.y += (0.002 + sunEnergyRatio * 0.005);

      // Scale scales smoothly based on energy level and breathes/surges
      const targetCoronaScale = (0.95 + sunEnergyRatio * 0.45) * combinedScaleFactor * 1.05; // base 1.0 to 1.4
      corona.scale.lerp(new THREE.Vector3(targetCoronaScale, targetCoronaScale, targetCoronaScale), 0.08);

      // Glow opacity gets stronger, and surges on charge
      if (corona.material) {
        const targetOpacity = (0.2 + sunEnergyRatio * 0.25) * sunChargeSurge; // base 0.23 to 0.45
        corona.material.opacity += (targetOpacity - corona.material.opacity) * 0.08;
      }
    }

    // Light intensity gets brighter, and surges on charge
    const sunLight = centralCoreGroup.children.find(c => c.isPointLight);
    if (sunLight) {
      const targetLightIntensity = (1.5 + sunEnergyRatio * 4.5) * sunChargeSurge; // base 2.0 to 6.0
      sunLight.intensity += (targetLightIntensity - sunLight.intensity) * 0.08;
    }
  }

  // Animate flowing energy chevrons along walkways
  if (gameWalkwayTextures && gameWalkwayTextures.length > 0) {
    gameWalkwayTextures.forEach(tex => {
      tex.offset.y -= 0.012;
    });
  }

  // Animate dynamic expanding radar energy pulse sweep ring
  if (gameSweepRing) {
    let nextScale = gameSweepRing.scale.x + 0.15;
    if (nextScale > 45) {
      nextScale = 1.0;
    }
    gameSweepRing.scale.set(nextScale, nextScale, 1);

    const progress = nextScale / 45;
    gameSweepRing.material.opacity = Math.max(0, (1.0 - progress) * 0.4);
  }

  // Blink perimeter fence beacons
  if (gameFenceBeacons && gameFenceBeacons.length > 0) {
    gameFenceBeacons.forEach((beacon, idx) => {
      beacon.material.opacity = 0.35 + Math.sin(time * 6.0 + idx) * 0.65;
    });
  }

  // Rotate and pulsate landing pad rings
  if (gameNodes && gameNodes.length > 0) {
    gameNodes.forEach(node => {
      if (node.group) {
        const ring = node.group.getObjectByName("pad_ring");
        if (ring) {
          ring.rotation.z += 0.012;
          const sc = 1.0 + Math.sin(time * 4) * 0.06;
          ring.scale.set(sc, sc, 1);
        }
      }
    });
  }

  // Animate destination indicator dot (LMHT style)
  if (moveIndicator && moveIndicator.visible) {
    moveIndicator.rotation.z -= 0.02;

    // Shrink scale to 0.9 (inward snap pulse)
    moveIndicator.scale.x += (0.9 - moveIndicator.scale.x) * 0.18;
    moveIndicator.scale.y = moveIndicator.scale.x;

    // Fade out
    moveIndicator.material.opacity -= 0.05;
    if (moveIndicator.material.opacity <= 0) {
      moveIndicator.visible = false;
    }
  }

  gameNodes.forEach(node => {
    // If planet has been destroyed, ensure split halves & debris exist, and hide normal mesh
    const isDestroyed = visitedNodes.includes(node.def.id);
    if (isDestroyed && node.def.id !== "home") {
      ["node_base", "pad_ring", "node_beam", "name_label"].forEach(partName => {
        const part = node.group.getObjectByName(partName);
        if (part) part.visible = true;
      });

      if (node.mesh.visible) {
        node.mesh.visible = false;
        // Hide other sub-elements in the group
        const keepAfterExplosion = new Set(["node_base", "pad_ring", "node_beam", "name_label", "left_half", "right_half"]);
        node.group.children.forEach(child => {
          if (child !== node.sprite && child !== node.mesh && !keepAfterExplosion.has(child.name) && !child.name.startsWith("rock_")) {
            child.visible = false;
          }
        });
      }

      let leftHalf = node.group.getObjectByName("left_half");
      let rightHalf = node.group.getObjectByName("right_half");
      if (!leftHalf && !rightHalf) {
        const coreMesh = node.mesh.children.find(c => c.name === "planet_core");
        if (coreMesh) {
          const radius = coreMesh.geometry.parameters.radius;
          const tex = coreMesh.material.map;
          const pColor = node.def.color;

          const leftGeom = new THREE.SphereGeometry(radius, 24, 24, 0, Math.PI, 0, Math.PI);
          const rightGeom = new THREE.SphereGeometry(radius, 24, 24, Math.PI, Math.PI, 0, Math.PI);
          
          const halfMat = new THREE.MeshPhongMaterial({
            map: tex,
            color: pColor,
            shininess: 30,
            side: THREE.DoubleSide
          });

          leftHalf = new THREE.Mesh(leftGeom, halfMat);
          leftHalf.name = "left_half";
          leftHalf.position.set(0, 0.3, 0);

          rightHalf = new THREE.Mesh(rightGeom, halfMat);
          rightHalf.name = "right_half";
          rightHalf.position.set(0, 0.3, 0);

          node.group.add(leftHalf);
          node.group.add(rightHalf);

          // Add debris rocks
          for (let i = 0; i < 4; i++) {
            const rockGeom = new THREE.DodecahedronGeometry(0.15 + Math.random() * 0.15, 0);
            const rockMat = new THREE.MeshPhongMaterial({
              color: pColor,
              shininess: 10,
              flatShading: true
            });
            const rock = new THREE.Mesh(rockGeom, rockMat);
            rock.name = `rock_${i}`;
            rock.position.set(
              (Math.random() - 0.5) * 0.5,
              0.3 + (Math.random() - 0.5) * 0.5,
              (Math.random() - 0.5) * 0.5
            );
            rock.userData = {
              velo: new THREE.Vector3(
                (Math.random() - 0.5) * 0.015,
                (Math.random() - 0.5) * 0.015,
                (Math.random() - 0.5) * 0.015
              ),
              rotVelo: new THREE.Vector3(
                (Math.random() - 0.5) * 0.04,
                (Math.random() - 0.5) * 0.04,
                (Math.random() - 0.5) * 0.04
              )
            };
            node.group.add(rock);
          }
        }
      }

      // Animate split halves and debris rocks
      if (leftHalf && rightHalf) {
        leftHalf.rotation.y += 0.005;
        leftHalf.rotation.x += 0.002;
        rightHalf.rotation.y += 0.005;
        rightHalf.rotation.z -= 0.002;

        const coreMesh = node.mesh.children.find(c => c.name === "planet_core");
        const radius = coreMesh ? coreMesh.geometry.parameters.radius : 1.2;
        const maxDrift = radius * 0.7;

        if (leftHalf.position.x > -maxDrift) {
          leftHalf.position.x -= 0.012;
        }
        if (rightHalf.position.x < maxDrift) {
          rightHalf.position.x += 0.012;
        }
      }

      for (let i = 0; i < 4; i++) {
        const rock = node.group.getObjectByName(`rock_${i}`);
        if (rock) {
          rock.rotation.x += rock.userData.rotVelo.x;
          rock.rotation.y += rock.userData.rotVelo.y;
          rock.rotation.z += rock.userData.rotVelo.z;

          const dist = rock.position.distanceTo(new THREE.Vector3(0, 0.3, 0));
          if (dist < 2.5) {
            rock.position.add(rock.userData.velo);
          }
        }
      }
    }

    // Smoothly scale node on hover
    const targetScale = node.isHovered ? 1.3 : 1.0;
    const currentScale = node.group.scale.x;
    const nextScale = currentScale + (targetScale - currentScale) * 0.15;
    node.group.scale.set(nextScale, nextScale, nextScale);

    // Smoothly fade hover glow opacity
    const glowMesh = node.mesh.getObjectByName("hover_glow");
    if (glowMesh) {
      const targetGlowOpacity = node.isHovered ? 0.6 : 0.0;
      glowMesh.material.opacity += (targetGlowOpacity - glowMesh.material.opacity) * 0.15;
    }

    // Rotate core planet sphere
    const spinSpeed = node.isHovered ? 0.035 : 0.008;
    node.mesh.rotation.y += spinSpeed;

    // Rotate the sub-elements for each specific planet style
    node.mesh.children.forEach(child => {
      if (child.name === "sub_shell") {
        child.rotation.y -= spinSpeed * 1.5;
        child.rotation.x += spinSpeed * 0.5;
      } else if (child.name === "sub_ring") {
        child.rotation.z += spinSpeed * 0.5;
      } else if (child.name === "sub_orbits") {
        child.rotation.y += spinSpeed * 1.8;
        child.rotation.x += spinSpeed * 0.8;
      } else if (child.name === "sub_moons") {
        child.rotation.y += spinSpeed * 2.2;
      }
    });

    // Make floating text sprite face camera with gentle bobbing
    if (node.sprite) {
      node.sprite.lookAt(gameCamera.position);
      const time = performance.now() * 0.0015;
      node.sprite.position.y = 3.5 + Math.sin(time * 2.0 + node.group.position.x) * 0.08;
    }

    const dist = Math.hypot(gamePlayer.position.x - node.group.position.x, gamePlayer.position.z - node.group.position.z);
    if (dist < minDistance) {
      minDistance = dist;
      closestNode = node;
    }
  });

  // LookAt for player label
  if (gamePlayer) {
    const playerLabel = gamePlayer.getObjectByName("player_label");
    if (playerLabel) {
      playerLabel.lookAt(gameCamera.position);
    }
  }

  // Animate exit portal (Earth & Moon) and check for collision to warp back to list view
  if (gamePortalGroup && gamePortalVortex && gamePortalRing && gamePlayer) {
    gamePortalVortex.rotation.y += 0.006; // Spin Earth

    // Gently rotate split halves if exit portal is destroyed
    const leftHalf = gamePortalGroup.getObjectByName("left_half");
    const rightHalf = gamePortalGroup.getObjectByName("right_half");
    if (leftHalf && rightHalf) {
      leftHalf.rotation.y += 0.003;
      leftHalf.rotation.x += 0.001;
      rightHalf.rotation.y += 0.003;
      rightHalf.rotation.z -= 0.001;
    }

    // Smoothly scale exit portal on hover
    const targetPortalScale = isPortalHovered ? 1.25 : 1.0;
    const currentPScale = gamePortalGroup.scale.x;
    const nextPScale = currentPScale + (targetPortalScale - currentPScale) * 0.15;
    gamePortalGroup.scale.set(nextPScale, nextPScale, nextPScale);

    // Orbit the Moon
    const portalMoon = gamePortalGroup.getObjectByName("portal_moon");
    if (portalMoon) {
      const moonAngle = (performance.now() * 0.001);
      portalMoon.position.set(Math.sin(moonAngle) * 3.4, 0.3, Math.cos(moonAngle) * 3.4);
      portalMoon.rotation.y += 0.015;
    }

    const scalePulse = 1.0 + Math.sin(performance.now() * 0.003) * 0.04;
    gamePortalRing.scale.set(scalePulse, scalePulse, 1.0);

    if (gamePortalSprite) {
      gamePortalSprite.lookAt(gameCamera.position);
    }

    const portalDist = Math.hypot(gamePlayer.position.x - gamePortalGroup.position.x, gamePlayer.position.z - gamePortalGroup.position.z);
    if (portalDist < 3.2 && is3DMode && visitedNodes.includes("exit_portal") && !transitionLoadingActive) {
      // Exit immediately without shooting again!
      gamePlayer.position.set(0, 1.78, 0);
      gamePlayerTargetPos = null;
      const exitBtn = document.getElementById("exit-3d-btn") || document.getElementById("view-mode-btn");
      if (exitBtn) {
        exitBtn.click();
      }
    } else if (portalDist < 6.5 && is3DMode && !isShootingEarth && !visitedNodes.includes("exit_portal")) {
      isShootingEarth = true;
      shootEarthTimeStart = performance.now();
      gamePlayerTargetPos = null;
      gameCamShakeOffset.set(0, 0, 0);
      laserSoundPlayed = false;
      explosionSoundPlayed = false;
    }

    // Planet Proximity and Shooting Trigger
    let isPlutoLocked = false;
    if (closestNode && closestNode.def.id === "cv") {
      const coreVisitedCount = ["home", "about", "skills", "experience", "projects", "testimonials", "contact"].filter(id => visitedNodes.includes(id)).length;
      if (coreVisitedCount < 7) {
        isPlutoLocked = true;
      }
    }

    if (minDistance < 6.5 && closestNode && closestNode.def.id !== "home" && !isPlutoLocked && !visitedNodes.includes(closestNode.def.id) && !isShootingPlanet && !isShootingEarth && !transitionLoadingActive) {
      isShootingPlanet = true;
      shootingPlanetNode = closestNode;
      shootPlanetTimeStart = performance.now();
      gamePlayerTargetPos = null;
      gameCamShakeOffset.set(0, 0, 0);
      laserSoundPlayed = false;
      explosionSoundPlayed = false;
    }

    if (isShootingEarth) {
      const elapsed = performance.now() - shootEarthTimeStart;

      // Rotate Jhin to face Earth portal smoothly
      const targetAngle = Math.atan2(
        gamePortalGroup.position.x - gamePlayer.position.x,
        gamePortalGroup.position.z - gamePlayer.position.z
      );
      let diffAngle = targetAngle - gamePlayer.rotation.y;
      while (diffAngle < -Math.PI) diffAngle += Math.PI * 2;
      while (diffAngle > Math.PI) diffAngle -= Math.PI * 2;
      gamePlayer.rotation.y += diffAngle * 0.15;

      if (elapsed < 800) {
        // Phase 1: Aiming
        gameCamShakeOffset.set(
          (Math.random() - 0.5) * 0.02,
          (Math.random() - 0.5) * 0.02,
          (Math.random() - 0.5) * 0.02
        );
        // Pulse shoulder pad light intensity or orb size rapidly
        const shoulder = gamePlayer.getObjectByName("shoulderPad");
        if (shoulder && shoulder.children[1]) {
          shoulder.children[1].scale.setScalar(1.2 + Math.sin(time * 25) * 0.2);
        }
      } else if (elapsed < 2000) {
        // Phase 2: Shooting Laser Beam
        if (!laserSoundPlayed) {
          playLaserShootSound();
          laserSoundPlayed = true;
        }
        
        // Target is Earth
        const targetPos = gamePortalGroup.position.clone();
        
        // Start from gun tip
        const rightArm = gamePlayer.getObjectByName("rightArmGroup");
        const gunTip = new THREE.Vector3(0, -0.38, 0.12);
        if (rightArm) {
          gunTip.applyMatrix4(rightArm.matrixWorld);
        } else {
          gunTip.copy(gamePlayer.position).add(new THREE.Vector3(0.28, -0.98, 0.12));
        }

        const dist = gunTip.distanceTo(targetPos);

        if (!laserBeamMesh) {
          // Double layered massive laser beam
          const giantLaser = new THREE.Group();

          // Outer giant red glow beam
          const outerGeom = new THREE.CylinderGeometry(0.35, 0.35, dist, 12);
          outerGeom.translate(0, dist / 2, 0);
          outerGeom.rotateX(Math.PI / 2);
          const outerMat = new THREE.MeshBasicMaterial({
            color: 0xff0055,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
          });
          const outerMesh = new THREE.Mesh(outerGeom, outerMat);
          giantLaser.add(outerMesh);

          // Inner bright core (white-cyan hot plasma)
          const innerGeom = new THREE.CylinderGeometry(0.12, 0.12, dist, 12);
          innerGeom.translate(0, dist / 2, 0);
          innerGeom.rotateX(Math.PI / 2);
          const innerMat = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.95
          });
          const innerMesh = new THREE.Mesh(innerGeom, innerMat);
          giantLaser.add(innerMesh);

          laserBeamMesh = giantLaser;
          gameScene.add(laserBeamMesh);
        }

        if (laserBeamMesh) {
          laserBeamMesh.position.copy(gunTip);
          laserBeamMesh.lookAt(targetPos);
          const scalePulse = 1.0 + Math.sin(time * 40) * 0.4;
          laserBeamMesh.scale.set(scalePulse, scalePulse, 1.0);
        }

        // Screen Shake during firing
        gameCamShakeOffset.set(
          (Math.random() - 0.5) * 0.18,
          (Math.random() - 0.5) * 0.18,
          (Math.random() - 0.5) * 0.18
        );

        // Flash Earth/Mercury white and red
        const flashColor = (Math.floor(elapsed / 70) % 2 === 0) ? 0xff0000 : 0xffffff;
        if (gamePortalVortex && gamePortalVortex.material) {
          gamePortalVortex.material.color.setHex(flashColor);
        }
        const leftHalf = gamePortalGroup.getObjectByName("left_half");
        const rightHalf = gamePortalGroup.getObjectByName("right_half");
        if (leftHalf && leftHalf.material) leftHalf.material.color.setHex(flashColor);
        if (rightHalf && rightHalf.material) rightHalf.material.color.setHex(flashColor);
      } else if (elapsed < 3600) {
        // Phase 3: Earth Explodes into pieces
        if (!explosionSoundPlayed) {
          playExplosionSound();
          explosionSoundPlayed = true;
        }
        if (laserBeamMesh) {
          gameScene.remove(laserBeamMesh);
          laserBeamMesh = null;
        }

        // Hide Earth, atmosphere, moon
        if (gamePortalVortex && gamePortalVortex.visible) {
          gamePortalVortex.visible = false;
          if (!visitedNodes.includes("exit_portal")) {
            visitedNodes.push("exit_portal");
          }

          // Spawn split halves for Mercury Exit Portal!
          const radius = gamePortalVortex.geometry.parameters.radius;
          const tex = gamePortalVortex.material.map;

          const leftGeom = new THREE.SphereGeometry(radius, 24, 24, 0, Math.PI, 0, Math.PI);
          const rightGeom = new THREE.SphereGeometry(radius, 24, 24, Math.PI, Math.PI, 0, Math.PI);
          
          const halfMat = new THREE.MeshPhongMaterial({
            map: tex,
            color: 0x94a3b8,
            shininess: 30,
            side: THREE.DoubleSide
          });

          const leftHalf = new THREE.Mesh(leftGeom, halfMat);
          leftHalf.name = "left_half";
          leftHalf.position.set(0, 0, 0);

          const rightHalf = new THREE.Mesh(rightGeom, halfMat);
          rightHalf.name = "right_half";
          rightHalf.position.set(0, 0, 0);

          gamePortalGroup.add(leftHalf);
          gamePortalGroup.add(rightHalf);
          
          const atmosphere = gamePortalGroup.children.find(c => c !== gamePortalVortex && c !== gamePortalSprite && c.geometry && c.geometry.type === "SphereGeometry");
          if (atmosphere) atmosphere.visible = false;

          const portalMoon = gamePortalGroup.getObjectByName("portal_moon");
          if (portalMoon) portalMoon.visible = false;

          // Spawn explosion particles
          const pGeom = new THREE.SphereGeometry(0.08 + Math.random() * 0.12, 8, 8);
          const colors = [0x94a3b8, 0xcbd5e1, 0xe2e8f0, 0x64748b, 0x475569];
          for (let i = 0; i < 70; i++) {
            const pMat = new THREE.MeshBasicMaterial({
              color: colors[Math.floor(Math.random() * colors.length)],
              transparent: true,
              opacity: 0.95
            });
            const p = new THREE.Mesh(pGeom, pMat);
            p.position.copy(gamePortalGroup.position);

            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2.0 * Math.random() - 1.0);
            const speed = 0.05 + Math.random() * 0.18;

            p.userData = {
              velo: new THREE.Vector3(
                Math.sin(phi) * Math.cos(theta) * speed,
                Math.sin(phi) * Math.sin(theta) * speed + 0.02,
                Math.cos(phi) * speed
              ),
              rotSpeed: new THREE.Vector3(
                (Math.random() - 0.5) * 0.3,
                (Math.random() - 0.5) * 0.3,
                (Math.random() - 0.5) * 0.3
              ),
              decay: 0.975
            };
            gameScene.add(p);
            earthExplosionParticles.push(p);
          }
        } else if (earthExplosionParticles.length === 0) {
          // If already destroyed, make the existing halves snap back to center and blast apart again!
          const leftHalf = gamePortalGroup.getObjectByName("left_half");
          const rightHalf = gamePortalGroup.getObjectByName("right_half");
          if (leftHalf) leftHalf.position.set(0, 0, 0);
          if (rightHalf) rightHalf.position.set(0, 0, 0);

          // Spawn explosion particles
          const pGeom = new THREE.SphereGeometry(0.08 + Math.random() * 0.12, 8, 8);
          const colors = [0x94a3b8, 0xcbd5e1, 0xe2e8f0, 0x64748b, 0x475569];
          for (let i = 0; i < 70; i++) {
            const pMat = new THREE.MeshBasicMaterial({
              color: colors[Math.floor(Math.random() * colors.length)],
              transparent: true,
              opacity: 0.95
            });
            const p = new THREE.Mesh(pGeom, pMat);
            p.position.copy(gamePortalGroup.position);

            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2.0 * Math.random() - 1.0);
            const speed = 0.05 + Math.random() * 0.18;

            p.userData = {
              velo: new THREE.Vector3(
                Math.sin(phi) * Math.cos(theta) * speed,
                Math.sin(phi) * Math.sin(theta) * speed + 0.02,
                Math.cos(phi) * speed
              ),
              rotSpeed: new THREE.Vector3(
                (Math.random() - 0.5) * 0.3,
                (Math.random() - 0.5) * 0.3,
                (Math.random() - 0.5) * 0.3
              ),
              decay: 0.975
            };
            gameScene.add(p);
            earthExplosionParticles.push(p);
          }
        }

        // Update explosion particles
        earthExplosionParticles.forEach(p => {
          p.position.add(p.userData.velo);
          p.rotation.x += p.userData.rotSpeed.x;
          p.rotation.y += p.userData.rotSpeed.y;
          p.rotation.z += p.userData.rotSpeed.z;
          p.userData.velo.multiplyScalar(p.userData.decay);
          p.scale.multiplyScalar(0.95);
          p.material.opacity *= 0.95;
        });

        const leftHalf = gamePortalGroup.getObjectByName("left_half");
        const rightHalf = gamePortalGroup.getObjectByName("right_half");
        if (leftHalf && rightHalf) {
          leftHalf.rotation.y += 0.005;
          leftHalf.rotation.x += 0.002;
          rightHalf.rotation.y += 0.005;
          rightHalf.rotation.z -= 0.002;

          const radius = gamePortalVortex.geometry.parameters.radius;
          const maxDrift = radius * 2.0;

          if (leftHalf.position.x > -maxDrift) {
            leftHalf.position.x -= 0.035;
          }
          if (rightHalf.position.x < maxDrift) {
            rightHalf.position.x += 0.035;
          }
        }

        // Strong shake
        const intensity = 0.35 * (1.0 - (elapsed - 2000) / 1600);
        gameCamShakeOffset.set(
          (Math.random() - 0.5) * intensity,
          (Math.random() - 0.5) * intensity,
          (Math.random() - 0.5) * intensity
        );
      } else {
        // Phase 4: Finalize Exit
        earthExplosionParticles.forEach(p => gameScene.remove(p));
        earthExplosionParticles = [];
        if (laserBeamMesh) {
          gameScene.remove(laserBeamMesh);
          laserBeamMesh = null;
        }

        // Clean up split halves
        const leftHalf = gamePortalGroup.getObjectByName("left_half");
        if (leftHalf) gamePortalGroup.remove(leftHalf);
        const rightHalf = gamePortalGroup.getObjectByName("right_half");
        if (rightHalf) gamePortalGroup.remove(rightHalf);

        isShootingEarth = false;
        gameCamShakeOffset.set(0, 0, 0);

        // Reset Earth visibility for next play
        if (gamePortalVortex) gamePortalVortex.visible = true;
        const atmosphere = gamePortalGroup.children.find(c => c !== gamePortalVortex && c !== gamePortalSprite && c.geometry && c.geometry.type === "SphereGeometry");
        if (atmosphere) atmosphere.visible = true;
        const portalMoon = gamePortalGroup.getObjectByName("portal_moon");
        if (portalMoon) portalMoon.visible = true;

        gamePlayer.position.set(0, 1.78, 0);
        gamePlayerTargetPos = null;

        const exitBtn = document.getElementById("exit-3d-btn") || document.getElementById("view-mode-btn");
        if (exitBtn) {
          exitBtn.click();
        }
      }
    } else if (isShootingPlanet && shootingPlanetNode) {
      const elapsed = performance.now() - shootPlanetTimeStart;

      // Rotate Jhin to face planet smoothly
      const targetAngle = Math.atan2(
        shootingPlanetNode.group.position.x - gamePlayer.position.x,
        shootingPlanetNode.group.position.z - gamePlayer.position.z
      );
      let diffAngle = targetAngle - gamePlayer.rotation.y;
      while (diffAngle < -Math.PI) diffAngle += Math.PI * 2;
      while (diffAngle > Math.PI) diffAngle -= Math.PI * 2;
      gamePlayer.rotation.y += diffAngle * 0.15;

      if (elapsed < 800) {
        // Phase 1: Aiming
        gameCamShakeOffset.set(
          (Math.random() - 0.5) * 0.02,
          (Math.random() - 0.5) * 0.02,
          (Math.random() - 0.5) * 0.02
        );
        const shoulder = gamePlayer.getObjectByName("shoulderPad");
        if (shoulder && shoulder.children[1]) {
          shoulder.children[1].scale.setScalar(1.2 + Math.sin(time * 25) * 0.2);
        }
      } else if (elapsed < 2000) {
        // Phase 2: Shooting Laser Beam
        if (!laserSoundPlayed) {
          playLaserShootSound();
          laserSoundPlayed = true;
        }
        const targetPos = shootingPlanetNode.group.position.clone();
        targetPos.y = 0.3; // Center of planet mesh

        // Start from gun tip
        const rightArm = gamePlayer.getObjectByName("rightArmGroup");
        const gunTip = new THREE.Vector3(0, -0.38, 0.12);
        if (rightArm) {
          gunTip.applyMatrix4(rightArm.matrixWorld);
        } else {
          gunTip.copy(gamePlayer.position).add(new THREE.Vector3(0.28, -0.98, 0.12));
        }

        const dist = gunTip.distanceTo(targetPos);

        if (!laserBeamMesh) {
          const giantLaser = new THREE.Group();

          // Outer giant red glow beam
          const outerGeom = new THREE.CylinderGeometry(0.35, 0.35, dist, 12);
          outerGeom.translate(0, dist / 2, 0);
          outerGeom.rotateX(Math.PI / 2);
          const outerMat = new THREE.MeshBasicMaterial({
            color: 0xff0055,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
          });
          const outerMesh = new THREE.Mesh(outerGeom, outerMat);
          giantLaser.add(outerMesh);

          // Inner bright core (white-cyan hot plasma)
          const innerGeom = new THREE.CylinderGeometry(0.12, 0.12, dist, 12);
          innerGeom.translate(0, dist / 2, 0);
          innerGeom.rotateX(Math.PI / 2);
          const innerMat = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.95
          });
          const innerMesh = new THREE.Mesh(innerGeom, innerMat);
          giantLaser.add(innerMesh);

          laserBeamMesh = giantLaser;
          gameScene.add(laserBeamMesh);
        }

        if (laserBeamMesh) {
          laserBeamMesh.position.copy(gunTip);
          laserBeamMesh.lookAt(targetPos);
          const scalePulse = 1.0 + Math.sin(time * 40) * 0.4;
          laserBeamMesh.scale.set(scalePulse, scalePulse, 1.0);
        }

        // Screen Shake
        gameCamShakeOffset.set(
          (Math.random() - 0.5) * 0.18,
          (Math.random() - 0.5) * 0.18,
          (Math.random() - 0.5) * 0.18
        );

        // Flash Planet red and white
        if (shootingPlanetNode.mesh && shootingPlanetNode.mesh.material) {
          if (Math.floor(elapsed / 70) % 2 === 0) {
            shootingPlanetNode.mesh.material.color.setHex(0xff0000);
          } else {
            shootingPlanetNode.mesh.material.color.setHex(0xffffff);
          }
        }
      } else if (elapsed < 3600) {
        // Phase 3: Planet Explodes into pieces
        if (!explosionSoundPlayed) {
          playExplosionSound();
          explosionSoundPlayed = true;
        }
        if (laserBeamMesh) {
          gameScene.remove(laserBeamMesh);
          laserBeamMesh = null;
        }

        if (shootingPlanetNode.mesh && shootingPlanetNode.mesh.visible) {
          shootingPlanetNode.mesh.visible = false;

          ["node_base", "pad_ring", "node_beam", "name_label"].forEach(partName => {
            const part = shootingPlanetNode.group.getObjectByName(partName);
            if (part) part.visible = true;
          });

          // Hide only planet-specific sub-elements such as rings and moons; keep the station pad intact.
          const keepAfterExplosion = new Set(["node_base", "pad_ring", "node_beam", "name_label", "left_half", "right_half"]);
          shootingPlanetNode.group.children.forEach(child => {
            if (child !== shootingPlanetNode.sprite && child !== shootingPlanetNode.mesh && !keepAfterExplosion.has(child.name) && !child.name.startsWith("rock_")) {
              child.visible = false;
            }
          });

          spawnPlanetExplosionFx(shootingPlanetNode);

          // Spawn explosion particles matching planet color
          const pColor = shootingPlanetNode.def.color;
          const colors = [pColor, 0xffffff, 0xffd166, 0xff3355, 0x555555];

          for (let i = 0; i < 120; i++) {
            const pGeom = i % 3 === 0
              ? new THREE.DodecahedronGeometry(0.08 + Math.random() * 0.18, 0)
              : new THREE.SphereGeometry(0.05 + Math.random() * 0.12, 8, 8);
            const pMat = new THREE.MeshBasicMaterial({
              color: colors[Math.floor(Math.random() * colors.length)],
              transparent: true,
              opacity: 0.95,
              blending: i % 4 === 0 ? THREE.AdditiveBlending : THREE.NormalBlending
            });
            const p = new THREE.Mesh(pGeom, pMat);
            p.position.copy(shootingPlanetNode.group.position);
            p.position.y = 0.25 + Math.random() * 0.5;

            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2.0 * Math.random() - 1.0);
            const speed = 0.09 + Math.random() * 0.28;

            p.userData = {
              velo: new THREE.Vector3(
                Math.sin(phi) * Math.cos(theta) * speed,
                Math.sin(phi) * Math.sin(theta) * speed + 0.04,
                Math.cos(phi) * speed
              ),
              rotSpeed: new THREE.Vector3(
                (Math.random() - 0.5) * 0.3,
                (Math.random() - 0.5) * 0.3,
                (Math.random() - 0.5) * 0.3
              ),
              decay: 0.968 + Math.random() * 0.012
            };
            gameScene.add(p);
            planetExplosionParticles.push(p);
          }
        }

        updatePlanetExplosionFx();

        // Update explosion particles
        planetExplosionParticles.forEach(p => {
          p.position.add(p.userData.velo);
          p.rotation.x += p.userData.rotSpeed.x;
          p.rotation.y += p.userData.rotSpeed.y;
          p.rotation.z += p.userData.rotSpeed.z;
          p.userData.velo.multiplyScalar(p.userData.decay);
          p.scale.multiplyScalar(0.95);
          p.material.opacity *= 0.95;
        });

        // Strong shake
        const intensity = 0.35 * (1.0 - (elapsed - 2000) / 1600);
        gameCamShakeOffset.set(
          (Math.random() - 0.5) * intensity,
          (Math.random() - 0.5) * intensity,
          (Math.random() - 0.5) * intensity
        );
      } else {
        // Phase 4: Finalize Planet
        planetExplosionParticles.forEach(p => gameScene.remove(p));
        planetExplosionParticles = [];
        clearPlanetExplosionFx();
        if (laserBeamMesh) {
          gameScene.remove(laserBeamMesh);
          laserBeamMesh = null;
        }

        isShootingPlanet = false;
        gameCamShakeOffset.set(0, 0, 0);

        const currentPlanet = shootingPlanetNode;
        shootingPlanetNode = null;

        openGameModal(currentPlanet.def);
      }
    } else {
      gameCamShakeOffset.set(0, 0, 0);
      if (planetExplosionParticles.length > 0) {
        planetExplosionParticles.forEach(p => gameScene.remove(p));
        planetExplosionParticles = [];
      }
      clearPlanetExplosionFx();
    }
  }

  const interactionHud = document.getElementById("interaction-hud");
  const interactionText = document.getElementById("interaction-text");

  if (minDistance < 3.8 && closestNode && !activeModalNode && !transitionLoadingActive && !isShootingPlanet && !isShootingEarth) {
    if (interactionHud && interactionText) {
      interactionHud.classList.remove("hidden");
      const nodeNameVi = getNodeName(closestNode.def, 'vi');
      const nodeNameEn = getNodeName(closestNode.def, 'en');

      let isPlutoLocked = false;
      if (closestNode.def.id === "cv") {
        const coreVisitedCount = ["about", "skills", "experience", "projects", "testimonials", "contact"].filter(id => visitedNodes.includes(id)).length;
        if (coreVisitedCount < 6) {
          isPlutoLocked = true;
        }
      }

      let viMsg, enMsg;
      if (isPlutoLocked) {
        const coreVisitedCount = ["about", "skills", "experience", "projects", "testimonials", "contact"].filter(id => visitedNodes.includes(id)).length;
        viMsg = `ĐANG Ở GẦN ĐỊA DANH ${nodeNameVi} - VUI LÒNG MỞ KHÓA CÁC TRẠM KHÁC (${coreVisitedCount}/6)`;
        enMsg = `NEAR ${nodeNameEn} - PLEASE UNLOCK ALL OTHER PLANETS FIRST (${coreVisitedCount}/6)`;
      } else if (visitedNodes.includes(closestNode.def.id)) {
        viMsg = `ĐANG Ở GẦN ĐỊA DANH ${nodeNameVi} - ĐỨNG YÊN ĐỂ KẾT NỐI`;
        enMsg = `NEAR ${nodeNameEn} NODE - STAY STILL TO CONNECT`;
      } else {
        viMsg = `ĐANG Ở GẦN ĐỊA DANH ${nodeNameVi} - ĐỨNG YÊN ĐỂ KHỞI ĐỘNG PHÁO HỦY DIỆT`;
        enMsg = `NEAR ${nodeNameEn} NODE - STAY STILL TO ENGAGE CANNON`;
      }

      interactionText.textContent = currentLang === 'vi' ? viMsg : enMsg;
      interactionText.setAttribute("data-vi", viMsg);
      interactionText.setAttribute("data-en", enMsg);
    }

    // Update bottom-left location HUD text
    const locText = document.getElementById("current-location-text");
    if (locText) {
      const displayVal = getNodeName(closestNode.def, currentLang);
      if (locText.textContent !== displayVal) {
        locText.textContent = displayVal;
      }
    }

    if (minDistance < 3.2 && !activeModalNode && !transitionLoadingActive && lastOpenedNode !== closestNode.def.id) {
      lastOpenedNode = closestNode.def.id;
      openGameModal(closestNode.def);
    }
  } else {
    if (interactionHud) {
      interactionHud.classList.add("hidden");
    }
    if (minDistance >= 5.0) {
      lastOpenedNode = null;
      // Reset bottom-left location HUD text when in free space
      const locText = document.getElementById("current-location-text");
      if (locText) {
        const defaultVal = currentLang === 'vi' ? "Không Gian Tự Do" : "Free Orbiting Space";
        if (locText.textContent !== defaultVal) {
          locText.textContent = defaultVal;
        }
      }
    }
  }

  // Central Sun proximity check for thank you letter (unlocked after exploring Pluto CV node)
  if (gamePlayer) {
    const sunDist = Math.hypot(gamePlayer.position.x, gamePlayer.position.z);

    if (visitedNodes.includes("cv")) {
      if (sunDist < 6.0 && !activeModalNode && !transitionLoadingActive && !isShootingPlanet && !isShootingEarth) {
        if (interactionHud && interactionText) {
          interactionHud.classList.remove("hidden");
          const viMsg = "ĐANG Ở GẦN MẶT TRỜI - NHẤN VÀO MẶT TRỜI ĐỂ ĐỌC THƯ CẢM ƠN";
          const enMsg = "NEAR THE SUN - CLICK ON THE SUN TO READ THANK YOU LETTER";
          interactionText.textContent = currentLang === 'vi' ? viMsg : enMsg;
          interactionText.setAttribute("data-vi", viMsg);
          interactionText.setAttribute("data-en", enMsg);
        }

        const locText = document.getElementById("current-location-text");
        if (locText) {
          const displayVal = currentLang === 'vi' ? "Mặt Trời" : "The Sun";
          if (locText.textContent !== displayVal) {
            locText.textContent = displayVal;
          }
        }
      } else {
        if (lastOpenedNode === "sun_thanks" && sunDist >= 8.0) {
          lastOpenedNode = null;
        }
      }
    }
  }

  // Calculate cycling rainbow color from the 6 node colors (RGB loop)
  const cycleTime = performance.now() * 0.0005; // color change speed
  const colorIndex = Math.floor(cycleTime) % nodeDefs.length;
  const nextColorIndex = (colorIndex + 1) % nodeDefs.length;
  const blendFactor = cycleTime % 1;

  const colorA = new THREE.Color(nodeDefs[colorIndex].color);
  const colorB = new THREE.Color(nodeDefs[nextColorIndex].color);
  const idleColor = colorA.clone().lerp(colorB, blendFactor);

  let targetFloorColor = idleColor.clone();
  let targetGridColor = idleColor.clone();
  let targetLightIntensity = 1.0; // gentle background glow
  let targetLightColor = idleColor.clone();
  let targetLightPos = new THREE.Vector3(0, -1.0, 0);

  if (minDistance < 10.0 && closestNode) {
    const factor = Math.max(0, Math.min(1, (10.0 - minDistance) / 6.0));
    const nodeColor = new THREE.Color(closestNode.def.color);
    targetFloorColor.lerp(nodeColor, factor);
    targetGridColor.lerp(nodeColor, factor);

    targetLightIntensity = 1.0 + factor * 3.0; // scales up to 4.0 intensity
    targetLightColor.lerp(nodeColor, factor);

    const nodePos = closestNode.group.position.clone();
    nodePos.y = -1.0;
    targetLightPos.lerp(nodePos, factor);
  }

  if (gameTechFloor && gameTechFloor.material) {
    gameTechFloor.material.color.lerp(targetFloorColor, 0.1);
  }
  if (gameGridHelper && gameGridHelper.material) {
    gameGridHelper.material.color.lerp(targetGridColor, 0.1);
  }
  if (gameFloorPointLight) {
    gameFloorPointLight.intensity += (targetLightIntensity - gameFloorPointLight.intensity) * 0.1;
    gameFloorPointLight.color.lerp(targetLightColor, 0.1);
    gameFloorPointLight.position.lerp(targetLightPos, 0.1);
  }
  if (gamePerimeterRail && gamePerimeterRail.material) {
    gamePerimeterRail.material.color.lerp(targetGridColor, 0.1);
  }
  gameFenceBeacons.forEach(beacon => {
    if (beacon.material) {
      beacon.material.color.lerp(targetGridColor, 0.1);
    }
  });
  gameWalkwayMeshes.forEach(walkway => {
    if (walkway.material) {
      walkway.material.color.lerp(targetGridColor, 0.1);
    }
  });

  if (gameStars && gameStars.geometry && gameStars.geometry.attributes.position) {
    const pos = gameStars.geometry.attributes.position.array;
    for (let i = 2; i < pos.length; i += 3) {
      const speed = transitionLoadingActive ? 12.0 : 0.15;
      pos[i] -= speed;
      if (pos[i] < -200) {
        pos[i] = 200;
        pos[i - 2] = (Math.random() - 0.5) * 200;
        pos[i - 1] = (Math.random() - 0.5) * 150 + 20;
      }
    }
    gameStars.geometry.attributes.position.needsUpdate = true;
  }

  // Space Dust Animation
  if (gameSpaceDust && gameSpaceDust.geometry && gameSpaceDust.geometry.attributes.position) {
    const posAttr = gameSpaceDust.geometry.attributes.position;
    const vels = gameSpaceDust.userData.velocities;
    const array = posAttr.array;
    for (let i = 0; i < posAttr.count; i++) {
      let x = array[i * 3] + vels[i].x;
      let y = array[i * 3 + 1] + vels[i].y;
      let z = array[i * 3 + 2] + vels[i].z;
      
      // Keep them bound within a box
      if (x < -40 || x > 40) vels[i].x *= -1;
      if (y < -4 || y > 8) vels[i].y *= -1;
      if (z < -40 || z > 40) vels[i].z *= -1;
      
      array[i * 3] = x;
      array[i * 3 + 1] = y;
      array[i * 3 + 2] = z;
    }
    posAttr.needsUpdate = true;
  }

  // Shooting Stars Animation
  if (activeShootingStars.length < 3 && Math.random() < 0.006) {
    const start = new THREE.Vector3(
      (Math.random() - 0.5) * 300,
      100 + Math.random() * 50,
      (Math.random() - 0.5) * 300
    );
    const dir = new THREE.Vector3(
      (Math.random() - 0.5) * 2,
      -1 - Math.random() * 0.5,
      (Math.random() - 0.5) * 2
    ).normalize();
    
    const length = 15 + Math.random() * 25;
    const speed = 4 + Math.random() * 6;
    
    const points = [
      start.clone(),
      start.clone().addScaledVector(dir, -length)
    ];
    const geom = new THREE.BufferGeometry().setFromPoints(points);
    const colors = [
      1, 1, 1, // Head is white
      0.2, 0.6, 1 // Tail is light blue
    ];
    geom.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    
    const mat = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending
    });
    
    const line = new THREE.Line(geom, mat);
    gameScene.add(line);
    
    activeShootingStars.push({
      mesh: line,
      pos: start,
      dir: dir,
      speed: speed,
      life: 1.0,
      decay: 0.015 + Math.random() * 0.01
    });
  }
  
  for (let i = activeShootingStars.length - 1; i >= 0; i--) {
    const star = activeShootingStars[i];
    star.life -= star.decay;
    if (star.life <= 0) {
      gameScene.remove(star.mesh);
      star.mesh.geometry.dispose();
      star.mesh.material.dispose();
      activeShootingStars.splice(i, 1);
    } else {
      star.pos.addScaledVector(star.dir, star.speed);
      
      const positions = star.mesh.geometry.attributes.position.array;
      positions[0] = star.pos.x;
      positions[1] = star.pos.y;
      positions[2] = star.pos.z;
      
      const tail = star.pos.clone().addScaledVector(star.dir, -20);
      positions[3] = tail.x;
      positions[4] = tail.y;
      positions[5] = tail.z;
      
      star.mesh.geometry.attributes.position.needsUpdate = true;
      star.mesh.material.opacity = star.life;
    }
  }

  // Smoothly interpolate camera radius towards target
  gameCameraRadius += (gameCameraTargetRadius - gameCameraRadius) * 0.15;

  updateGameCameraPosition();
  drawMinimap();
  gameRenderer.render(gameScene, gameCamera);
}

function stopGame3D() {
  stopBgMusic();
  if (gameAnimationId) {
    cancelAnimationFrame(gameAnimationId);
    gameAnimationId = null;
  }
  closeGameModal();
  
  if (gameRenderer) {
    try {
      gameRenderer.dispose();
    } catch (e) {
      console.warn("Error disposing gameRenderer:", e);
    }
    gameRenderer = null;
  }
  if (gameScene) {
    try {
      gameScene.traverse(object => {
        try {
          if (object.geometry) object.geometry.dispose();
          if (object.material) {
            if (Array.isArray(object.material)) {
              object.material.forEach(mat => {
                if (mat && typeof mat.dispose === 'function') mat.dispose();
              });
            } else {
              if (object.material && typeof object.material.dispose === 'function') object.material.dispose();
            }
          }
        } catch (err) {
          // Ignore individual node disposal errors
        }
      });
    } catch (e) {
      console.warn("Error traversing gameScene:", e);
    }
    gameScene = null;
  }
  gamePlayer = null;
  gameUnderGlobe = null;
  gamePortalGroup = null;
  gameNodes = [];
  gameWalkwayMeshes = [];
  gameInitialized = false;
  lastOpenedNode = null;
  isShootingEarth = false;
  shootEarthTimeStart = 0;
  isShootingPlanet = false;
  shootPlanetTimeStart = 0;
  shootingPlanetNode = null;
  laserBeamMesh = null;
  earthExplosionParticles = [];
  planetExplosionParticles = [];
  planetExplosionFx = [];

  try {
    updateQuestUI();
  } catch (e) {
    console.warn("Error resetting quest HUD:", e);
  }
}

function openGameModal(nodeDef) {
  const modal = document.getElementById("game-modal");
  const content = document.getElementById("game-modal-content");
  if (!modal || !content) return;

  // Block access to Pluto if locked
  if (nodeDef.id === "cv") {
    const coreVisitedCount = ["home", "about", "skills", "experience", "projects", "testimonials", "contact"].filter(id => visitedNodes.includes(id)).length;
    if (coreVisitedCount < 7) {
      if (typeof playBeep === 'function') {
        playBeep(400, 0.15, 'sine', 0.05);
      }
      showSafetyNotice(
        currentLang === 'vi' ? `🔒 VUI LÒNG MỞ KHÓA ${7 - coreVisitedCount} HÀNH TINH NỮA ĐỂ TRUY CẬP (${coreVisitedCount}/7)` : `🔒 PLEASE UNLOCK ${7 - coreVisitedCount} MORE PLANETS TO ACCESS (${coreVisitedCount}/7)`,
        "#a855f7"
      );
      return;
    }
  }

  let isNewUnlock = false;
  // Track visit to other planets
  if (!visitedNodes.includes(nodeDef.id)) {
    visitedNodes.push(nodeDef.id);
    updatePlutoLockState();
    isNewUnlock = true;
    sunChargeSurge = 1.6; // Trigger a sudden solar energy surge!
    updateSunTexture(); // Redraw Sun texture with rising energy level!

    // Show planet unlock cinematic effect
    showPlanetUnlockEffect(nodeDef);

    // Check if all 7 planets are now unlocked
    const coreIds = ["home", "about", "skills", "experience", "projects", "testimonials", "contact"];
    const totalVisited = coreIds.filter(id => visitedNodes.includes(id)).length;
    if (totalVisited === 7 && !allUnlockedEffectShown) {
      shouldShowAllUnlockedEffectAfterClose = true;
      allUnlockedEffectShown = true;
    }
  }

  activeModalNode = nodeDef.id;

  const showModalDelay = isNewUnlock ? 1700 : 0;

  setTimeout(() => {
    if (typeof playBeep === 'function') {
      playBeep(880, 0.18, 'sine', 0.04);
    }
  }, showModalDelay);

  const srcSection = document.getElementById(nodeDef.targetId);
  if (srcSection || nodeDef.id === "home" || nodeDef.id === "cv") {
    const colorHex = '#' + nodeDef.color.toString(16).padStart(6, '0');
    let modalHTML = '';

    if (nodeDef.id === "home") {
      modalHTML = `
        <div class="grid md:grid-cols-12 gap-8 items-center py-6">
          <!-- Captain / Pilot Command avatar -->
          <div class="md:col-span-4 flex flex-col items-center justify-center p-6 border border-pink-500/20 bg-pink-950/5 rounded-2xl relative overflow-hidden">
            <div class="absolute inset-0 scanlines pointer-events-none opacity-10"></div>
            <div class="w-32 h-32 rounded-full border border-dashed border-pink-500/40 flex justify-center items-center relative animate-[spin_40s_linear_infinite] mb-4">
              <div class="absolute inset-2 border border-dashed border-rose-400/30 rounded-full animate-[spin_20s_linear_infinite_reverse]"></div>
              <div class="w-24 h-24 rounded-full bg-pink-500/10 flex justify-center items-center text-pink-400 text-4xl shadow-[inset_0_0_20px_rgba(236,72,153,0.3)]">
                <i class="fa-solid fa-satellite-dish animate-pulse"></i>
              </div>
            </div>
            <div class="text-center font-mono">
              <div class="text-[9px] text-zinc-500 uppercase tracking-widest">COM DECK PROTOCOL</div>
              <div class="text-xs text-pink-400 font-bold tracking-widest mt-1">✓ ONLINE</div>
            </div>
          </div>

          <!-- Message -->
          <div class="md:col-span-8 space-y-4">
            <div class="border-b border-white/5 pb-4">
              <h3 class="text-pink-500 font-mono text-xs uppercase tracking-widest mb-2">
                ${currentLang === 'vi' ? '// HƯỚNG DẪN VẬN HÀNH TRẠM KHÔNG GIAN' : '// SPACE STATION OPERATIONAL MANUAL'}
              </h3>
              <div class="text-zinc-300 text-[11px] md:text-xs leading-relaxed space-y-2.5 font-sans">
                ${currentLang === 'vi' ? `
                  <p class="font-semibold text-pink-400">
                    Chào mừng các Nhà Du Hành Vũ Trụ đã cập cảng trạm chỉ huy của Nguyễn Thanh Hiền!
                  </p>
                  <p>
                    Bạn hiện đang vận hành chiến cơ trinh sát stealth-tech bay lơ lửng trong Hệ Mặt Trời ảo. Để sử dụng trạm và tìm kiếm các thông tin cần thiết, vui lòng đọc kỹ hướng dẫn vận hành dưới đây:
                  </p>
                  <ul class="list-disc pl-4 space-y-1 text-zinc-400">
                    <li><strong>Cách di chuyển:</strong> Kéo cần gạt <span class="text-cyan-400">Joystick ảo</span> ở phía dưới bên trái (nếu bạn sử dụng điện thoại/máy tính bảng) hoặc sử dụng các phím <span class="text-cyan-400">W, A, S, D / Phím mũi tên</span> hoặc <span class="text-cyan-400">nhấp chuột phải</span> lên mặt sàn 3D (nếu sử dụng máy tính) để bay tàu đi.</li>
                    <li><strong>Xoay camera:</strong> Hãy chạm và vuốt màn hình (trên điện thoại) hoặc nhấn giữ chuột trái và kéo (trên máy tính) để xoay đổi góc nhìn quanh chiến cơ.</li>
                    <li><strong>Khám phá các trạm:</strong> Hãy điều khiển tàu bay lại gần 6 trạm hành tinh chính xung quanh lõi trung tâm: <span class="text-purple-400">Sao Kim, Sao Hỏa, Sao Mộc, Sao Thổ, Sao Thiên Vương, Sao Hải Vương</span>. Khi đứng yên sát hành tinh, cổng dữ liệu sẽ tự động kết nối và hiển thị.</li>
                    <li><strong>Mở khóa trạm ẩn CV:</strong> Trạm <span class="text-amber-400">Sao Diêm Vương (Pluto)</span> ở ngoài cùng đang bị khóa bằng lá chắn bảo vệ. Bạn cần phải bay qua và mở khóa toàn bộ 6 trạm hành tinh chính ở trên, khi đó cầu dẫn đến Sao Diêm Vương mới xuất hiện để bạn tải bản CV đầy đủ.</li>
                    <li><strong>Thoát chế độ 3D:</strong> <span class="font-bold text-rose-400">Chú ý:</span> Để quay về trang giới thiệu chính (giao diện 2D thông thường), bạn không thể bấm quay lại ngay tại bảng này mà phải điều khiển chiến cơ bay vào bên trong vùng hào quang của <span class="text-emerald-400">Cổng thoát Sao Thủy (Exit Mercury Portal)</span> nằm ngẫu nhiên ngoài rìa không gian, hoặc click trực tiếp vào nút <span class="text-rose-400">"THOÁT 3D"</span> ở góc trên cùng bên phải màn hình.</li>
                  </ul>
                ` : `
                  <p class="font-semibold text-pink-400">
                    Welcome, Starfarer, to Nguyen Thanh Hien's Space Command Deck!
                  </p>
                  <p>
                    You are piloting a stealth-tech recon starship orbiting in virtual space. Please read this manual carefully to navigate the station and unlock all information:
                  </p>
                  <ul class="list-disc pl-4 space-y-1 text-zinc-400">
                    <li><strong>Movement:</strong> Use the virtual <span class="text-cyan-400">joystick handle</span> in the bottom-left (on mobile) or use <span class="text-cyan-400">W, A, S, D / Arrow keys</span> or <span class="text-cyan-400">Right-click</span> on the space floor grid (on desktop) to fly.</li>
                    <li><strong>Camera Control:</strong> Touch & drag on screen (mobile) or hold Left-click & drag (desktop) to rotate the viewport.</li>
                    <li><strong>Connect to Planets:</strong> Fly close to the 6 core planet nodes: <span class="text-purple-400">Venus, Mars, Jupiter, Saturn, Uranus, and Neptune</span>. Hovering near a node automatically establishes a secure connection.</li>
                    <li><strong>Unlock Pluto (CV):</strong> <span class="text-amber-400">Pluto</span> is protected by an energy shield. You must first unlock all 6 core planet nodes. Once done, the bridge to Pluto will be deployed, allowing you to access and download the CV!</li>
                    <li><strong>Exit 3D Workspace:</strong> <span class="font-bold text-rose-400">Important Note:</span> To return to the standard 2D list view, you must navigate your ship directly into the glowing green <span class="text-emerald-400">Mercury Exit Portal</span> positioned on the outer rim, or click the <span class="text-rose-400">"EXIT 3D"</span> button in the top-right corner.</li>
                  </ul>
                `}
              </div>
            </div>
            
            <div class="pt-1">
              <button onclick="document.getElementById('game-modal-close').click();" class="px-6 py-2.5 rounded-full border border-pink-500/40 hover:border-pink-500 bg-pink-950/20 text-pink-400 hover:text-white font-bold transition-all duration-300 transform hover:scale-105 shadow-[0_0_15px_rgba(236,72,153,0.2)] hover:shadow-[0_0_25px_rgba(236,72,153,0.4)] w-full sm:w-auto text-center font-mono text-[11px] tracking-wider">
                ${currentLang === 'vi' ? 'BẮT ĐẦU VẬN HÀNH CHIẾN CƠ ✓' : 'LAUNCH RECON STARSHIP ✓'}
              </button>
            </div>
          </div>
        </div>
      `;
    } else if (nodeDef.id === "about") {
      const bioText = currentLang === 'vi' ? 
        "Tôi là sinh viên chuyên ngành Công nghệ thông tin tại trường Cao đẳng Công nghệ Thủ Đức (TDC). Với tôi, lập trình không chỉ là những dòng lệnh khô khan, mà là nghệ thuật dệt nên những vũ trụ số. Mỗi dòng code Laravel viết ra là viên gạch xây nền vững chãi, mỗi thuật toán tối ưu là một quỹ đạo chuyển động nhịp nhàng, và mỗi giao diện tương tác là một ánh sao lấp lánh mang lại cảm xúc cho người dùng. Tôi luôn khát khao chinh phục những giới hạn mới của công nghệ để biến những dòng mã vô tri thành những hành trình trải nghiệm đầy sống động." :
        "I am an Information Technology student at Thu Duc College of Technology (TDC). To me, programming is not just dry syntax, but the art of weaving digital universes. Every line of Laravel code is a foundation stone, every optimized algorithm is a rhythmic orbit, and every interactive interface is a twinkling starlight that evokes human emotion. I constantly strive to push the boundaries of technology, transforming lifeless code into vivid, memorable journeys.";
      
      const locationVal = "Thủ Đức, TP.HCM";
      const jobVal = currentLang === 'vi' ? "Đang đi học" : "Studying";

      modalHTML = `
        <div class="grid md:grid-cols-12 gap-8 items-start">
          <!-- Avatar/Scanner Panel -->
          <div class="md:col-span-4 flex flex-col items-center justify-center p-6 border border-[#915eff]/20 bg-purple-950/5 rounded-2xl relative overflow-hidden">
            <div class="absolute inset-0 scanlines pointer-events-none opacity-10"></div>
            <div class="w-32 h-32 rounded-full border border-dashed border-[#915eff]/40 flex justify-center items-center relative animate-[spin_60s_linear_infinite] mb-4">
              <div class="absolute inset-2 border border-dashed border-cyan-500/30 rounded-full animate-[spin_30s_linear_infinite_reverse]"></div>
              <div class="w-24 h-24 rounded-full bg-purple-500/10 flex justify-center items-center text-[#915eff] text-4xl shadow-[inset_0_0_20px_rgba(145,94,255,0.3)]">
                <i class="fa-solid fa-user-astronaut animate-pulse"></i>
              </div>
            </div>
            <div class="text-center font-mono">
              <div class="text-[9px] text-zinc-500 uppercase tracking-widest">BIOMETRIC STATUS</div>
              <div class="text-xs text-emerald-400 font-bold tracking-widest mt-1">✓ ONLINE / READY</div>
            </div>
          </div>

          <!-- Bio Dossier Panel -->
          <div class="md:col-span-8 space-y-6">
            <div class="border-b border-white/5 pb-4">
              <h3 class="text-[#915eff] font-mono text-xs uppercase tracking-widest mb-2">// CREW DATA REGISTER</h3>
              <p class="text-zinc-300 text-sm md:text-base leading-relaxed">${bioText}</p>
            </div>

            <div class="grid sm:grid-cols-2 gap-4 font-mono text-xs">
              <div class="p-4 border border-white/5 bg-white/5 rounded-xl">
                <span class="text-zinc-500 uppercase tracking-wider text-[10px]">${currentLang === 'vi' ? 'NƠI Ở' : 'LOCATION'}</span>
                <div class="text-white mt-1.5 font-bold text-sm flex items-center gap-2">
                  <i class="fa-solid fa-location-dot text-[#915eff]"></i> ${locationVal}
                </div>
              </div>
              <div class="p-4 border border-white/5 bg-white/5 rounded-xl">
                <span class="text-zinc-500 uppercase tracking-wider text-[10px]">${currentLang === 'vi' ? 'TRẠNG THÁI' : 'STATUS'}</span>
                <div class="text-white mt-1.5 font-bold text-sm flex items-center gap-2">
                  <i class="fa-solid fa-briefcase text-[#915eff]"></i> ${jobVal}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Services Modules -->
        <div class="mt-8 pt-8 border-t border-white/10">
          <h3 class="text-zinc-400 font-mono text-xs uppercase tracking-widest mb-6">// CORE CAPABILITIES MODULES</h3>
          <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div class="p-6 border border-white/5 bg-[#151030]/40 rounded-2xl flex flex-col items-center text-center">
              <div class="w-12 h-12 rounded-xl bg-purple-500/10 flex justify-center items-center text-[#915eff] text-2xl mb-4"><i class="fa-solid fa-laptop-code"></i></div>
              <h4 class="text-white text-sm font-bold">Front-End Developer</h4>
            </div>
            <div class="p-6 border border-white/5 bg-[#151030]/40 rounded-2xl flex flex-col items-center text-center">
              <div class="w-12 h-12 rounded-xl bg-cyan-500/10 flex justify-center items-center text-[#06b6d4] text-2xl mb-4"><i class="fa-solid fa-bug"></i></div>
              <h4 class="text-white text-sm font-bold">QA / Manual Tester</h4>
            </div>
            <div class="p-6 border border-white/5 bg-[#151030]/40 rounded-2xl flex flex-col items-center text-center">
              <div class="w-12 h-12 rounded-xl bg-rose-500/10 flex justify-center items-center text-[#f43f5e] text-2xl mb-4"><i class="fa-solid fa-server"></i></div>
              <h4 class="text-white text-sm font-bold">PHP & Laravel Backend</h4>
            </div>
            <div class="p-6 border border-white/5 bg-[#151030]/40 rounded-2xl flex flex-col items-center text-center">
              <div class="w-12 h-12 rounded-xl bg-emerald-500/10 flex justify-center items-center text-[#10b981] text-2xl mb-4"><i class="fa-solid fa-database"></i></div>
              <h4 class="text-white text-sm font-bold">${currentLang === 'vi' ? 'Kiến trúc Cơ sở dữ liệu' : 'Database Architect'}</h4>
            </div>
          </div>
        </div>
      `;
    } else if (nodeDef.id === "experience") {
      const roadmapTitle = currentLang === 'vi' ? 'LỘ TRÌNH HỌC TẬP / KINH NGHIỆM' : 'LEARNING ROADMAP / EXPERIENCE';
      const roadmapSubtitle = currentLang === 'vi'
        ? 'Dữ liệu hành trình tích lũy kiến thức tại Cao đẳng Công nghệ Thủ Đức (TDC).'
        : 'Knowledge accumulation journey at Thu Duc College of Technology (TDC).';
      const year1Title = currentLang === 'vi'
        ? 'Năm 1 (2023 - 2024) // Nhập môn & Tư duy Thuật toán'
        : 'Year 1 (2023 - 2024) // Foundation & Algorithmic Thinking';
      const year2Title = currentLang === 'vi'
        ? 'Năm 2 (2024 - 2025) // Web Developer PHP/Laravel'
        : 'Year 2 (2024 - 2025) // PHP/Laravel Web Developer';
      const year3Title = currentLang === 'vi'
        ? 'Năm 3 (2025 - 2026) // Kiểm thử & Thực tập'
        : 'Year 3 (2025 - 2026) // Testing & Internship';

      modalHTML = `
        <div class="grid md:grid-cols-12 gap-8 items-start">
          <!-- Scanner panel like the station dossier card -->
          <div class="md:col-span-4 flex flex-col items-center justify-center p-6 border border-[#915eff]/25 bg-purple-950/5 rounded-2xl relative overflow-hidden min-h-[280px]">
            <div class="absolute inset-0 scanlines pointer-events-none opacity-10"></div>
            <div class="w-36 h-36 rounded-full border border-dashed border-[#915eff]/45 flex justify-center items-center relative animate-[spin_60s_linear_infinite] mb-5">
              <div class="absolute inset-3 border border-dashed border-cyan-500/30 rounded-full animate-[spin_30s_linear_infinite_reverse]"></div>
              <div class="w-24 h-24 rounded-full bg-purple-500/15 flex justify-center items-center text-[#915eff] text-4xl shadow-[inset_0_0_24px_rgba(145,94,255,0.35),0_0_28px_rgba(145,94,255,0.18)]">
                <i class="fa-solid fa-route animate-pulse"></i>
              </div>
            </div>
            <div class="text-center font-mono">
              <div class="text-[9px] text-zinc-500 uppercase tracking-widest">ACADEMIC NODE STATUS</div>
              <div class="text-xs text-emerald-400 font-bold tracking-widest mt-1">✓ ONLINE / READY</div>
            </div>
          </div>

          <!-- Roadmap data panel -->
          <div class="md:col-span-8 space-y-5">
            <div class="border-b border-white/5 pb-4">
              <h3 class="text-[#915eff] font-mono text-xs uppercase tracking-widest mb-2">// ${roadmapTitle}</h3>
              <p class="text-zinc-300 text-sm leading-relaxed">${roadmapSubtitle}</p>
            </div>

            <div class="space-y-4">
              <div class="p-5 border border-purple-500/15 bg-[#151030]/45 rounded-2xl">
                <div class="text-[#915eff] text-[11px] font-mono font-bold uppercase tracking-widest">${year1Title}</div>
                <p class="text-zinc-400 text-xs font-semibold mt-1">Cao đẳng Công nghệ Thủ Đức (TDC)</p>
                <ul class="mt-3 space-y-1.5 text-zinc-300 text-xs list-disc pl-4 leading-relaxed">
                  <li>${currentLang === 'vi' ? 'Lập trình hướng cấu trúc cơ bản và tư duy thuật toán với C# & Java.' : 'Basic structured programming and algorithmic thinking with C# & Java.'}</li>
                  <li>${currentLang === 'vi' ? 'Thiết kế cơ sở dữ liệu quan hệ MySQL, chuẩn hóa dữ liệu 3NF.' : 'Relational MySQL database design and 3NF normalization.'}</li>
                  <li>${currentLang === 'vi' ? 'Đạt GPA 2.71.' : 'Achieved GPA 2.71.'}</li>
                </ul>
              </div>

              <div class="p-5 border border-cyan-500/15 bg-[#151030]/45 rounded-2xl">
                <div class="text-cyan-400 text-[11px] font-mono font-bold uppercase tracking-widest">${year2Title}</div>
                <p class="text-zinc-400 text-xs font-semibold mt-1">Cao đẳng Công nghệ Thủ Đức (TDC)</p>
                <ul class="mt-3 space-y-1.5 text-zinc-300 text-xs list-disc pl-4 leading-relaxed">
                  <li>${currentLang === 'vi' ? 'Xây dựng ứng dụng web MVC bằng Laravel Framework.' : 'Built MVC web applications using the Laravel Framework.'}</li>
                  <li>${currentLang === 'vi' ? 'Thiết kế quan hệ MySQL One-to-Many, Many-to-Many và tối ưu truy vấn.' : 'Designed MySQL One-to-Many and Many-to-Many relationships, with query optimization.'}</li>
                  <li>${currentLang === 'vi' ? 'Lập trình RESTful API, tổ chức route sạch và JSON payload chuẩn hóa.' : 'Developed RESTful APIs with clean routes and standardized JSON payloads.'}</li>
                </ul>
              </div>

              <div class="p-5 border border-rose-500/15 bg-[#151030]/45 rounded-2xl">
                <div class="text-rose-400 text-[11px] font-mono font-bold uppercase tracking-widest">${year3Title}</div>
                <p class="text-zinc-400 text-xs font-semibold mt-1">Cao đẳng Công nghệ Thủ Đức (TDC)</p>
                <ul class="mt-3 space-y-1.5 text-zinc-300 text-xs list-disc pl-4 leading-relaxed">
                  <li>${currentLang === 'vi' ? 'Nghiên cứu CSS & JavaScript nâng cao để xây dựng giao diện tương tác chất lượng cao.' : 'Studied advanced CSS & JavaScript for high-quality interactive interfaces.'}</li>
                  <li>${currentLang === 'vi' ? 'Viết Test Plan, thiết kế Test Cases và kiểm thử API bằng Postman.' : 'Wrote Test Plans, designed Test Cases, and tested APIs with Postman.'}</li>
                  <li>${currentLang === 'vi' ? 'Quản lý mã nguồn, xử lý Git conflict bằng SmartGit.' : 'Managed source code and resolved Git conflicts with SmartGit.'}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      `;
    } else if (nodeDef.id === "cv") {
      modalHTML = `
        <div class="grid md:grid-cols-12 gap-8 items-start font-mono text-zinc-300">
          <!-- Left Column: Avatar & Contact -->
          <div class="md:col-span-4 flex flex-col items-center justify-center p-6 border border-white/10 bg-white/5 rounded-2xl relative overflow-hidden">
            <div class="absolute inset-0 scanlines pointer-events-none opacity-10"></div>
            <div class="w-32 h-32 rounded-full border border-dashed border-zinc-400 flex justify-center items-center relative mb-4">
              <div class="w-24 h-24 rounded-full bg-zinc-700/20 flex justify-center items-center text-zinc-300 text-4xl shadow-[inset_0_0_20px_rgba(255,255,255,0.1)]">
                <i class="fa-solid fa-file-pdf animate-pulse"></i>
              </div>
            </div>
            <h3 class="text-white text-lg font-bold text-center">NGUYỄN THANH HIỀN</h3>
            <span class="text-zinc-400 text-xs mt-1 text-center">Web Developer & Laravel Intern</span>

            <div class="w-full mt-6 space-y-3 text-xs border-t border-white/5 pt-4">
              <div class="flex items-center gap-2 text-zinc-300">
                <i class="fa-solid fa-envelope text-zinc-400 w-4"></i> thenghien2006@gmail.com
              </div>
              <div class="flex items-center gap-2 text-zinc-300">
                <i class="fa-solid fa-phone text-zinc-400 w-4"></i> 0396 519 196
              </div>
              <div class="flex items-center gap-2 text-zinc-300">
                <i class="fa-solid fa-location-dot text-zinc-400 w-4"></i> Thủ Đức, TP. HCM
              </div>
              <div class="flex items-center gap-2 text-zinc-300">
                <i class="fa-solid fa-globe text-zinc-400 w-4 flex-shrink-0"></i> github.com/eHin-cloud
              </div>
            </div>
          </div>

          <!-- Right Column: Professional Profile -->
          <div class="md:col-span-8 space-y-6">
            <div>
              <h3 class="text-zinc-400 text-xs uppercase tracking-widest mb-2">
                ${currentLang === 'vi' ? '// HỒ SƠ CHUYÊN MÔN' : '// PROFESSIONAL PROFILE'}
              </h3>
              <p class="text-zinc-300 text-sm leading-relaxed">
                ${currentLang === 'vi' ? 
                  'Nguyễn Thanh Hiền là sinh viên chuyên ngành Công nghệ thông tin tại Trường Cao đẳng Công nghệ Thủ Đức (TDC) với mức điểm GPA ấn tượng 3.2+/4.0. Với định hướng phát triển trở thành một Fullstack Web Developer và Laravel Developer chuyên nghiệp, Hiền luôn không ngừng học hỏi và rèn luyện tư duy lập trình tối ưu. Nền tảng chuyên môn vững chắc bao gồm lập trình Backend với PHP (OOP, Laravel Framework, MVC, Service-Repository Pattern) và Frontend với HTML5, CSS3, JavaScript (ES6+), Tailwind CSS, Bootstrap cùng các công nghệ tương tác 3D như WebGL/Three.js. Bên cạnh đó, Hiền còn có năng lực thiết kế kiến trúc cơ sở dữ liệu MySQL, xây dựng và kiểm thử RESTful API (Postman), cùng tư duy QA kiểm thử phần mềm chặt chẽ (Test Plan/Test Cases). Hiền đã sở hữu kinh nghiệm thực tế qua các dự án nổi bật như Hệ thống quản lý nhà trọ SmartRoom & nền tảng tìm trọ Renty (tích hợp cổng thanh toán PayOS/VietQR, 2FA TOTP, và AI Gemini RAG), cùng trang Web Portfolio 3D tương tác không gian này. Hiện tại, Hiền sẵn sàng đón nhận các cơ hội thực tập, làm việc On-site/Remote để cống hiến giá trị và phát triển bản thân.' : 
                  'Nguyen Thanh Hien is an Information Technology student at Thu Duc College of Technology (TDC) with an outstanding GPA of 3.2+/4.0. Oriented to become a professional Fullstack Web Developer and Laravel Developer, Hien is constantly learning and refining optimal programming logic. His strong technical foundation encompasses Backend development with PHP (OOP, Laravel Framework, MVC, Service-Repository Pattern) and Frontend development using HTML5, CSS3, JavaScript (ES6+), Tailwind CSS, Bootstrap, along with interactive 3D technologies like WebGL/Three.js. Additionally, Hien is proficient in MySQL database architecture design, building and testing RESTful APIs (Postman), and maintains a strong QA software testing mindset (Test Plans/Test Cases). He has gained practical experience through prominent projects such as the SmartRoom boarding house management system & Renty accommodation platform (integrated with PayOS/VietQR payment gateway, 2FA TOTP, and Gemini RAG AI), and this interactive 3D Space Station Portfolio. Currently, Hien is eager to take on internship and collaboration opportunities (both On-site and Remote) to contribute value and grow professionally.'}
              </p>
            </div>

            <div class="pt-4 flex flex-wrap gap-4">
              <button onclick="window.print();" class="px-6 py-2.5 rounded-full border border-zinc-400/40 hover:border-zinc-300 bg-zinc-800/20 text-zinc-300 hover:text-white font-bold transition-all duration-300 flex items-center gap-2">
                <i class="fa-solid fa-print"></i> ${currentLang === 'vi' ? 'IN BẢN CV' : 'PRINT CV'}
              </button>
              <a href="./CV/24211TT3646_NGUYENTHANHHIEN_CV.pdf" target="_blank" class="px-6 py-2.5 rounded-full bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white font-bold transition-all duration-300 flex items-center gap-2 shadow-lg">
                <i class="fa-solid fa-download"></i> ${currentLang === 'vi' ? 'TẢI CV PDF THAM KHẢO' : 'DOWNLOAD RESUME PDF'}
              </a>
              <button onclick="triggerChatbotWithPrompt('${currentLang === 'vi' ? 'Hãy giới thiệu tóm tắt về CV của Nguyễn Thanh Hiền' : 'Please introduce a summary of Nguyen Thanh Hien\'s CV'}');" class="px-6 py-2.5 rounded-full bg-purple-600/20 hover:bg-purple-600/40 border border-purple-500 text-purple-300 hover:text-white font-bold transition-all duration-300 flex items-center gap-2 shadow-md">
                <i class="fa-solid fa-robot animate-pulse"></i> ${currentLang === 'vi' ? 'HỎI AI VỀ CV' : 'ASK AI ABOUT CV'}
              </button>
            </div>
          </div>
        </div>
      `;
    } else {
      modalHTML = srcSection.innerHTML;
    }

    content.innerHTML = `
      <div class="space-y-6">
        <!-- Header -->
        <div class="flex items-center gap-3 border-b border-white/10 pb-4 mb-6">
          <div class="w-10 h-10 rounded-xl flex justify-center items-center text-white text-lg font-bold" style="background-color: ${colorHex}">
            <i class="fa-solid fa-folder-open"></i>
          </div>
          <div>
            <h2 class="text-2xl font-bold font-display text-white uppercase">${getNodeName(nodeDef, currentLang)}</h2>
            <p class="text-zinc-500 text-xs font-mono uppercase tracking-widest mt-0.5">LOCAL FILE NODE DETECTED // INTEGRATED</p>
          </div>
        </div>

        <!-- Section Content Clone -->
        <div class="section-content-clone">
          ${modalHTML}
        </div>
      </div>
    `;

    if (nodeDef.targetId === "contact") {
      setupContactForm();
      
      // Hide the empty 3D Earth Globe Card inside the modal cloned content to fix the "lủng" (blank hole)
      const clonedEarthContainer = content.querySelector("#contact-earth-card");
      if (clonedEarthContainer) {
        clonedEarthContainer.style.setProperty("display", "none", "important");
      }
      
      // Adjust column layout of contact form in the modal to prevent vertical cutting-off/overflow
      const contactFormCard = content.querySelector(".md\\:col-span-7");
      if (contactFormCard) {
        contactFormCard.classList.remove("md:col-span-7");
        contactFormCard.classList.add("md:col-span-8");
        
        // Reduce double nested padding
        contactFormCard.classList.remove("p-8", "md:p-12");
        contactFormCard.classList.add("p-6", "md:p-8");
      }
      
      const contactInfoCard = content.querySelector(".md\\:col-span-5");
      if (contactInfoCard) {
        contactInfoCard.classList.remove("md:col-span-5");
        contactInfoCard.classList.add("md:col-span-4");
      }
    }

    // Force active state on cloned timeline items inside modal
    const clonedItems = content.querySelectorAll(".timeline-item");
    clonedItems.forEach(item => {
      item.classList.add("active");
      const contentEl = item.querySelector(".timeline-content");
      if (contentEl) {
        contentEl.style.opacity = "1";
        contentEl.style.transform = "translateY(0)";
      }
    });

    // Cloned 2D sections can carry scroll-reveal classes; force them visible inside the modal.
    content.querySelectorAll(".scroll-reveal").forEach(el => {
      el.classList.remove("scroll-reveal");
      el.classList.remove("is-visible");
      el.style.opacity = "";
      el.style.transform = "";
      el.style.filter = "";
      el.style.transitionDelay = "";
    });

    updateLanguageUI();
  }

  setTimeout(() => {
    // Only show if the active modal node is still this one
    if (activeModalNode === nodeDef.id) {
      modal.classList.remove("hidden");
      setTimeout(() => {
        modal.classList.remove("opacity-0");
      }, 50);
    }
  }, showModalDelay);
}

function openSunThanksModal() {
  const modal = document.getElementById("game-modal");
  const content = document.getElementById("game-modal-content");
  if (!modal || !content) return;

  activeModalNode = "sun_thanks";
  
  if (typeof playBeep === 'function') {
    playBeep(880, 0.18, 'sine', 0.04);
  }

  const modalHTML = `
    <div class="grid md:grid-cols-12 gap-8 items-center py-6">
      <!-- Sun Core avatar -->
      <div class="md:col-span-4 flex flex-col items-center justify-center p-6 border border-amber-500/20 bg-amber-950/5 rounded-2xl relative overflow-hidden">
        <div class="absolute inset-0 scanlines pointer-events-none opacity-10"></div>
        <div class="w-32 h-32 rounded-full border border-dashed border-amber-500/40 flex justify-center items-center relative animate-[spin_40s_linear_infinite] mb-4">
          <div class="absolute inset-2 border border-dashed border-amber-400/30 rounded-full animate-[spin_20s_linear_infinite_reverse]"></div>
          <div class="w-24 h-24 rounded-full bg-amber-500/10 flex justify-center items-center text-amber-400 text-4xl shadow-[inset_0_0_20px_rgba(245,158,11,0.3)]">
            <i class="fa-solid fa-sun animate-pulse"></i>
          </div>
        </div>
        <div class="text-center font-mono">
          <div class="text-[9px] text-zinc-500 uppercase tracking-widest" data-vi="NHÂN HỆ MẶT TRỜI" data-en="SOLAR CORE">NHÂN HỆ MẶT TRỜI</div>
          <div class="text-xs text-amber-400 font-bold tracking-widest mt-1">✓ QUANTUM HARMONY</div>
        </div>
      </div>

      <!-- Thanks Message Content -->
      <div class="md:col-span-8 flex flex-col gap-4 font-mono">
        <div class="flex items-center gap-3">
          <span class="text-amber-400 text-lg font-bold">▲</span>
          <h2 class="text-white text-lg font-bold tracking-wider" data-vi="BỨC THƯ TỪ NHÀ LẬP TRÌNH" data-en="A LETTER FROM THE DEVELOPER">BỨC THƯ TỪ NHÀ LẬP TRÌNH</h2>
        </div>
        <div class="text-xs text-zinc-300 leading-relaxed space-y-3">
          <p data-vi="Chào bạn, tôi là Nguyễn Thanh Hiền!" data-en="Hello, I'm Nguyen Thanh Hien!">Chào bạn, tôi là Nguyễn Thanh Hiền!</p>
          <p data-vi="Cảm ơn bạn rất nhiều vì đã dành thời gian khám phá toàn bộ Trạm Không Gian 3D này. Đây là dự án Portfolio mà tôi đã đặt rất nhiều tâm huyết, kết hợp giữa việc tối ưu hóa lập trình Three.js và tình yêu của tôi dành cho khoa học vũ trụ, lập trình web."
             data-en="Thank you so much for taking the time to explore this entire 3D Space Station. This is my Portfolio project in which I put a lot of heart, combining Three.js programming optimization with my love for space science and web development.">
             Cảm ơn bạn rất nhiều vì đã dành thời gian khám phá toàn bộ Trạm Không Gian 3D này. Đây là dự án Portfolio mà tôi đã đặt rất nhiều tâm huyết, kết hợp giữa việc tối ưu hóa lập trình Three.js và tình yêu của tôi dành cho khoa học vũ trụ, lập trình web.
          </p>
          <p data-vi="Sự hiện diện của bạn tại lõi Mặt Trời ngày hôm nay là động lực cực kỳ lớn lao để tôi tiếp tục nỗ lực và phát triển bản thân trên con đường trở thành một Web Developer chuyên nghiệp."
             data-en="Your presence at the Solar Core today is an immense motivation for me to keep striving and developing myself on the path of becoming a professional Web Developer.">
             Sự hiện diện của bạn tại lõi Mặt Trời ngày hôm nay là động lực cực kỳ lớn lao để tôi tiếp tục nỗ lực và phát triển bản thân trên con đường trở thành một Web Developer chuyên nghiệp.
          </p>
          <p data-vi="Chúc bạn có một ngày tuyệt vời và tràn đầy năng lượng tích cực! Hy vọng chúng ta sẽ có cơ hội được hợp tác cùng nhau trong các hành trình sắp tới."
             data-en="Wish you a wonderful day filled with positive energy! Hope we will have the opportunity to cooperate in our upcoming journeys.">
             Chúc bạn có một ngày tuyệt vời và tràn đầy năng lượng tích cực! Hy vọng chúng ta sẽ có cơ hội được hợp tác cùng nhau trong các hành trình sắp tới.
          </p>
        </div>
        <div class="mt-4 pt-4 border-t border-white/5 flex justify-between items-center text-[10px] text-zinc-500">
          <span>COGNITIVE TRANSMISSION SECURE</span>
          <span class="text-amber-400 font-bold">BY NGUYỄN THANH HIỀN</span>
        </div>
      </div>
    </div>
  `;

  content.innerHTML = modalHTML;
  updateLanguageUI();
  modal.classList.remove("hidden");
  setTimeout(() => {
    modal.classList.remove("opacity-0");
  }, 50);
}

function closeGameModal() {
  const modal = document.getElementById("game-modal");
  if (!modal) return;

  // Show solar fully charged alert when closing Pluto CV modal
  if (activeModalNode === "cv") {
    setTimeout(() => {
      showSafetyNotice(
        currentLang === 'vi' ? '☀️ MẶT TRỜI ĐÃ NẠP ĐẦY NĂNG LƯỢNG! HÃY ĐẾN ĐỂ ĐỌC THƯ CẢM ƠN' : '☀️ SOLAR CORE FULLY CHARGED! HEAD TO THE SUN FOR THANK YOU LETTER',
        '#fbbf24'
      );
    }, 600);
  }

  // If closing the tutorial planet, show the first planet unlock chime & banner
  if (activeModalNode === "home" && !homeUnlockEffectShown) {
    homeUnlockEffectShown = true;
    const homeDef = nodeDefs.find(n => n.id === "home");
    if (homeDef) {
      setTimeout(() => {
        showPlanetUnlockEffect(homeDef);
      }, 400);
    }
  }

  modal.classList.add("opacity-0");
  setTimeout(() => {
    modal.classList.add("hidden");
    activeModalNode = null;
    if (shouldShowAllUnlockedEffectAfterClose) {
      shouldShowAllUnlockedEffectAfterClose = false;
      setTimeout(() => {
        showAllUnlockedEffect();
      }, 300);
    }
  }, 300);

  if (typeof playBeep === 'function') {
    playBeep(440, 0.1, 'sine', 0.04);
  }
}

function updateGameLanguageUI() {
  if (!gameInitialized) return;
  gameNodes.forEach(node => {
    if (node.sprite) {
      if (node.def.id === "cv") {
        updatePlutoLabel();
      } else {
        const colorHex = '#' + node.def.color.toString(16).padStart(6, '0');
        const newText = currentLang === 'vi' ? node.def.name : node.def.nameEn;
        const texture = createTextTexture(newText, colorHex);
        node.sprite.material.map = texture;
        node.sprite.material.needsUpdate = true;
      }
    }
  });

  if (gamePortalSprite) {
    const portalText = currentLang === 'vi' ? 'SAO THỦY (CỔNG THOÁT)' : 'MERCURY (EXIT PORTAL)';
    const texture = createTextTexture(portalText, '#f43f5e');
    gamePortalSprite.material.map = texture;
    gamePortalSprite.material.needsUpdate = true;
  }

  // Update Quest Checklist language translation
  updateQuestUI();
}

function triggerSpaceTransition(callback, isExit = false) {
  const loader = document.getElementById("transition-loader");
  const joystick = document.getElementById("joystick-zone");
  const hud = document.getElementById("instructions-hud");
  const interaction = document.getElementById("interaction-hud");
  const questHud = document.getElementById("quest-hud");
  const minimapHud = document.getElementById("minimap-hud");
  const transTitle = document.getElementById("transition-title");

  if (!loader) {
    if (callback) callback();
    return;
  }

  // Set active state to accelerate background stars
  transitionLoadingActive = true;

  // Update loader title based on enter/exit
  if (transTitle) {
    if (isExit) {
      transTitle.textContent = currentLang === 'vi' ? "ĐANG THOÁT TRẠM KHÔNG GIAN // COGNITIVE RETURN" : "DISENGAGING HYPERDRIVE // EXITING SPACE";
    } else {
      transTitle.textContent = currentLang === 'vi' ? "ĐANG KHỞI ĐỘNG CƠ CẤU WARP // UỐN CONG KHÔNG GIAN" : "INITIALIZING HYPERDRIVE // WARPING SPACE";
    }
  }

  // Make transition background solid to cover up object loading and disappearance
  loader.style.backgroundColor = "#050816";

  // Show loader overlay
  loader.classList.remove("hidden");

  if (isExit) {
    // If exiting 3D, fade in loader smoothly over the 3D scene
    loader.style.transition = "opacity 0.5s ease-out";
    loader.style.opacity = "0";
    // Force reflow
    loader.offsetHeight;
    loader.style.opacity = "1";
  } else {
    // If entering 3D, instantly show loader to block out 3D model loading
    loader.style.transition = "none";
    loader.style.opacity = "1";
  }

  // Fade out 3D models so only stars show in Three.js
  if (gamePlayer) gamePlayer.visible = false;
  if (gameUnderGlobe) gameUnderGlobe.visible = false;
  if (gamePortalGroup) gamePortalGroup.visible = false;
  gameNodes.forEach(node => {
    if (node.group) node.group.visible = false;
  });

  if (joystick) joystick.style.opacity = "0";
  if (hud) hud.style.opacity = "0";
  if (questHud) questHud.style.opacity = "0";
  if (minimapHud) minimapHud.style.opacity = "0";
  if (interaction) interaction.classList.add("hidden");

  const bar = document.getElementById("transition-progress-bar");
  const percentText = document.getElementById("transition-percentage");
  const statusText = document.getElementById("transition-status");

  let progress = 0;

  const tick = () => {
    progress += Math.floor(Math.random() * 3) + 1;
    if (progress > 100) progress = 100;

    if (bar) bar.style.width = `${progress}%`;
    if (percentText) percentText.textContent = `${progress}%`;

    if (progress % 4 === 0 && typeof playScrambleChirp === 'function') {
      playScrambleChirp();
    }

    if (statusText) {
      if (isExit) {
        if (progress < 25) {
          statusText.textContent = currentLang === 'vi' ? "Đang ngắt liên kết thần kinh..." : "DISENGAGING NEURAL LINK...";
        } else if (progress < 55) {
          statusText.textContent = currentLang === 'vi' ? "Đang hủy đồng bộ drone..." : "DE-SYNCHRONIZING DRONE AVATAR...";
        } else if (progress < 80) {
          statusText.textContent = currentLang === 'vi' ? "Đang dịch chuyển về trang chủ..." : "WARPING SPACE-TIME MATRIX FEEDBACK...";
        } else {
          statusText.textContent = currentLang === 'vi' ? "Đang thiết lập lại kết nối..." : "RE-ESTABLISHING COGNITIVE TELEMETRY...";
        }
      } else {
        if (progress < 25) {
          statusText.textContent = currentLang === 'vi' ? "Đang dò tọa độ thời không..." : "TUNING SPACE-TIME INDEX...";
        } else if (progress < 55) {
          statusText.textContent = currentLang === 'vi' ? "Đang tích lũy plasma động năng..." : "CHARGING PLASMA FLUX ENERGY...";
        } else if (progress < 80) {
          statusText.textContent = currentLang === 'vi' ? "Uốn cong ma trận không gian..." : "WARPING SPACE-TIME MATRIX...";
        } else {
          statusText.textContent = currentLang === 'vi' ? "Đang đồng bộ thực thể drone..." : "SYNCHRONIZING DRONE AVATAR...";
        }
      }
    }

    if (progress < 100) {
      setTimeout(tick, 15 + Math.random() * 15);
    } else {
      if (typeof playSuccessChime === 'function') {
        playSuccessChime();
      }

      if (isExit) {
        const mainContent = document.getElementById("main-content");
        const gameContainer = document.getElementById("game-container");
        const canvasBg = document.getElementById("canvas-bg");
        const mainNav = document.getElementById("main-nav");

        syncViewModeText();
        if (mainNav) mainNav.classList.remove("hidden");

        // Setup smooth cross-fade transitions
        if (gameContainer) {
          gameContainer.style.transition = "opacity 0.8s ease-in-out";
          gameContainer.style.opacity = "0";
        }

        if (mainContent) {
          mainContent.style.transition = "opacity 0.8s ease-in-out";
          mainContent.style.opacity = "0";
          mainContent.classList.remove("hidden");
          mainContent.style.display = "";
          mainContent.classList.remove("vortex-sucked");
          mainContent.offsetHeight; // trigger reflow
          mainContent.style.opacity = "1";
        }

        if (canvasBg) {
          canvasBg.style.transition = "opacity 0.8s ease-in-out";
          canvasBg.style.opacity = "0";
          canvasBg.style.display = "block";
          canvasBg.offsetHeight; // trigger reflow
          canvasBg.style.opacity = "1";
        }

        // Fade out transition loader itself
        loader.style.transition = "opacity 0.6s ease-in-out";
        loader.style.opacity = "0";

        setTimeout(() => {
          loader.classList.add("hidden");
          transitionLoadingActive = false;

          if (gameContainer) {
            gameContainer.classList.add("hidden");
            gameContainer.style.opacity = "";
            gameContainer.style.transition = "";
          }
          if (mainContent) {
            mainContent.style.transition = "";
          }
          if (canvasBg) {
            canvasBg.style.transition = "";
            canvasBg.style.opacity = "";
          }

          stopGame3D();
          updateChatbotVisibility();
          if (callback) callback();
        }, 800);
      } else {
        // Show space station 3D world elements immediately so they fade in together with the background walkways/grid!
        if (gamePlayer) gamePlayer.visible = true;
        if (gameUnderGlobe) gameUnderGlobe.visible = true;
        if (gamePortalGroup) gamePortalGroup.visible = true;
        gameNodes.forEach(node => {
          if (node.group) node.group.visible = true;
        });

        // Fade out transition overlay (Enter flow)
        loader.style.transition = "opacity 0.6s ease-in-out";
        loader.style.opacity = "0";
        setTimeout(() => {
          loader.classList.add("hidden");
          transitionLoadingActive = false;

          const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
          const joystickZone = document.getElementById("joystick-zone");
          const locationHud = document.getElementById("location-hud-container");
          if (joystickZone) {
            if (isTouchDevice) {
              joystickZone.style.display = "flex";
              joystickZone.style.opacity = "1";
              if (locationHud) {
                locationHud.style.bottom = "7rem";
                locationHud.style.left = "9.5rem";
              }
            } else {
              joystickZone.style.display = "none";
              if (locationHud) {
                locationHud.style.bottom = "2rem";
                locationHud.style.left = "2rem";
              }
            }
          }
          if (hud) hud.style.opacity = "1";
          if (questHud) questHud.style.opacity = "1";
          if (minimapHud) minimapHud.style.opacity = "1";

          if (callback) callback();
        }, 600);
      }
    }
  };

  setTimeout(tick, 150);
}

function setupViewModeToggle() {
  const btn = document.getElementById("view-mode-btn");
  const text = document.getElementById("view-mode-text");
  const mainContent = document.getElementById("main-content");
  const gameContainer = document.getElementById("game-container");
  const canvasBg = document.getElementById("canvas-bg");
  const mainNav = document.getElementById("main-nav");

  if (!btn) return;

  const updateToggleUI = (skipTransition = false) => {
    // Keep 3D game and main content hidden while the first-load bootloader overlay is active
    if (!isBootFinished) {
      syncViewModeText();
      mainContent.classList.add("hidden");
      gameContainer.classList.add("hidden");
      canvasBg.style.display = "block";
      if (mainNav) mainNav.classList.add("hidden");
      updateChatbotVisibility();
      return;
    }

    if (is3DMode) {
      syncViewModeText();
      if (mainNav) mainNav.classList.add("hidden");
      updateChatbotVisibility();

      if (!skipTransition) {
        // Accelerate background stars of canvas-bg
        starfieldSpeedMultiplier = 20.0;

        // Fade out regular page content
        mainContent.style.transition = "opacity 0.5s ease-out";
        mainContent.style.opacity = "0";

        setTimeout(() => {
          mainContent.classList.add("hidden");
          gameContainer.classList.remove("hidden");
          canvasBg.style.display = "none";

          // Reset 2D background speed multiplier
          starfieldSpeedMultiplier = 1.0;

          initGame3D();
          triggerSpaceTransition();
        }, 500);
      } else {
        mainContent.style.opacity = "";
        mainContent.classList.add("hidden");
        gameContainer.classList.remove("hidden");
        canvasBg.style.display = "none";

        initGame3D();

        const loader = document.getElementById("transition-loader");
        if (loader) loader.classList.add("hidden");

        if (gamePlayer) gamePlayer.visible = true;
        if (gameUnderGlobe) gameUnderGlobe.visible = true;
        if (gamePortalGroup) gamePortalGroup.visible = true;
        gameNodes.forEach(node => {
          if (node.group) node.group.visible = true;
        });

        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        const joystickZone = document.getElementById("joystick-zone");
        const locationHud = document.getElementById("location-hud-container");
        if (joystickZone) {
          if (isTouchDevice) {
            joystickZone.style.display = "flex";
            joystickZone.style.opacity = "1";
            if (locationHud) {
              locationHud.style.bottom = "7rem";
              locationHud.style.left = "9.5rem";
            }
          } else {
            joystickZone.style.display = "none";
            if (locationHud) {
              locationHud.style.bottom = "2rem";
              locationHud.style.left = "2rem";
            }
          }
        }
        const hud = document.getElementById("instructions-hud");
        if (hud) hud.style.opacity = "1";
      }
    } else {
      if (!skipTransition) {
        triggerSpaceTransition(null, true);
      } else {
        syncViewModeText();
        if (mainNav) mainNav.classList.remove("hidden");

        mainContent.style.opacity = "";
        mainContent.classList.remove("hidden");
        mainContent.style.display = "";
        mainContent.classList.remove("vortex-sucked");
        gameContainer.classList.add("hidden");
        canvasBg.style.display = "block";

        stopGame3D();
        updateChatbotVisibility();
      }
    }
  };

  btn.addEventListener("click", () => {
    is3DMode = !is3DMode;
    localStorage.setItem("view-mode-3d", is3DMode);
    updateToggleUI(false);
    if (typeof playBeep === 'function') {
      playBeep(900, 0.1, 'triangle', 0.05);
    }
  });

  const heroBtn = document.getElementById("hero-view-mode-btn");
  if (heroBtn) {
    heroBtn.addEventListener("click", () => {
      btn.click();
    });
  }

  // Exit 3D Space Station button inside 3D container
  const exitBtn = document.getElementById("exit-3d-btn");
  if (exitBtn) {
    exitBtn.addEventListener("click", () => {
      is3DMode = false;
      localStorage.setItem("view-mode-3d", false);
      updateToggleUI(false);
      if (typeof playBeep === 'function') {
        playBeep(900, 0.1, 'triangle', 0.05);
      }
    });
  }

  // Language toggle inside 3D container
  const gameLangToggleBtn = document.getElementById("game-lang-toggle-btn");
  if (gameLangToggleBtn) {
    gameLangToggleBtn.addEventListener("click", togglePortfolioLanguage);
  }

  // Portal Crack Button - Direct entry to 3D Space Station
  const portalBtn = document.getElementById("portal-crack-btn");
  if (portalBtn) {
    const startPortalVortexTransition = () => {
      if (isWarping || transitionLoadingActive) return;

      const vortexDuration = 1800;

      isWarping = true;
      starfieldSpeedMultiplier = 20.0;
      is3DMode = true;
      localStorage.setItem("view-mode-3d", is3DMode);
      syncViewModeText();
      updateChatbotVisibility();

      if (mainNav) mainNav.classList.add("hidden");

      mainContent.style.display = "";
      mainContent.classList.remove("hidden");

      requestAnimationFrame(() => {
        mainContent.classList.add("vortex-sucked");
      });

      setTimeout(() => {
        // Safe hook: stop/pause 2D canvas particle loops here to free GPU before booting WebGL.
        pause2DParticleLoopForTransition();

        mainContent.style.display = "none";
        mainContent.classList.add("hidden");
        mainContent.classList.remove("vortex-sucked");

        gameContainer.classList.remove("hidden");
        canvasBg.style.display = "none";
        starfieldSpeedMultiplier = 1.0;

        init3DSpacePortfolio();
        triggerSpaceTransition(() => {
          isWarping = false;
        });
      }, vortexDuration);
    };

    portalBtn.addEventListener("click", () => {
      if (!is3DMode) {
        playPortalWarpSound();
        startPortalVortexTransition();
      } else {
        const gameContainer = document.getElementById("game-container");
        if (gameContainer) gameContainer.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }

  is3DMode = false; // Always default to normal (2D) view on F5/page refresh

  updateToggleUI(true);
}

function setupSciFiInteractionAudio() {
  const menuLinks = document.querySelectorAll(
    "#main-nav ul a, #mobile-menu a, #view-mode-btn, #lang-toggle-btn"
  );

  menuLinks.forEach(link => {
    link.addEventListener("pointerenter", () => {
      playMenuHoverSound();
    });
  });
}

// ==========================================================================
// CHATBOT VISIBILITY CONTROL
// ==========================================================================
function updateChatbotVisibility() {
  const chatbotToggle = document.getElementById("chatbot-toggle");
  const chatbotWindow = document.getElementById("chatbot-window");
  const isBooting = !isBootFinished;

  if (isBooting || is3DMode) {
    if (chatbotToggle) {
      chatbotToggle.classList.add("hidden");
      chatbotToggle.classList.remove("is-open");
      chatbotToggle.setAttribute("aria-expanded", "false");
    }
    if (chatbotWindow) {
      chatbotWindow.classList.remove("is-open");
      chatbotWindow.setAttribute("aria-hidden", "true");
    }
  } else {
    if (chatbotToggle) {
      chatbotToggle.classList.remove("hidden");
    }
  }
}

window.triggerChatbotWithPrompt = function(promptText) {
  const chatbotToggle = document.getElementById("chatbot-toggle");
  const chatbotWindow = document.getElementById("chatbot-window");
  const chatbotInput = document.getElementById("chatbot-input");
  const chatbotSend = document.getElementById("chatbot-send");
  
  if (!chatbotWindow || !chatbotInput || !chatbotSend) return;
  
  // Close active 3D modal first
  closeGameModal();
  
  // Unhide chatbot elements
  if (chatbotToggle) {
    chatbotToggle.classList.remove("hidden");
    chatbotToggle.classList.add("is-open");
    chatbotToggle.setAttribute("aria-expanded", "true");
  }
  
  chatbotWindow.classList.add("is-open");
  chatbotWindow.setAttribute("aria-hidden", "false");
  
  // Set prompt text
  chatbotInput.value = promptText;
  
  // Trigger click to submit
  setTimeout(() => {
    chatbotSend.click();
  }, 200);
};

// ==========================================================================
// SYSTEM ENTRYPOINT
// ==========================================================================
window.addEventListener("DOMContentLoaded", () => {
  initSciFiSfx();
  // 3D Background runs immediately
  initStarfieldBackground();
  // Bootloader runs
  startBootloader();
  // Set up form handlers
  setupContactForm();

  // Set up view mode toggle
  setupViewModeToggle();
  setupSciFiInteractionAudio();
  setupAudioToggle();

  // Bind instructions HUD collapsible header toggle
  const hudHeader = document.getElementById("hud-header");
  const hudContent = document.getElementById("hud-content");
  const hudToggleIcon = document.getElementById("hud-toggle-icon");

  if (hudHeader && hudContent && hudToggleIcon) {
    hudHeader.addEventListener("click", () => {
      const isCollapsed = hudContent.classList.toggle("hidden");
      if (isCollapsed) {
        hudToggleIcon.style.transform = "rotate(-90deg)";
      } else {
        hudToggleIcon.style.transform = "rotate(0deg)";
      }
      if (typeof playBeep === "function") {
        playBeep(isCollapsed ? 700 : 880, 0.08, isCollapsed ? "triangle" : "sine", 0.02);
      }
    });
  }

  // Bind Quest HUD collapsible header toggle
  const questHeader = document.getElementById("quest-header");
  const questContent = document.getElementById("quest-content");
  const questToggleIcon = document.getElementById("quest-toggle-icon");

  if (questHeader && questContent && questToggleIcon) {
    questHeader.addEventListener("click", () => {
      const isCollapsed = questContent.classList.toggle("hidden");
      if (isCollapsed) {
        questToggleIcon.style.transform = "rotate(-90deg)";
      } else {
        questToggleIcon.style.transform = "rotate(0deg)";
      }
      if (typeof playBeep === "function") {
        playBeep(isCollapsed ? 700 : 880, 0.08, isCollapsed ? "triangle" : "sine", 0.02);
      }
    });
  }

  // Bind close modal button
  const modalClose = document.getElementById("game-modal-close");
  if (modalClose) {
    modalClose.addEventListener("click", closeGameModal);
  }

  // Hide joystick on non-touch devices
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const joystickZone = document.getElementById("joystick-zone");
  if (joystickZone && !isTouchDevice) {
    joystickZone.style.display = "none";
  }

  // Run initial language setup
  updateLanguageUI();

  // Handle mailto links to copy email to clipboard and show sci-fi toast
  const mailtoLinks = document.querySelectorAll('a[href^="mailto:"]');
  mailtoLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const email = link.getAttribute('href').replace('mailto:', '');
      navigator.clipboard.writeText(email).then(() => {
        const toast = document.createElement("div");
        toast.className = "fixed bottom-5 right-5 bg-[#10b981] text-white py-3 px-6 rounded-xl font-bold z-50 shadow-lg flex items-center gap-2 transform translate-y-20 transition-all duration-300";
        const msg = currentLang === 'vi'
          ? `Đã sao chép email: ${email}!`
          : `Copied email: ${email}!`;
        toast.innerHTML = `
          <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"></path></svg>
          ${msg}
        `;
        document.body.appendChild(toast);

        if (typeof playSuccessChime === 'function') {
          playSuccessChime();
        }

        setTimeout(() => toast.className = toast.className.replace("translate-y-20", "translate-y-0"), 50);
        setTimeout(() => {
          toast.className = toast.className.replace("translate-y-0", "translate-y-20");
          setTimeout(() => toast.remove(), 300);
        }, 4000);
      });
    });
  });

  // Language toggle button listener
  const langToggleBtn = document.getElementById("lang-toggle-btn");
  if (langToggleBtn) {
    langToggleBtn.addEventListener("click", togglePortfolioLanguage);
  }

  // Global interface click sounds
  document.addEventListener("click", (e) => {
    const target = e.target.closest("a, button, [role='button'], .cursor-pointer, .glass-panel");
    if (target) {
      if (target.id === "loader-start-btn" || target.type === "submit" || target.id === "mobile-menu-btn" || target.id === "lang-toggle-btn" || target.id === "game-lang-toggle-btn") {
        return;
      }
      playInterfaceClick();
    }
  });

  // Mobile menu toggle hook
  const menuBtn = document.getElementById("mobile-menu-btn");
  const mobileMenu = document.getElementById("mobile-menu");
  const menuIcon = document.getElementById("menu-icon");
  const closeIcon = document.getElementById("close-icon");

  if (menuBtn && mobileMenu) {
    menuBtn.addEventListener("click", () => {
      mobileMenu.classList.toggle("hidden");
      menuIcon.classList.toggle("hidden");
      closeIcon.classList.toggle("hidden");
      playBeep(600, 0.05, 'sine', 0.02);
    });

    mobileMenu.querySelectorAll("a").forEach(link => {
      link.addEventListener("click", () => {
        mobileMenu.classList.add("hidden");
        menuIcon.classList.remove("hidden");
        closeIcon.classList.add("hidden");
      });
    });
  }

  // Initialize floating AI chatbot
  initSpaceChatbot();
  updateChatbotVisibility();

  function initSpaceChatbot() {
    const chatbotToggle = document.getElementById("chatbot-toggle");
    const chatbotWindow = document.getElementById("chatbot-window");
    const chatbotClose = document.getElementById("chatbot-close");
    const chatbotInput = document.getElementById("chatbot-input");
    const chatbotSend = document.getElementById("chatbot-send");
    const chatbotMessages = document.getElementById("chatbot-messages");
    const chatbotSuggestionsToggle = document.getElementById("chatbot-suggestions-toggle");
    const chatbotSuggestionsIcon = document.getElementById("chatbot-suggestions-icon");

    if (!chatbotToggle || !chatbotWindow || !chatbotClose || !chatbotInput || !chatbotSend || !chatbotMessages) return;

    let chatHistory = [];
    let isWindowOpen = false;
    let isLoading = false;

    // Toggle Chat Window
    chatbotToggle.addEventListener("click", () => {
      isWindowOpen = !isWindowOpen;
      if (isWindowOpen) {
        chatbotWindow.classList.add("is-open");
        chatbotToggle.classList.add("is-open");
        chatbotWindow.setAttribute("aria-hidden", "false");
        chatbotToggle.setAttribute("aria-expanded", "true");
        if (!isLoading) {
          setTimeout(() => chatbotInput.focus(), 220);
        }
        if (typeof playBeep === "function") {
          playBeep(880, 0.08, "sine", 0.02);
        }
      } else {
        chatbotWindow.classList.remove("is-open");
        chatbotToggle.classList.remove("is-open");
        chatbotWindow.setAttribute("aria-hidden", "true");
        chatbotToggle.setAttribute("aria-expanded", "false");
        if (typeof playBeep === "function") {
          playBeep(600, 0.08, "triangle", 0.02);
        }
      }
    });

    // Close Chat Window
    chatbotClose.addEventListener("click", (e) => {
      e.stopPropagation();
      isWindowOpen = false;
      chatbotWindow.classList.remove("is-open");
      chatbotToggle.classList.remove("is-open");
      chatbotWindow.setAttribute("aria-hidden", "true");
      chatbotToggle.setAttribute("aria-expanded", "false");
      if (is3DMode) {
        updateChatbotVisibility();
      }
      if (typeof playBeep === "function") {
        playBeep(600, 0.08, "triangle", 0.02);
      }
    });

    // Send Message on click/Enter
    chatbotSend.addEventListener("click", handleSendMessage);
    chatbotInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        handleSendMessage();
      }
    });

    const chatbotSuggestions = document.getElementById("chatbot-suggestions");
    function setSuggestionsVisible(isVisible) {
      if (!chatbotSuggestions) return;
      if (isVisible) {
        chatbotMessages.appendChild(chatbotSuggestions);
      }
      chatbotSuggestions.classList.toggle("hidden", !isVisible);
      if (chatbotSuggestionsIcon) {
        chatbotSuggestionsIcon.className = isVisible
          ? "fa-solid fa-chevron-up text-xs"
          : "fa-solid fa-list-ul text-xs";
      }
      if (isVisible) {
        chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
      }
    }

    if (chatbotSuggestionsToggle) {
      chatbotSuggestionsToggle.addEventListener("click", () => {
        if (isLoading || !chatbotSuggestions) return;
        const isHidden = chatbotSuggestions.classList.contains("hidden");
        setSuggestionsVisible(isHidden);
        if (typeof playBeep === "function") {
          playBeep(isHidden ? 880 : 620, 0.06, "sine", 0.015);
        }
      });
    }

    if (chatbotSuggestions) {
      chatbotSuggestions.querySelectorAll(".chatbot-suggest-btn").forEach(btn => {
        btn.addEventListener("click", () => {
          if (isLoading) return;
          chatbotInput.value = btn.innerText;
          setSuggestionsVisible(false);
          handleSendMessage();
        });
      });
    }

    async function handleSendMessage() {
      if (isLoading) return;
      const query = chatbotInput.value.trim();
      if (!query) return;

      isLoading = true;
      chatbotInput.disabled = true;
      chatbotSend.disabled = true;
      chatbotSend.innerHTML = '<i class="fa-solid fa-spinner animate-spin text-xs"></i>';

      if (chatbotSuggestions) {
        setSuggestionsVisible(false);
      }

      // Clear input
      chatbotInput.value = "";

      // Append user bubble
      appendMessage("user", query);

      // Scroll to bottom
      chatbotMessages.scrollTop = chatbotMessages.scrollHeight;

      // Play sending interface sound
      if (typeof playBeep === "function") {
        playBeep(1000, 0.05, "sine", 0.01);
      }

      // Add loading bubble
      const loadingBubble = appendLoadingBubble();
      chatbotMessages.scrollTop = chatbotMessages.scrollHeight;

      try {
        const responseText = getLocalPortfolioAnswer(query) || await askGemini(query, chatHistory.slice(-8));

        // Remove loading bubble
        if (loadingBubble) loadingBubble.remove();

        // Append bot bubble
        appendMessage("bot", responseText);

        // Save history
        chatHistory.push({ role: "user", text: query });
        chatHistory.push({ role: "bot", text: responseText });

        // Play message received sound
        if (typeof playBeep === "function") {
          playBeep(1200, 0.08, "sine", 0.02);
        }
      } catch (err) {
        console.error(err);
        if (loadingBubble) loadingBubble.remove();
        appendMessage("bot", getChatbotErrorMessage(err));
      } finally {
        isLoading = false;
        chatbotInput.disabled = false;
        chatbotSend.disabled = false;
        chatbotSend.innerHTML = '<i class="fa-solid fa-paper-plane text-xs"></i>';
        chatbotInput.focus();
      }

      // Scroll to bottom
      chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
    }

    function normalizeQuestion(text) {
      return text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/[^a-z0-9\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
    }

    function getLocalPortfolioAnswer(question) {
      const q = normalizeQuestion(question);
      const isVi = currentLang === "vi";

      const asksIntro = /gioi thieu|ban than|thanh hien la ai|who is|introduce/.test(q);
      const asksSkills = /ky nang|skill|cong nghe|technology|frontend|backend|laravel/.test(q);
      const asksProjects = /du an|san pham|project|portfolio|website/.test(q);
      const asksContact = /lien he|contact|email|sdt|so dien thoai|hotline|github|cv/.test(q);

      if (asksIntro && asksSkills) {
        return isVi
          ? "Thanh Hiền là sinh viên Công nghệ thông tin tại Cao đẳng Công nghệ Thủ Đức (TDC), hiện sống và hoạt động tại Thủ Đức, TP.HCM. Hiền định hướng trở thành Web Developer/Laravel Developer, có thế mạnh về Frontend UI/UX, Backend Laravel/MySQL, Mobile/API và QA/testing. Các kỹ năng nổi bật gồm HTML/CSS, TailwindCSS, Bootstrap, JavaScript ES6+, PHP OOP, Laravel, MySQL, RESTful API, Flutter/Riverpod, Postman, 2FA TOTP và bảo mật chống SQL Injection/XSS."
          : "Thanh Hien is an Information Technology student at Thu Duc College of Technology (TDC), based in Thu Duc, HCMC. He is oriented toward Web/Laravel development, with strengths in Frontend UI/UX, Laravel/MySQL backend, Mobile/API integration, and QA/testing. His key skills include HTML/CSS, TailwindCSS, Bootstrap, JavaScript ES6+, PHP OOP, Laravel, MySQL, RESTful APIs, Flutter/Riverpod, Postman, 2FA TOTP, and SQL Injection/XSS protection.";
      }

      if (asksIntro) {
        return isVi
          ? "Thanh Hiền là sinh viên Công nghệ thông tin tại Cao đẳng Công nghệ Thủ Đức (TDC), hiện sống và hoạt động tại Thủ Đức, TP.HCM. Hiền định hướng theo Web Developer/Laravel Developer, yêu thích xây dựng giao diện tương tác, backend chắc chắn và các sản phẩm web có trải nghiệm người dùng tốt."
          : "Thanh Hien is an Information Technology student at Thu Duc College of Technology (TDC), based in Thu Duc, HCMC. He is oriented toward Web/Laravel development and enjoys building interactive interfaces, solid backend systems, and web products with strong user experience.";
      }

      if (asksSkills) {
        return isVi
          ? "Kỹ năng nổi bật của Thanh Hiền gồm Frontend UI/UX với HTML/CSS, TailwindCSS, Bootstrap, JavaScript ES6+; Backend với PHP OOP, Laravel, MySQL, MVC và Service-Repository; Mobile/API với Flutter, Riverpod, RESTful API, Gemini AI, PayOS/VietQR; cùng QA/bảo mật như Test Plan, Test Case, Postman, 2FA TOTP, Bcrypt và chống SQL Injection/XSS."
          : "Thanh Hien's key skills include Frontend UI/UX with HTML/CSS, TailwindCSS, Bootstrap, JavaScript ES6+; Backend with PHP OOP, Laravel, MySQL, MVC and Service-Repository; Mobile/API with Flutter, Riverpod, RESTful APIs, Gemini AI, PayOS/VietQR; plus QA/security skills such as Test Plans, Test Cases, Postman, 2FA TOTP, Bcrypt, and SQL Injection/XSS protection.";
      }

      if (asksProjects) {
        return isVi
          ? "Thanh Hiền có 3 dự án tiêu biểu: Website Bán Hàng Điện Tử Laravel/MySQL có 2FA, OAuth2, PayOS/VietQR, Gemini RAG Chatbot và app Flutter; Website TMĐT Nhóm G bằng Laravel/MySQL; và Hồ Sơ Năng Lực 3D Tương Tác dùng Three.js, HTML, CSS, JavaScript. Bạn có thể xem mục Sản Phẩm Tiêu Biểu để mở demo và GitHub từng dự án."
          : "Thanh Hien has 3 featured projects: an Electronics E-Commerce platform with Laravel/MySQL, 2FA, OAuth2, PayOS/VietQR, Gemini RAG Chatbot and a Flutter app; Group G E-Commerce with Laravel/MySQL; and this Interactive 3D Portfolio built with Three.js, HTML, CSS, and JavaScript. Visit the Featured Products section for demos and GitHub links.";
      }

      if (asksContact) {
        return isVi
          ? "Bạn có thể liên hệ Thanh Hiền qua hotline 0396 519 196, email thenghien2006@gmail.com hoặc GitHub github.com/eHin-cloud. Ngoài ra, form Liên hệ ở cuối trang sẽ gửi lời nhắn trực tiếp tới email của Hiền; CV nằm ở nút TẢI CV THAM KHẢO trong mục Tổng quan."
          : "You can contact Thanh Hien via hotline 0396 519 196, email thenghien2006@gmail.com, or GitHub github.com/eHin-cloud. The contact form at the bottom of the page sends messages directly to his email, and the resume is available through the DOWNLOAD RESUME button in the Overview section.";
      }

      return "";
    }

    function getChatbotErrorMessage(err) {
      const message = err && err.message ? err.message : "";

      if (/reported as leaked|API key/i.test(message) && /403|PERMISSION_DENIED|leaked/i.test(message)) {
        return currentLang === "vi"
          ? "API key Gemini hiện tại đã bị Google khóa vì bị báo là lộ key. Hãy tạo key mới trong Google AI Studio rồi thay vào cấu hình chatbot."
          : "The current Gemini API key was blocked because Google reported it as leaked. Create a new key in Google AI Studio and replace the chatbot key.";
      }

      if (/quota|429/i.test(message)) {
        return currentLang === "vi"
          ? "Gemini API đang hết quota hoặc chưa bật billing phù hợp. Hãy kiểm tra hạn mức trong Google AI Studio/Google Cloud."
          : "The Gemini API quota is exhausted or billing is not configured. Check your quota in Google AI Studio/Google Cloud.";
      }

      if (/Failed to fetch|NetworkError|Load failed/i.test(message)) {
        return currentLang === "vi"
          ? "Không kết nối được tới Gemini API. Hãy thử mở trang qua http://localhost hoặc kiểm tra mạng/CORS/key restriction."
          : "Could not connect to the Gemini API. Try serving the page through http://localhost and check network/CORS/key restrictions.";
      }

      return (currentLang === "vi"
        ? "Đã xảy ra lỗi kết nối với hệ thống AI của trạm: "
        : "Connection error with the station AI system: ") + message;
    }

    function appendMessage(sender, text) {
      const msgDiv = document.createElement("div");
      msgDiv.className = "flex gap-2 " + (sender === "user" ? "justify-end" : "");

      const avatar = document.createElement("div");
      avatar.className = sender === "user"
        ? "w-6 h-6 rounded-md bg-cyan-500/10 flex justify-center items-center text-[#06b6d4] flex-shrink-0 order-2"
        : "w-6 h-6 rounded-md bg-[#915eff]/10 flex justify-center items-center text-[#915eff] flex-shrink-0";
      avatar.innerHTML = sender === "user"
        ? '<i class="fa-solid fa-user text-[10px]"></i>'
        : '<i class="fa-solid fa-robot text-[10px]"></i>';

      const bubble = document.createElement("div");
      bubble.className = sender === "user"
        ? "bg-purple-950/60 p-3 rounded-2xl rounded-tr-none border border-purple-500/20 max-w-[80%] text-zinc-300 leading-relaxed font-sans"
        : "bg-[#151030] p-3 rounded-2xl rounded-tl-none border border-white/5 max-w-[80%] text-zinc-300 leading-relaxed font-sans";
      bubble.innerText = text;

      msgDiv.appendChild(avatar);
      msgDiv.appendChild(bubble);
      chatbotMessages.appendChild(msgDiv);
    }

    function appendLoadingBubble() {
      const msgDiv = document.createElement("div");
      msgDiv.className = "flex gap-2";

      const avatar = document.createElement("div");
      avatar.className = "w-6 h-6 rounded-md bg-[#915eff]/10 flex justify-center items-center text-[#915eff] flex-shrink-0";
      avatar.innerHTML = '<i class="fa-solid fa-robot text-[10px]"></i>';

      const bubble = document.createElement("div");
      bubble.className = "bg-[#151030] p-3 rounded-2xl rounded-tl-none border border-white/5 max-w-[80%] flex items-center gap-1 text-zinc-400";
      bubble.innerHTML = `
        <span class="w-1.5 h-1.5 bg-[#915eff] rounded-full animate-bounce" style="animation-delay: 0ms"></span>
        <span class="w-1.5 h-1.5 bg-[#915eff] rounded-full animate-bounce" style="animation-delay: 150ms"></span>
        <span class="w-1.5 h-1.5 bg-[#915eff] rounded-full animate-bounce" style="animation-delay: 300ms"></span>
      `;

      msgDiv.appendChild(avatar);
      msgDiv.appendChild(bubble);
      chatbotMessages.appendChild(msgDiv);
      return msgDiv;
    }

    async function askGemini(userMessage, history) {
      const modelCandidates = [
        "gemini-2.5-flash",
        "gemini-2.0-flash"
      ];

      const contents = history.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
      }));
      contents.push({
        role: 'user',
        parts: [{ text: userMessage }]
      });

      const systemInstruction = {
        parts: [{
          text: `Bạn là Trợ lý AI (Cyber-Assistant) của website portfolio "Nguyễn Thanh Hiền | Trạm Không Gian".
Nhiệm vụ: trả lời khách truy cập dựa trên nội dung có trong website, hướng dẫn họ xem đúng mục, giới thiệu năng lực/dự án/liên hệ của Nguyễn Thanh Hiền. Giọng văn thân thiện, chuyên nghiệp, thông minh, có thể dùng nhẹ phong cách khoa học viễn tưởng như "Trạm điều khiển", "quỹ đạo", "tín hiệu", "hệ thống" nhưng không nói quá dài.

QUY TẮC TRẢ LỜI:
- Tự nhận diện ngôn ngữ câu hỏi: hỏi tiếng Việt trả lời tiếng Việt, hỏi tiếng Anh trả lời tiếng Anh.
- Trả lời ngắn gọn khoảng 2-4 câu, tập trung vào câu hỏi.
- Chỉ dùng thông tin trong hồ sơ bên dưới; nếu không có dữ liệu, nói rõ là website chưa cung cấp thông tin đó.
- Khi phù hợp, hướng dẫn khách bấm các mục trên trang: Tổng quan, Khoang Công Nghệ, Lộ trình Học tập, Sản phẩm Tiêu biểu, Đánh giá, Liên hệ, CV hoặc chế độ Không Gian 3D.
- Nếu khách muốn tuyển dụng/hợp tác/liên hệ, ưu tiên đưa hotline, email, GitHub và form liên hệ.
- Nếu khách hỏi "giới thiệu bản thân", "kỹ năng", hoặc "giới thiệu bản thân và kỹ năng", hãy trả lời trực tiếp, không mở đầu lan man kiểu "hệ thống ghi nhận tín hiệu".

MẪU TRẢ LỜI ƯU TIÊN:
- Khi hỏi giới thiệu bản thân: "Thanh Hiền là sinh viên Công nghệ thông tin tại Cao đẳng Công nghệ Thủ Đức (TDC), hiện sống và hoạt động tại Thủ Đức, TP.HCM. Hiền định hướng trở thành Web Developer/Laravel Developer, yêu thích xây dựng giao diện tương tác, backend chắc chắn và các sản phẩm web có trải nghiệm người dùng tốt."
- Khi hỏi kỹ năng: "Kỹ năng nổi bật của Thanh Hiền gồm Frontend UI/UX với HTML/CSS, TailwindCSS, Bootstrap, JavaScript ES6+; Backend với PHP OOP, Laravel, MySQL, MVC, Service-Repository; Mobile/API với Flutter, Riverpod, RESTful API, Gemini AI, PayOS/VietQR; và QA/bảo mật với Test Plan, Test Case, Postman, 2FA TOTP, Bcrypt, chống SQL Injection/XSS."
- Khi hỏi cả giới thiệu bản thân và kỹ năng: trả lời 3-5 câu, gồm: Thanh Hiền là ai, đang học/ở đâu, định hướng nghề nghiệp, 4 nhóm kỹ năng chính, và nhắc có dự án thực tế để chứng minh năng lực.

THÔNG TIN CHUNG:
- Chủ website: Nguyễn Thanh Hiền.
- Vai trò định hướng: Thực tập sinh Web Developer & Laravel, Front-End Developer, PHP & Laravel Backend, QA/Manual Tester, Database Architect.
- Nơi ở/hoạt động: Thủ Đức, TP.HCM.
- Trạng thái: đang đi học, sẵn sàng tiếp nhận cơ hội thực tập và hợp tác phát triển dự án.
- Trường: Cao đẳng Công nghệ Thủ Đức (TDC), chuyên ngành Công nghệ thông tin.
- Tinh thần giới thiệu: lập trình không chỉ là dòng lệnh khô khan mà là cách tạo nên trải nghiệm số sống động; chú trọng Laravel, thuật toán tối ưu, giao diện tương tác và trải nghiệm người dùng.
- Website có 2 ngôn ngữ Việt/Anh và phong cách Trạm Không Gian/portfolio 3D.

TRẢI NGHIỆM WEBSITE:
- Hero: chào người xem với "Xin chào, tôi là Thanh Hiền", có nút Xem dự án, Liên hệ với tôi, và cổng "Bước vào Trạm Không Gian".
- Navigation chính: Khởi Động, Hồ Sơ, Công Nghệ, Hành Trình, Dự Án, Đánh Giá, Tín Hiệu, GitHub.
- Có chế độ 2D bình thường và Không Gian 3D tương tác. Trong 3D, người xem khám phá các hành tinh/nút nội dung: Trái Đất (hướng dẫn), Sao Kim (giới thiệu), Sao Hỏa (kỹ năng), Sao Mộc (kinh nghiệm), Sao Thổ (sản phẩm), Sao Thiên Vương (đánh giá), Sao Hải Vương (liên hệ), Pluto mở khóa khi khám phá đủ, có minimap/quest/progress.
- Có nút tải CV: ./CV/24211TT3646_NGUYENTHANHHIEN_CV.pdf.

TỔNG QUAN/DỊCH VỤ:
- Giới thiệu chung: sinh viên CNTT tại TDC, yêu thích xây dựng các vũ trụ số bằng Laravel, thuật toán tối ưu và giao diện tương tác giàu cảm xúc.
- Các nhóm vai trò/thẻ năng lực trên trang: Front-End Developer, QA / Manual Tester, PHP & Laravel Backend, Kiến trúc Cơ sở dữ liệu.

KỸ NĂNG - KHOANG CÔNG NGHỆ:
- Frontend & UI/UX: HTML/CSS, TailwindCSS, Bootstrap, JavaScript ES6+, Responsive Design, thiết kế giao diện premium thanh lịch, kết hợp hiệu ứng mượt.
- Backend & Kiến trúc: PHP OOP, Laravel Framework, MySQL/PDO, Eloquent ORM, mô hình MVC, Service-Repository Pattern, thiết kế luồng mã nguồn tinh gọn và an toàn.
- Mobile & API: Dart, Flutter, Riverpod, Clean Architecture, RESTful API, tích hợp Gemini AI, PayOS/VietQR qua Webhook.
- Bảo mật & Công cụ: 2FA TOTP, Bcrypt, Prepared Statements chống SQL Injection, chống XSS, Git/GitHub, SmartGit, Docker/Apache, Postman/API testing.

LỘ TRÌNH HỌC TẬP:
- Năm 1 (2023-2024): Sinh viên CNTT tại TDC, nhập môn và tư duy thuật toán; học C#, Java, MySQL, chuẩn hóa CSDL 3NF; GPA 2.71.
- Năm 2 (2024-2025): Web Developer - lập trình Web PHP/Laravel; xây dựng ứng dụng MVC bằng Laravel, thiết kế quan hệ MySQL One-to-Many/Many-to-Many, tối ưu truy vấn, lập trình RESTful API, route sạch và JSON payload chuẩn.
- Năm 3 (2025-2026): Kiểm thử phần mềm & thực tập tốt nghiệp; nghiên cứu CSS/JavaScript nâng cao, viết Test Plan, thiết kế Test Cases, kiểm thử API bằng Postman, quản lý mã nguồn và xử lý Git conflict bằng SmartGit.

DỰ ÁN TIÊU BIỂU:
1. Website Bán Hàng Điện Tử (Đồng Phát Triển):
- Hệ thống mua sắm điện máy trực tuyến Laravel & MySQL.
- Có Service-Repository Pattern, 2FA TOTP, Google OAuth2, chống SQL Injection.
- Bộ lọc dynamic SQL kết hợp AJAX, tích hợp thanh toán tự động qua PayOS/VietQR Webhook.
- Tích hợp AI Gemini RAG Chatbot, có app di động Flutter quản lý bằng Riverpod.
- Đạt 8.0/10 đồ án xuất sắc, triển khai Hosting/Apache.
- Demo: https://dienmaypro.nguyenanhquy.id.vn/
- GitHub: https://github.com/eHin-cloud/TrienKhaiPM.git

2. Website TMĐT Nhóm G (Laravel):
- Đồ án môn Back-end Web 2 về thương mại điện tử, xây dựng bằng Laravel/MySQL.
- Thể hiện khả năng làm việc nhóm, đồng bộ mã nguồn, merge code qua GitHub.
- Demo: https://tmdtgroupg.nthanhhien.id.vn/
- GitHub: https://github.com/AQuyGib/ThuongMaiDienTu

3. Hồ Sơ Năng Lực 3D Tương Tác:
- Website portfolio 3D hiện tại, dùng Three.js, HTML, CSS, JavaScript thuần.
- Dựng môi trường không gian vũ trụ ảo 3D, tối ưu trải nghiệm mượt khoảng 60 FPS, nhấn mạnh UI/UX tương tác.
- Demo: https://nthanhhien.id.vn/
- GitHub: https://github.com/eHin-cloud/FE2_Project

ĐÁNH GIÁ:
- Nguyễn Anh Quý nhận xét: Hiền có tư duy thiết kế giao diện nhạy bén, tối ưu CSS/JavaScript nâng cao mượt mà, giúp web đạt hiệu năng cao và trải nghiệm UI/UX giàu cảm xúc.
- Giảng viên TDC nhận xét: khả năng kết hợp Laravel vững chắc và tư duy QA giúp sản phẩm ổn định, mã nguồn sạch, quy trình kiểm thử API chặt chẽ.
- Cộng tác viên phát triển dự án cùng Hiền: Nguyễn Anh Quý, email nguyquy67@gmail.com, GitHub github.com/AQuyGib.

LIÊN HỆ:
- Hotline/SĐT: 0396 519 196.
- Email: thenghien2006@gmail.com.
- GitHub: https://github.com/eHin-cloud.
- Facebook: https://www.facebook.com/hien.nguyenthanh29.
- Douyin: https://www.douyin.com/user/self?from_tab_name=main.
- Form liên hệ ở cuối trang dùng Web3Forms và gửi lời nhắn tới thenghien2006@gmail.com. Form yêu cầu tên, email, lời nhắn.
- Địa chỉ hoạt động: Thủ Đức, TP.HCM; sẵn sàng On-site / Remote.`
        }]
      };

      let lastError = null;
      let data = null;

      const generationConfig = {
        temperature: 0.7,
        maxOutputTokens: 900
      };

      const proxyEndpoints = [
        "./api/gemini.php",
        "/api/gemini.php"
      ];

      for (const endpoint of proxyEndpoints) {
        try {
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              contents,
              systemInstruction,
              generationConfig,
              modelCandidates
            })
          });

          if (!response.ok) {
            const errorText = await response.text();
            let errorMsg = `Gemini proxy HTTP ${response.status}`;
            try {
              const errJson = JSON.parse(errorText);
              if (errJson.error && errJson.error.message) {
                errorMsg += `: ${errJson.error.message}`;
              }
            } catch (e) {
              errorMsg += `: ${errorText}`;
            }

            lastError = new Error(errorMsg);
            if (response.status === 404 || response.status === 405) continue;
            throw lastError;
          }

          data = await response.json();
          break;
        } catch (err) {
          lastError = err;
          if (err && /404|405|Failed to fetch/i.test(err.message || "")) continue;
          throw err;
        }
      }

      if (!data) {
        throw lastError || new Error("No Gemini model responded");
      }

      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts) {
        if (data.candidates && data.candidates[0] && data.candidates[0].finishReason) {
          throw new Error(`Blocked by Gemini (Reason: ${data.candidates[0].finishReason})`);
        }
        throw new Error("Invalid response format from Gemini API");
      }

      const answer = data.candidates[0].content.parts
        .map(part => part.text || "")
        .join("")
        .trim();

      if (!answer) {
        throw new Error("Gemini returned an empty response");
      }

      return answer;
    }
  }
});

