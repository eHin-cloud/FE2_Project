// ==========================================================================
// AUDIO SYNTHESIZER UTILITIES (SCI-FI FX ENGINE)
// ==========================================================================
let audioCtx;
let chargingOsc, chargingLFO, chargingGain;

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
  try {
    initAudio();
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
  } catch (e) {}
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
  } catch (e) {}
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
  } catch (e) {}
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
  } catch (e) {}
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
    { text: "ESTABLISHING QUANTUM NEURAL HANDSHAKE...", weight: 12 },
    { text: "STABILIZING WARP DRIVE MATRIX FLUX...", weight: 13 },
    { text: "DECRYPTING CORE IDENTITY DATABANKS...", weight: 15 },
    { text: "MAPPING THREE.JS COSMIC SPACETIME CANVAS...", weight: 15 },
    { text: "SYNCHRONIZING LARAVEL BACKEND NEURAL ENGINE...", weight: 15 },
    { text: "COMPILING MANUAL QA DIAGNOSTIC TEST CASES...", weight: 15 },
    { text: "INITIALIZATION SUCCESS. CORE STATUS: SECURE.", weight: 15 }
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
  } catch (e) {}

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

    // Write Terminal Logs with sci-fi decoding effect
    if (logTerminal) {
      let html = '';
      for (let i = 0; i < activeStep; i++) {
        html += `<div class="text-[#888] font-mono text-xs mb-1">✔ ${steps[i].text}</div>`;
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

    if (progress < 100) {
      setTimeout(tick, 20); // slightly slower tick for better text appreciation
    } else {
      // Completed loading
      stopChargingHum();
      playSuccessChime();

      // Show Start Button
      if (startBtn) {
        startBtn.classList.remove("hidden");
        startBtn.addEventListener("click", () => {
          playBeep(880, 0.15, 'triangle', 0.08);
          // Dismiss loader screen
          if (overlay) {
            overlay.style.opacity = '0';
            setTimeout(() => overlay.remove(), 500);
          }
          // Trigger animations inside site
          startSiteAnimations();
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

function updateLanguageUI() {
  // Update toggle button text
  const langText = document.getElementById("lang-text");
  if (langText) {
    langText.textContent = currentLang.toUpperCase();
  }

  // Update elements with data-vi and data-en
  const translatableElements = document.querySelectorAll("[data-vi][data-en]");
  translatableElements.forEach(el => {
    const text = currentLang === "vi" ? el.getAttribute("data-vi") : el.getAttribute("data-en");
    el.textContent = text;
  });

  // Update view mode toggle text
  const viewModeText = document.getElementById("view-mode-text");
  if (viewModeText) {
    const text = currentLang === "vi" ? viewModeText.getAttribute("data-vi") : viewModeText.getAttribute("data-en");
    viewModeText.textContent = text;
  }

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

function triggerTypingEffect() {
  const target = document.getElementById("typing-desc");
  if (!target) return;
  
  if (typingTimeoutId) {
    clearTimeout(typingTimeoutId);
  }

  const texts = {
    vi: "Thực tập sinh Web Developer & UI-focused Fullstack. Chào mừng bạn đến với Cyber-Oasis Workspace. Hãy dùng nhân vật ảo và di chuyển quanh các địa danh bằng phím, chuột hoặc d-pad để khám phá năng lực và hồ sơ cá nhân của tôi!",
    en: "Web Developer Intern & UI-focused Fullstack. Welcome to Cyber-Oasis Workspace. Use the virtual character to explore landmarks and discover my portfolio!"
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
    positions[i+1] = (Math.random() - 0.5) * 600;
    positions[i+2] = (Math.random() - 0.5) * 400;

    // Harmonious violet/cyan colors
    colors[i] = 0.5 + Math.random() * 0.3; // R
    colors[i+1] = 0.4 + Math.random() * 0.2; // G
    colors[i+2] = 0.9 + Math.random() * 0.1; // B
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

  // Resize Listener
  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // Loop
  const animate = () => {
    requestAnimationFrame(animate);

    // Drifting animation
    starField.rotation.y += 0.0005;
    starField.rotation.x += 0.0002;

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
  scene.add(mesh);

  // Inner solid core
  const innerGeom = new THREE.IcosahedronGeometry(1.2, 0);
  const innerMat = new THREE.MeshPhongMaterial({
    color: 0x06b6d4,
    transparent: true,
    opacity: 0.8,
    shininess: 120
  });
  const innerMesh = new THREE.Mesh(innerGeom, innerMat);
  scene.add(innerMesh);

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

  const animate = () => {
    requestAnimationFrame(animate);

    mesh.rotation.y += 0.005;
    mesh.rotation.x += 0.003;

    innerMesh.rotation.y -= 0.008;
    innerMesh.rotation.x -= 0.004;

    // Pulse core
    const scale = 1 + Math.sin(Date.now() * 0.002) * 0.15;
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
let moveIndicator;
let gameInitialized = false;
let is3DMode = true;
let gameAnimationId = null;
let activeModalNode = null;
let lastOpenedNode = null;

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
let gamePlayerTargetPos = null;

const nodeDefs = [
  {
    id: "about",
    name: "GIỚI THIỆU",
    nameEn: "ABOUT",
    color: 0x915eff, // fuchsia/purple
    x: 0,
    z: -16,
    iconType: "icosahedron",
    targetId: "about"
  },
  {
    id: "experience",
    name: "KINH NGHIỆM",
    nameEn: "EXPERIENCE",
    color: 0xc084fc, // light purple
    x: 16,
    z: 0,
    iconType: "torusKnot",
    targetId: "experience"
  },
  {
    id: "projects",
    name: "SẢN PHẨM",
    nameEn: "PROJECTS",
    color: 0x06b6d4, // cyan
    x: -16,
    z: 0,
    iconType: "octahedron",
    targetId: "projects"
  },
  {
    id: "contact",
    name: "LIÊN HỆ",
    nameEn: "CONTACT",
    color: 0xf43f5e, // rose
    x: 0,
    z: 16,
    iconType: "box",
    targetId: "contact"
  }
];

function createTextSprite(text, color = '#ffffff') {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'rgba(0,0,0,0)';
  ctx.fillRect(0, 0, 256, 64);
  
  ctx.font = 'Bold 26px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = color;
  ctx.shadowBlur = 8;
  ctx.fillStyle = color;
  ctx.fillText(text, 128, 32);
  
  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(6, 1.5, 1);
  return sprite;
}

function initGame3D() {
  if (gameInitialized) {
    if (!gameAnimationId) {
      gameAnimate();
    }
    window.dispatchEvent(new Event('resize'));
    return;
  }
  
  const canvas = document.getElementById("canvas-game-3d");
  if (!canvas) return;
  canvas.addEventListener("contextmenu", e => e.preventDefault());
  
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
  
  // Simple particle system
  const starCount = 800;
  const starGeom = new THREE.BufferGeometry();
  const starPos = new Float32Array(starCount * 3);
  for(let i = 0; i < starCount * 3; i += 3) {
    starPos[i] = (Math.random() - 0.5) * 200;
    starPos[i+1] = (Math.random() - 0.5) * 150 + 20;
    starPos[i+2] = (Math.random() - 0.5) * 200;
  }
  starGeom.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
  const starMat = new THREE.PointsMaterial({ size: 0.8, color: 0xffffff, transparent: true, opacity: 0.6 });
  const gameStars = new THREE.Points(starGeom, starMat);
  gameScene.add(gameStars);
  
  // Grid floor helper
  const gridHelper = new THREE.GridHelper(60, 30, 0x06b6d4, 0x1d1836);
  gridHelper.position.y = -1.5;
  gameScene.add(gridHelper);
  
  // Giant rotating hologram planet underneath the scene grid
  const globeGeom = new THREE.SphereGeometry(30, 24, 24);
  const globeMat = new THREE.MeshBasicMaterial({
    color: 0x06b6d4,
    wireframe: true,
    transparent: true,
    opacity: 0.12
  });
  gameUnderGlobe = new THREE.Mesh(globeGeom, globeMat);
  gameUnderGlobe.position.set(0, -28, 0); // Positioned deep below grid floor
  
  // Floating grid equator ring
  const equatorGeom = new THREE.TorusGeometry(32, 0.15, 8, 64);
  const equatorMat = new THREE.MeshBasicMaterial({
    color: 0x915eff,
    transparent: true,
    opacity: 0.2
  });
  const equatorRing = new THREE.Mesh(equatorGeom, equatorMat);
  equatorRing.rotation.x = Math.PI / 2;
  gameUnderGlobe.add(equatorRing);
  
  gameScene.add(gameUnderGlobe);
  
  // Destination indicator mesh (sky blue ring/circle)
  const indGeom = new THREE.RingGeometry(0.01, 0.4, 32);
  const indMat = new THREE.MeshBasicMaterial({
    color: 0x00d2ff, // Sky blue
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0
  });
  moveIndicator = new THREE.Mesh(indGeom, indMat);
  moveIndicator.rotation.x = Math.PI / 2;
  moveIndicator.position.set(0, -1.47, 0); // Flat on grid floor (above gridHelper which is at -1.5)
  moveIndicator.visible = false;
  gameScene.add(moveIndicator);
  
  // Create player Group (cyber drone)
  gamePlayer = new THREE.Group();
  
  const coreGeom = new THREE.SphereGeometry(0.7, 16, 16);
  const coreMat = new THREE.MeshPhongMaterial({ color: 0x06b6d4, shininess: 100, emissive: 0x014b5c });
  const coreMesh = new THREE.Mesh(coreGeom, coreMat);
  gamePlayer.add(coreMesh);
  
  const ringGeom = new THREE.TorusGeometry(1.1, 0.1, 8, 24);
  const ringMat = new THREE.MeshPhongMaterial({ color: 0x915eff, emissive: 0x3b0066 });
  const ringMesh = new THREE.Mesh(ringGeom, ringMat);
  ringMesh.rotation.x = Math.PI / 2;
  gamePlayer.add(ringMesh);
  
  const thrusterGeom = new THREE.ConeGeometry(0.3, 0.8, 8);
  const thrusterMat = new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.8 });
  const thrusterMesh = new THREE.Mesh(thrusterGeom, thrusterMat);
  thrusterMesh.position.y = -0.9;
  thrusterMesh.rotation.x = Math.PI;
  gamePlayer.add(thrusterMesh);
  
  const playerLight = new THREE.PointLight(0x06b6d4, 2, 6);
  playerLight.position.y = -0.5;
  gamePlayer.add(playerLight);

  // Small glowing energy orb sphere under the core body
  const energyOrbGeom = new THREE.SphereGeometry(0.3, 16, 16);
  const energyOrbMat = new THREE.MeshBasicMaterial({
    color: 0x00ffff,
    transparent: true,
    opacity: 0.8
  });
  const energyOrb = new THREE.Mesh(energyOrbGeom, energyOrbMat);
  energyOrb.position.y = -0.45;
  gamePlayer.add(energyOrb);
  
  gameScene.add(gamePlayer);
  gamePlayer.position.set(0, 0.5, 0);
  
  // Build Nodes/Platforms
  gameNodes = [];
  nodeDefs.forEach(def => {
    const nodeGroup = new THREE.Group();
    nodeGroup.position.set(def.x, 0, def.z);
    
    // Base cylinder
    const baseGeom = new THREE.CylinderGeometry(2.5, 2.7, 0.4, 6);
    const baseMat = new THREE.MeshPhongMaterial({ color: 0x151030, shininess: 50, emissive: 0x0a0518 });
    const baseMesh = new THREE.Mesh(baseGeom, baseMat);
    baseMesh.position.y = -1.3;
    nodeGroup.add(baseMesh);
    
    // Outer border ring
    const borderGeom = new THREE.TorusGeometry(2.6, 0.08, 8, 32);
    const borderMat = new THREE.MeshBasicMaterial({ color: def.color });
    const borderMesh = new THREE.Mesh(borderGeom, borderMat);
    borderMesh.rotation.x = Math.PI / 2;
    borderMesh.position.y = -1.1;
    nodeGroup.add(borderMesh);
    
    // Icon shape
    let iconMesh;
    if (def.iconType === "icosahedron") {
      iconMesh = new THREE.Mesh(new THREE.IcosahedronGeometry(1.0, 0), new THREE.MeshPhongMaterial({ color: def.color, wireframe: true }));
    } else if (def.iconType === "torusKnot") {
      iconMesh = new THREE.Mesh(new THREE.TorusKnotGeometry(0.6, 0.2, 40, 8), new THREE.MeshPhongMaterial({ color: def.color, wireframe: true }));
    } else if (def.iconType === "octahedron") {
      iconMesh = new THREE.Mesh(new THREE.OctahedronGeometry(1.0, 0), new THREE.MeshPhongMaterial({ color: def.color, wireframe: true }));
    } else {
      iconMesh = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.0, 1.0), new THREE.MeshPhongMaterial({ color: def.color, wireframe: true }));
    }
    iconMesh.position.y = 0.3;
    nodeGroup.add(iconMesh);
    
    // Sprite
    const nameSprite = createTextSprite(currentLang === 'vi' ? def.name : def.nameEn, '#' + def.color.toString(16).padStart(6, '0'));
    nameSprite.position.y = 2.0;
    nodeGroup.add(nameSprite);
    
    // Beam cylinder light
    const beamGeom = new THREE.CylinderGeometry(1.5, 1.5, 3.5, 16, 1, true);
    const beamMat = new THREE.MeshBasicMaterial({
      color: def.color,
      transparent: true,
      opacity: 0.15,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending
    });
    const beamMesh = new THREE.Mesh(beamGeom, beamMat);
    beamMesh.position.y = 0.5;
    nodeGroup.add(beamMesh);
    
    gameScene.add(nodeGroup);
    
    gameNodes.push({
      group: nodeGroup,
      mesh: iconMesh,
      sprite: nameSprite,
      def: def
    });
  });
  
  // Listeners
  window.addEventListener("keydown", handleGameKeyDown);
  window.addEventListener("keyup", handleGameKeyUp);
  window.addEventListener("resize", handleGameResize);
  
  // Drag rotate and right-click move listeners
  let isDragging = false;
  let prevX = 0;
  let prevY = 0;
  
  window.addEventListener("pointerdown", (e) => {
    if (e.target.id === "canvas-game-3d") {
      if (e.button === 0 || e.pointerType === "touch") {
        isDragging = true;
        prevX = e.clientX;
        prevY = e.clientY;
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
      
      const limit = 26;
      gamePlayerTargetPos = {
        x: Math.max(-limit, Math.min(limit, targetPoint.x)),
        z: Math.max(-limit, Math.min(limit, targetPoint.z))
      };
      
      // Position and reveal the sky blue destination indicator dot/ring
      if (moveIndicator) {
        moveIndicator.position.set(gamePlayerTargetPos.x, -1.47, gamePlayerTargetPos.z);
        moveIndicator.visible = true;
        moveIndicator.scale.set(1, 1, 1);
        moveIndicator.material.opacity = 0.85;
      }
      
      if (typeof playBeep === 'function') {
        playBeep(650, 0.08, 'sine', 0.02);
      }
    }
  });
  
  window.addEventListener("pointermove", (e) => {
    if (!isDragging) return;
    const dx = e.clientX - prevX;
    const dy = e.clientY - prevY;
    
    gameCameraYawAngle -= dx * 0.005;
    gameCameraPitchAngle = Math.max(0.1, Math.min(Math.PI / 2.2, gameCameraPitchAngle + dy * 0.005));
    
    prevX = e.clientX;
    prevY = e.clientY;
  });
  
  window.addEventListener("pointerup", () => {
    isDragging = false;
  });
  
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
    });
    
    zone.addEventListener("touchmove", (e) => {
      if (!joystickActive) return;
      const touch = e.touches[0];
      const dx = touch.clientX - joystickStartPos.x;
      const dy = touch.clientY - joystickStartPos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const maxDist = 45;
      
      const angle = Math.atan2(dy, dx);
      const finalDist = Math.min(dist, maxDist);
      
      const px = Math.cos(angle) * finalDist;
      const py = Math.sin(angle) * finalDist;
      
      handle.style.transform = `translate(${px}px, ${py}px)`;
      
      joystickDir.x = Math.cos(angle) * (finalDist / maxDist);
      joystickDir.y = Math.sin(angle) * (finalDist / maxDist);
      e.preventDefault();
    });
    
    const resetJoy = () => {
      joystickActive = false;
      handle.style.transform = "translate(0, 0)";
      joystickDir = { x: 0, y: 0 };
    };
    
    zone.addEventListener("touchend", resetJoy);
    zone.addEventListener("touchcancel", resetJoy);
  }
  
  updateGameCameraPosition();
  
  gameInitialized = true;
  gameAnimate();
}

function updateGameCameraPosition() {
  if (!gameCamera || !gamePlayer) return;
  
  const ox = Math.sin(gameCameraYawAngle) * Math.cos(gameCameraPitchAngle) * gameCameraRadius;
  const oy = Math.sin(gameCameraPitchAngle) * gameCameraRadius;
  const oz = Math.cos(gameCameraYawAngle) * Math.cos(gameCameraPitchAngle) * gameCameraRadius;
  
  gameCamera.position.set(gamePlayer.position.x + ox, gamePlayer.position.y + oy, gamePlayer.position.z + oz);
  gameCamera.lookAt(gamePlayer.position.x, gamePlayer.position.y + 0.5, gamePlayer.position.z);
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

function gameAnimate() {
  if (!is3DMode) return;
  gameAnimationId = requestAnimationFrame(gameAnimate);
  
  const time = performance.now() * 0.002;
  
  if (gamePlayer && !activeModalNode && !document.getElementById("bootloader-overlay")) {
    gamePlayer.position.y = 0.5 + Math.sin(time * 2) * 0.12;
    gamePlayer.children[1].rotation.z += 0.015;
    gamePlayer.children[2].scale.setScalar(0.95 + Math.sin(time * 6) * 0.05);
    
    // Pulsate bottom engine energy orb sphere
    if (gamePlayer.children[4]) {
      gamePlayer.children[4].scale.setScalar(0.9 + Math.sin(time * 8) * 0.1);
    }
    
    const speed = 0.22;
    let dx = 0;
    let dz = 0;
    
    const camForward = new THREE.Vector3(0, 0, -1).applyQuaternion(gameCamera.quaternion);
    camForward.y = 0;
    camForward.normalize();
    
    const camRight = new THREE.Vector3(1, 0, 0).applyQuaternion(gameCamera.quaternion);
    camRight.y = 0;
    camRight.normalize();
    
    if (joystickActive) {
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
    
    const limit = 26;
    gamePlayer.position.x = Math.max(-limit, Math.min(limit, gamePlayer.position.x));
    gamePlayer.position.z = Math.max(-limit, Math.min(limit, gamePlayer.position.z));
    
    if (dx !== 0 || dz !== 0) {
      const targetAngle = Math.atan2(dx, dz);
      gamePlayer.rotation.y = targetAngle;
    }
  }
  
  let closestNode = null;
  let minDistance = Infinity;
  
  // Rotate the giant hologram planet underneath
  if (gameUnderGlobe) {
    gameUnderGlobe.rotation.y += 0.0015;
    gameUnderGlobe.rotation.x += 0.0008;
  }

  // Animate destination indicator dot (sky blue ring)
  if (moveIndicator && moveIndicator.visible) {
    moveIndicator.rotation.z += 0.03;
    if (gamePlayerTargetPos) {
      const d = Math.hypot(gamePlayerTargetPos.x - gamePlayer.position.x, gamePlayerTargetPos.z - gamePlayer.position.z);
      if (d < 1.5) {
        moveIndicator.material.opacity = Math.max(0, (d / 1.5) * 0.85);
        const sc = Math.max(0.1, d / 1.5);
        moveIndicator.scale.set(sc, sc, 1);
      }
    } else {
      moveIndicator.material.opacity -= 0.1;
      if (moveIndicator.material.opacity <= 0) {
        moveIndicator.visible = false;
      }
    }
  }

  gameNodes.forEach(node => {
    node.mesh.rotation.y += 0.008;
    node.mesh.rotation.x += 0.004;
    node.sprite.lookAt(gameCamera.position);
    
    const dist = gamePlayer.position.distanceTo(node.group.position);
    if (dist < minDistance) {
      minDistance = dist;
      closestNode = node;
    }
  });
  
  const interactionHud = document.getElementById("interaction-hud");
  const interactionText = document.getElementById("interaction-text");
  
  if (minDistance < 3.8 && closestNode && !activeModalNode) {
    if (interactionHud && interactionText) {
      interactionHud.classList.remove("hidden");
      const viMsg = `ĐANG Ở GẦN ĐỊA DANH ${closestNode.def.name} - ĐỨNG YÊN ĐỂ KẾT NỐI`;
      const enMsg = `NEAR ${closestNode.def.nameEn} NODE - STAY STILL TO CONNECT`;
      interactionText.textContent = currentLang === 'vi' ? viMsg : enMsg;
      interactionText.setAttribute("data-vi", viMsg);
      interactionText.setAttribute("data-en", enMsg);
    }
    
    if (minDistance < 2.0 && !activeModalNode && lastOpenedNode !== closestNode.def.id) {
      lastOpenedNode = closestNode.def.id;
      openGameModal(closestNode.def);
    }
  } else {
    if (interactionHud) {
      interactionHud.classList.add("hidden");
    }
    if (minDistance >= 3.8) {
      lastOpenedNode = null;
    }
  }
  
  updateGameCameraPosition();
  gameRenderer.render(gameScene, gameCamera);
}

function stopGame3D() {
  if (gameAnimationId) {
    cancelAnimationFrame(gameAnimationId);
    gameAnimationId = null;
  }
  closeGameModal();
}

function openGameModal(nodeDef) {
  const modal = document.getElementById("game-modal");
  const content = document.getElementById("game-modal-content");
  if (!modal || !content) return;
  
  activeModalNode = nodeDef.id;
  
  if (typeof playBeep === 'function') {
    playBeep(880, 0.18, 'sine', 0.04);
  }
  
  const srcSection = document.getElementById(nodeDef.targetId);
  if (srcSection) {
    content.innerHTML = `
      <div class="space-y-6">
        <div class="flex items-center gap-3 border-b border-white/10 pb-4 mb-6">
          <div class="w-10 h-10 rounded-xl flex justify-center items-center text-white text-lg font-bold" style="background-color: #${nodeDef.color.toString(16).padStart(6, '0')}">
            <i class="fa-solid fa-folder-open"></i>
          </div>
          <div>
            <h2 class="text-2xl font-bold font-display text-white uppercase">${currentLang === 'vi' ? nodeDef.name : nodeDef.nameEn}</h2>
            <p class="text-zinc-500 text-xs font-mono uppercase tracking-widest mt-0.5">LOCAL FILE NODE DETECTED // INTEGRATED</p>
          </div>
        </div>
        <div class="section-content-clone">
          ${srcSection.innerHTML}
        </div>
      </div>
    `;
    
    if (nodeDef.targetId === "contact") {
      setupContactForm();
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

    updateLanguageUI();
  }
  
  modal.classList.remove("hidden");
  setTimeout(() => {
    modal.classList.remove("opacity-0");
  }, 50);
}

function closeGameModal() {
  const modal = document.getElementById("game-modal");
  if (!modal) return;
  
  modal.classList.add("opacity-0");
  setTimeout(() => {
    modal.classList.add("hidden");
    activeModalNode = null;
  }, 300);
  
  if (typeof playBeep === 'function') {
    playBeep(440, 0.1, 'sine', 0.04);
  }
}

function updateGameLanguageUI() {
  if (!gameInitialized) return;
  gameNodes.forEach(node => {
    const colorHex = '#' + node.def.color.toString(16).padStart(6, '0');
    const newText = currentLang === 'vi' ? node.def.name : node.def.nameEn;
    
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgba(0,0,0,0)';
    ctx.fillRect(0, 0, 256, 64);
    
    ctx.font = 'Bold 26px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = colorHex;
    ctx.shadowBlur = 8;
    ctx.fillStyle = colorHex;
    ctx.fillText(newText, 128, 32);
    
    const texture = new THREE.CanvasTexture(canvas);
    node.sprite.material.map = texture;
    node.sprite.material.needsUpdate = true;
  });
}

function setupViewModeToggle() {
  const btn = document.getElementById("view-mode-btn");
  const text = document.getElementById("view-mode-text");
  const mainContent = document.getElementById("main-content");
  const gameContainer = document.getElementById("game-container");
  const canvasBg = document.getElementById("canvas-bg");
  
  if (!btn) return;
  
  const updateToggleUI = () => {
    if (is3DMode) {
      text.textContent = currentLang === "vi" ? "📄 CHẾ ĐỘ THƯỜNG" : "📄 LIST VIEW";
      text.setAttribute("data-vi", "📄 CHẾ ĐỘ THƯỜNG");
      text.setAttribute("data-en", "📄 LIST VIEW");
      
      mainContent.classList.add("hidden");
      gameContainer.classList.remove("hidden");
      canvasBg.style.display = "none";
      
      initGame3D();
    } else {
      text.textContent = currentLang === "vi" ? "🎮 KHÔNG GIAN 3D" : "🎮 3D WORKSPACE";
      text.setAttribute("data-vi", "🎮 KHÔNG GIAN 3D");
      text.setAttribute("data-en", "🎮 3D WORKSPACE");
      
      mainContent.classList.remove("hidden");
      gameContainer.classList.add("hidden");
      canvasBg.style.display = "block";
      
      stopGame3D();
    }
  };
  
  btn.addEventListener("click", () => {
    is3DMode = !is3DMode;
    localStorage.setItem("view-mode-3d", is3DMode);
    updateToggleUI();
    if (typeof playBeep === 'function') {
      playBeep(900, 0.1, 'triangle', 0.05);
    }
  });
  
  const savedMode = localStorage.getItem("view-mode-3d");
  if (savedMode !== null) {
    is3DMode = savedMode === "true";
  } else {
    is3DMode = true; // Enabled by default
  }
  
  updateToggleUI();
}

// ==========================================================================
// SYSTEM ENTRYPOINT
// ==========================================================================
window.addEventListener("DOMContentLoaded", () => {
  // 3D Background runs immediately
  initStarfieldBackground();
  // Bootloader runs
  startBootloader();
  // Set up form handlers
  setupContactForm();
  
  // Set up view mode toggle
  setupViewModeToggle();
  
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
    langToggleBtn.addEventListener("click", () => {
      currentLang = currentLang === "vi" ? "en" : "vi";
      localStorage.setItem("portfolio-lang", currentLang);
      updateLanguageUI();
      playBeep(900, 0.08, 'sine', 0.02);
    });
  }

  // Global interface click sounds
  document.addEventListener("click", (e) => {
    const target = e.target.closest("a, button, [role='button'], .cursor-pointer, .glass-panel");
    if (target) {
      if (target.id === "loader-start-btn" || target.type === "submit" || target.id === "mobile-menu-btn" || target.id === "lang-toggle-btn") {
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
});
