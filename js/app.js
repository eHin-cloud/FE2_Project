// ==========================================================================
// AUDIO SYNTHESIZER UTILITIES (SCI-FI FX ENGINE)
// ==========================================================================
let audioCtx;
let chargingOsc, chargingLFO, chargingGain;
let starfieldSpeedMultiplier = 1.0;
let transitionLoadingActive = false;

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
          
          // Fade out the diagnostic card container
          const bootloaderCard = document.getElementById("bootloader-card");
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
            
            // Trigger appropriate view mode transitions
            if (typeof setupViewModeToggle === 'function') {
              const btn = document.getElementById("view-mode-btn");
              if (btn) {
                const mainContent = document.getElementById("main-content");
                const gameContainer = document.getElementById("game-container");
                const canvasBg = document.getElementById("canvas-bg");
                const text = document.getElementById("view-mode-text");
                
                if (is3DMode && mainContent && gameContainer && canvasBg) {
                  if (text) {
                    text.textContent = currentLang === "vi" ? "📄 CHẾ ĐỘ THƯỜNG" : "📄 LIST VIEW";
                  }
                  const mainNav = document.getElementById("main-nav");
                  if (mainNav) mainNav.classList.add("hidden");
                  
                  mainContent.classList.add("hidden");
                  gameContainer.classList.remove("hidden");
                  canvasBg.style.display = "none";
                  initGame3D();
                  triggerSpaceTransition();
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
    vi: "Thực tập sinh Web Developer & Laravel định hướng tối ưu giao diện (UI/UX). Chào mừng bạn đến với Cyber-Oasis Space Station. Hãy điều khiển drone du hành qua các trạm năng lực để khám phá hồ sơ cá nhân của tôi!",
    en: "Web Developer & Laravel Intern focused on UI/UX optimization. Welcome to Cyber-Oasis Space Station. Navigate the drone through the nodes to explore my professional portfolio!"
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

    // Move particles forward towards camera
    const pos = geometry.attributes.position.array;
    for (let i = 2; i < pos.length; i += 3) {
      const speed = (starfieldSpeedMultiplier > 1.0) ? (0.6 * starfieldSpeedMultiplier) : 0.4;
      pos[i] -= speed;
      if (pos[i] < -200) {
        pos[i] = 200;
        pos[i-2] = (Math.random() - 0.5) * 600;
        pos[i-1] = (Math.random() - 0.5) * 600;
      }
    }
    geometry.attributes.position.needsUpdate = true;

    // Drifting rotation animation (slight secondary rotation)
    starField.rotation.y += 0.0002;
    starField.rotation.x += 0.0001;

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
let centralCoreGroup = null;
let moveIndicator;
let gameStars = null;
let gameStarsTwinkleA = null;
let gameStarsTwinkleB = null;
let gameNebulaClouds = [];
let gameTechFloor = null;
let gameWalkwayTextures = [];
let gameBlackHoleGroup = null;
let gameBgPlanets = [];
let gameSweepRing = null;
let gameFenceBeacons = [];
let gameInitialized = false;
let gamePortalGroup = null, gamePortalVortex = null, gamePortalRing = null, gamePortalSprite = null;
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
let gameCameraTargetRadius = 16;
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

function createTextTexture(text, color = '#ffffff') {
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
  
  return new THREE.CanvasTexture(canvas);
}

function createTextSprite(text, color = '#ffffff') {
  const texture = createTextTexture(text, color);
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(6, 1.5, 1);
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
  
  // Outer metallic blue rails
  ctx.fillStyle = "rgba(6, 182, 212, 0.4)";
  ctx.fillRect(0, 0, 6, 256);
  ctx.fillRect(58, 0, 6, 256);
  
  // Translucent glowing center stripe
  ctx.fillStyle = "rgba(6, 182, 212, 0.1)";
  ctx.fillRect(6, 0, 52, 256);
  
  // Chevron flow arrows pointing forward
  ctx.strokeStyle = "rgba(6, 182, 212, 0.8)";
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
  ctx.strokeStyle = "rgba(145, 94, 255, 0.25)";
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

function initGame3D() {
  gameCameraTargetRadius = 16;
  gameCameraRadius = 16;
  gameCameraPitchAngle = 0.5;
  gameWalkwayTextures = [];
  gameSweepRing = null;
  gameFenceBeacons = [];

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
  
  // Concentric / Twinkling Starfields
  // 1. Static far stars (white)
  const starCount = 800;
  const starGeom = new THREE.BufferGeometry();
  const starPos = new Float32Array(starCount * 3);
  for(let i = 0; i < starCount * 3; i += 3) {
    starPos[i] = (Math.random() - 0.5) * 250;
    starPos[i+1] = (Math.random() - 0.5) * 200 + 30;
    starPos[i+2] = (Math.random() - 0.5) * 250;
  }
  starGeom.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
  const starMat = new THREE.PointsMaterial({ size: 0.7, color: 0xffffff, transparent: true, opacity: 0.5 });
  gameStars = new THREE.Points(starGeom, starMat);
  gameScene.add(gameStars);

  // 2. Twinkling Cyan Stars
  const starCountA = 400;
  const starGeomA = new THREE.BufferGeometry();
  const starPosA = new Float32Array(starCountA * 3);
  for(let i = 0; i < starCountA * 3; i += 3) {
    starPosA[i] = (Math.random() - 0.5) * 250;
    starPosA[i+1] = (Math.random() - 0.5) * 200 + 30;
    starPosA[i+2] = (Math.random() - 0.5) * 250;
  }
  starGeomA.setAttribute("position", new THREE.BufferAttribute(starPosA, 3));
  const starMatA = new THREE.PointsMaterial({ size: 0.9, color: 0x06b6d4, transparent: true, opacity: 0.7 });
  gameStarsTwinkleA = new THREE.Points(starGeomA, starMatA);
  gameScene.add(gameStarsTwinkleA);

  // 3. Twinkling Purple Stars
  const starCountB = 400;
  const starGeomB = new THREE.BufferGeometry();
  const starPosB = new Float32Array(starCountB * 3);
  for(let i = 0; i < starCountB * 3; i += 3) {
    starPosB[i] = (Math.random() - 0.5) * 250;
    starPosB[i+1] = (Math.random() - 0.5) * 200 + 30;
    starPosB[i+2] = (Math.random() - 0.5) * 250;
  }
  starGeomB.setAttribute("position", new THREE.BufferAttribute(starPosB, 3));
  const starMatB = new THREE.PointsMaterial({ size: 0.8, color: 0xd946ef, transparent: true, opacity: 0.6 });
  gameStarsTwinkleB = new THREE.Points(starGeomB, starMatB);
  gameScene.add(gameStarsTwinkleB);

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
  const gridHelper = new THREE.GridHelper(60, 30, 0x06b6d4, 0x1d1836);
  gridHelper.position.y = -1.5;
  gameScene.add(gridHelper);

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
  ctx.strokeStyle = "rgba(6, 182, 212, 0.04)";
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
  ctx.strokeStyle = "rgba(6, 182, 212, 0.4)";
  ctx.lineWidth = 4;
  ctx.strokeRect(16, 16, 992, 992);
  
  // Corner brackets
  ctx.strokeStyle = "#06b6d4";
  ctx.lineWidth = 10;
  const bracketLen = 80;
  ctx.beginPath(); ctx.moveTo(16, 16 + bracketLen); ctx.lineTo(16, 16); ctx.lineTo(16 + bracketLen, 16); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(1008 - bracketLen, 16); ctx.lineTo(1008, 16); ctx.lineTo(1008, 16 + bracketLen); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(16, 1008 - bracketLen); ctx.lineTo(16, 1008); ctx.lineTo(16 + bracketLen, 1008); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(1008 - bracketLen, 1008); ctx.lineTo(1008, 1008); ctx.lineTo(1008, 1008 - bracketLen); ctx.stroke();
  
  // Central core docking base circle
  ctx.strokeStyle = "rgba(145, 94, 255, 0.4)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(512, 512, 60, 0, Math.PI * 2);
  ctx.stroke();
  
  ctx.strokeStyle = "rgba(6, 182, 212, 0.25)";
  ctx.setLineDash([8, 12]);
  ctx.beginPath();
  ctx.arc(512, 512, 85, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  
  // Concentric radar sector circles
  ctx.strokeStyle = "rgba(145, 94, 255, 0.25)";
  ctx.lineWidth = 2;
  const center = 512;
  const radiuses = [160, 320, 440];
  radiuses.forEach(r => {
    ctx.beginPath();
    ctx.arc(center, center, r, 0, Math.PI * 2);
    ctx.stroke();
  });
  
  // Center crosshair axis lines
  ctx.strokeStyle = "rgba(6, 182, 212, 0.15)";
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
    ctx.arc(cx, cy, 48, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Inner solid ring
    ctx.strokeStyle = colorHex + "88";
    ctx.beginPath();
    ctx.arc(cx, cy, 42, 0, Math.PI * 2);
    ctx.stroke();
    
    // Crosshair ticks
    ctx.strokeStyle = colorHex + "aa";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - 56, cy); ctx.lineTo(cx - 44, cy);
    ctx.moveTo(cx + 44, cy); ctx.lineTo(cx + 56, cy);
    ctx.moveTo(cx, cy - 56); ctx.lineTo(cx, cy - 44);
    ctx.moveTo(cx, cy + 44); ctx.lineTo(cx, cy + 56);
    ctx.stroke();
    
    // Text label
    ctx.fillStyle = colorHex;
    ctx.font = "bold 13px monospace";
    ctx.textAlign = "center";
    ctx.fillText(label, cx, cy + 68);
  };
  
  drawLandingPad(512, 239, "BAY 01 // ABOUT", "#915eff");
  drawLandingPad(785, 512, "BAY 02 // EXPERIENCE", "#c084fc");
  drawLandingPad(239, 512, "BAY 03 // PROJECTS", "#06b6d4");
  drawLandingPad(512, 785, "BAY 04 // CONTACT", "#f43f5e");
  drawLandingPad(512, 922, "DEPARTURE GATE // WARP GATE", "#ec4899");
  
  // Telemetry indicators
  ctx.textAlign = "left";
  ctx.fillStyle = "#06b6d4";
  ctx.font = "bold 15px monospace";
  ctx.fillText("STATION CONTROL DECK AREA A-1 // SYS: SECURE", 40, 50);
  ctx.fillText("RADAR LINK STATUS: ONLINE // BEACON STABLE", 40, 75);
  
  ctx.fillStyle = "#915eff";
  ctx.fillText("DOCKING GRID: SYMMETRICAL SECTORS", 680, 50);
  ctx.fillText("POWER CORES: 98% FLUID REACTION", 680, 75);
  
  const floorTex = new THREE.CanvasTexture(techCanvas);
  const floorMat = new THREE.MeshBasicMaterial({
    map: floorTex,
    transparent: true,
    opacity: 0.75,
    side: THREE.DoubleSide
  });
  const floorGeom = new THREE.PlaneGeometry(60, 60);
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
  gameSweepRing.position.set(0, -1.46, 0); // slightly above tech floor
  gameScene.add(gameSweepRing);
  
  // Perimeter neon fence posts & beacons (Skip node paths/walkways)
  gameFenceBeacons = [];
  const fenceGroup = new THREE.Group();
  const postGeom = new THREE.CylinderGeometry(0.04, 0.04, 1.0, 8);
  const postMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4, transparent: true, opacity: 0.8 });
  const beaconGeom = new THREE.SphereGeometry(0.08, 8, 8);
  
  const numPosts = 16;
  const fenceRadius = 27.5;
  for (let i = 0; i < numPosts; i++) {
    const angle = (i / numPosts) * Math.PI * 2;
    
    let closeToWalkway = false;
    for (let k = 0; k < 4; k++) {
      const targetAngle = (k * Math.PI) / 2;
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
  const railsGeom = new THREE.TorusGeometry(27.5, 0.02, 4, 128);
  const railsMat = new THREE.MeshBasicMaterial({ color: 0x915eff, transparent: true, opacity: 0.35 });
  const railsMesh = new THREE.Mesh(railsGeom, railsMat);
  railsMesh.rotation.x = Math.PI / 2;
  railsMesh.position.y = -1.0;
  fenceGroup.add(railsMesh);
  
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
  
  // ==========================================================================
  // CENTRAL SPACE STATION COMMAND CORE & CONNECTING BRIDGES
  // ==========================================================================
  centralCoreGroup = new THREE.Group();
  centralCoreGroup.position.set(0, 0, 0);

  // Main high-tech cylindrical core reactor tower
  const reactorTowerGeom = new THREE.CylinderGeometry(1.6, 2.0, 5.0, 8);
  const reactorTowerMat = new THREE.MeshPhongMaterial({
    color: 0x0f172a,
    emissive: 0x070c1e,
    specular: 0x06b6d4,
    shininess: 90,
    flatShading: true
  });
  const reactorTower = new THREE.Mesh(reactorTowerGeom, reactorTowerMat);
  reactorTower.position.y = -0.5; // aligned to go down slightly below grid floor
  centralCoreGroup.add(reactorTower);

  // Central glowing core energy rings
  const reactorRingGeom1 = new THREE.TorusGeometry(2.1, 0.08, 8, 32);
  const reactorRingMat1 = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });
  const reactorRing1 = new THREE.Mesh(reactorRingGeom1, reactorRingMat1);
  reactorRing1.rotation.x = Math.PI / 2;
  reactorRing1.position.y = 0.8;
  centralCoreGroup.add(reactorRing1);

  const reactorRing2 = reactorRing1.clone();
  reactorRing2.position.y = -1.2;
  reactorRing2.scale.set(1.05, 1.05, 1);
  reactorRing2.material = new THREE.MeshBasicMaterial({ color: 0x915eff });
  centralCoreGroup.add(reactorRing2);

  // Sci-Fi Tech Solar Array Panels (Left/Right Wings)
  const solarWingGeom = new THREE.BoxGeometry(6.5, 0.04, 1.0);
  const solarWingMat = new THREE.MeshPhongMaterial({
    color: 0x0284c7,
    emissive: 0x0c2540,
    specular: 0xffffff,
    shininess: 100
  });

  // Left Solar Wing
  const leftWing = new THREE.Mesh(solarWingGeom, solarWingMat);
  leftWing.position.set(-4.5, 1.0, 0);
  centralCoreGroup.add(leftWing);

  // Right Solar Wing
  const rightWing = leftWing.clone();
  rightWing.position.x = 4.5;
  centralCoreGroup.add(rightWing);

  // Antenna Mast & Rotating Sat Dish on top
  const antennaMastGeom = new THREE.CylinderGeometry(0.1, 0.1, 2.0, 8);
  const antennaMastMat = new THREE.MeshPhongMaterial({ color: 0x475569 });
  const antennaMast = new THREE.Mesh(antennaMastGeom, antennaMastMat);
  antennaMast.position.y = 2.8;
  centralCoreGroup.add(antennaMast);

  const dishGeom = new THREE.ConeGeometry(0.9, 0.35, 16, 1, true);
  const dishMat = new THREE.MeshPhongMaterial({ color: 0x334155, side: THREE.DoubleSide });
  const dishMesh = new THREE.Mesh(dishGeom, dishMat);
  dishMesh.name = "station_dish";
  dishMesh.position.y = 3.8;
  dishMesh.rotation.x = -Math.PI / 4;
  centralCoreGroup.add(dishMesh);

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
    
    gameScene.add(walkway);
  });

  // Walkway to Exit Portal (Portal at 0, 1, 24)
  const portalDist = 24.0;
  const portalLen = portalDist - 2.0 - 3.2; // portal base radius is 3.2
  const portalBridgeDist = 2.0 + portalLen / 2;
  
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
  portalWalkway.position.set(0, -1.35, portalBridgeDist);
  
  // Side glowing pink guide rails for exit portal bridge
  const portalRailMat = new THREE.MeshBasicMaterial({ color: 0xf43f5e });
  const portalLeftRail = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.12, portalLen), portalRailMat);
  portalLeftRail.position.set(-0.42, 0.06, 0);
  portalWalkway.add(portalLeftRail);
  
  const portalRightRail = portalLeftRail.clone();
  portalRightRail.position.x = 0.42;
  portalWalkway.add(portalRightRail);
  
  gameScene.add(portalWalkway);

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
    borderMesh.name = "pad_ring";
    borderMesh.rotation.x = Math.PI / 2;
    borderMesh.position.y = -1.1;
    nodeGroup.add(borderMesh);
    
    // 3D Sci-Fi Planet creation
    let iconMesh = new THREE.Group();
    iconMesh.position.y = 0.3;
    
    // Core planet sphere
    const coreGeom = new THREE.SphereGeometry(0.8, 32, 32);
    const coreMat = new THREE.MeshPhongMaterial({
      color: 0x0a0a1a,
      emissive: def.color,
      emissiveIntensity: 0.85,
      specular: 0xffffff,
      shininess: 40
    });
    const coreMesh = new THREE.Mesh(coreGeom, coreMat);
    iconMesh.add(coreMesh);
    
    // Unique orbiting features for each planet
    if (def.id === "about") {
      // Purple plasma planet with outer energy lattice
      const shellGeom = new THREE.SphereGeometry(1.05, 12, 12);
      const shellMat = new THREE.MeshBasicMaterial({
        color: def.color,
        wireframe: true,
        transparent: true,
        opacity: 0.4
      });
      const shellMesh = new THREE.Mesh(shellGeom, shellMat);
      shellMesh.name = "sub_shell";
      iconMesh.add(shellMesh);
      
    } else if (def.id === "experience") {
      // Ringed planet (Saturn style)
      const ringGeom = new THREE.RingGeometry(1.2, 2.0, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: def.color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.5
      });
      const ringMesh = new THREE.Mesh(ringGeom, ringMat);
      ringMesh.rotation.x = Math.PI / 2.5;
      ringMesh.rotation.y = Math.PI / 12;
      ringMesh.name = "sub_ring";
      iconMesh.add(ringMesh);
      
    } else if (def.id === "projects") {
      // Technology planet with energy orbits
      const orbitGroup = new THREE.Group();
      orbitGroup.name = "sub_orbits";
      
      const ringGeom1 = new THREE.TorusGeometry(1.3, 0.02, 8, 48);
      const ringMat1 = new THREE.MeshBasicMaterial({ color: def.color });
      const ring1 = new THREE.Mesh(ringGeom1, ringMat1);
      orbitGroup.add(ring1);
      
      const ring2 = new THREE.Mesh(ringGeom1, ringMat1);
      ring2.rotation.x = Math.PI / 2;
      orbitGroup.add(ring2);
      
      const ring3 = new THREE.Mesh(ringGeom1, ringMat1);
      ring3.rotation.y = Math.PI / 2;
      orbitGroup.add(ring3);
      
      iconMesh.add(orbitGroup);
      
    } else if (def.id === "contact") {
      // Red planet with orbiting mini moons
      const moonGroup = new THREE.Group();
      moonGroup.name = "sub_moons";
      
      const moonGeom = new THREE.SphereGeometry(0.16, 8, 8);
      const moonMat = new THREE.MeshPhongMaterial({ color: def.color, emissive: def.color, emissiveIntensity: 0.5 });
      
      const moon1 = new THREE.Mesh(moonGeom, moonMat);
      moon1.position.set(1.4, 0.2, 0);
      moonGroup.add(moon1);
      
      const moon2 = new THREE.Mesh(moonGeom, moonMat);
      moon2.position.set(-1.4, -0.2, 0);
      moonGroup.add(moon2);
      
      iconMesh.add(moonGroup);
    }
    
    nodeGroup.add(iconMesh);
    
    // Floating text label sprite above planet
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
        }
      });
    });

    const intersects = raycaster.intersectObjects(targets);

    // Reset previous hovers
    gameNodes.forEach(node => {
      node.isHovered = false;
    });

    if (intersects.length > 0) {
      const hitObject = intersects[0].object;
      const node = hitObject.userData.nodeRef;
      if (node) {
        node.isHovered = true;
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
      const maxDist = 36;
      
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
  
  // Portal Gate to Return to list view
  gamePortalGroup = new THREE.Group();
  gamePortalGroup.position.set(0, 1.0, 24);
  
  // Portal ring frame
  const portalRingGeom = new THREE.TorusGeometry(2.5, 0.15, 16, 64);
  const portalRingMat = new THREE.MeshPhongMaterial({
    color: 0xf43f5e,
    emissive: 0xf43f5e,
    emissiveIntensity: 1.0,
    shininess: 30
  });
  gamePortalRing = new THREE.Mesh(portalRingGeom, portalRingMat);
  gamePortalGroup.add(gamePortalRing);
  
  // Portal vortex (swirling translucent field)
  const portalVortexGeom = new THREE.CircleGeometry(2.4, 32);
  const portalVortexCanvas = document.createElement('canvas');
  portalVortexCanvas.width = 256;
  portalVortexCanvas.height = 256;
  const portalVCtx = portalVortexCanvas.getContext('2d');
  
  // Draw sci-fi radar/spiral grid on the portal vortex canvas
  portalVCtx.strokeStyle = '#f43f5e';
  portalVCtx.lineWidth = 4;
  portalVCtx.beginPath();
  portalVCtx.arc(128, 128, 110, 0, Math.PI * 2);
  portalVCtx.stroke();
  
  portalVCtx.strokeStyle = 'rgba(244, 63, 94, 0.3)';
  portalVCtx.lineWidth = 2;
  for (let r = 20; r < 100; r += 20) {
    portalVCtx.beginPath();
    portalVCtx.arc(128, 128, r, 0, Math.PI * 2);
    portalVCtx.stroke();
  }
  
  portalVCtx.beginPath();
  portalVCtx.moveTo(128, 18);
  portalVCtx.lineTo(128, 238);
  portalVCtx.moveTo(18, 128);
  portalVCtx.lineTo(238, 128);
  portalVCtx.stroke();
  
  const portalVortexTexture = new THREE.CanvasTexture(portalVortexCanvas);
  const portalVortexMat = new THREE.MeshBasicMaterial({
    map: portalVortexTexture,
    transparent: true,
    opacity: 0.65,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending
  });
  gamePortalVortex = new THREE.Mesh(portalVortexGeom, portalVortexMat);
  gamePortalGroup.add(gamePortalVortex);
  
  // Add text label sprite above portal: "EXIT PORTAL"
  gamePortalSprite = createTextSprite(currentLang === 'vi' ? 'CỔNG THOÁT' : 'EXIT PORTAL', '#f43f5e');
  gamePortalSprite.position.y = 3.5;
  gamePortalGroup.add(gamePortalSprite);
  
  // Underneath base
  const portalBaseGeom = new THREE.CylinderGeometry(3.2, 3.5, 0.6, 6);
  const portalBaseMat = new THREE.MeshPhongMaterial({ color: 0x151030, shininess: 50 });
  const portalBase = new THREE.Mesh(portalBaseGeom, portalBaseMat);
  portalBase.position.y = -2.0;
  gamePortalGroup.add(portalBase);
  
  gameScene.add(gamePortalGroup);

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

  // Rotate central station core elements (energy rings & radar array)
  if (centralCoreGroup) {
    const ring1 = centralCoreGroup.children[1];
    const ring2 = centralCoreGroup.children[2];
    if (ring1) ring1.rotation.z += 0.01;
    if (ring2) ring2.rotation.z -= 0.008;
    
    const dish = centralCoreGroup.getObjectByName("station_dish");
    if (dish) {
      dish.rotation.z += 0.005;
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
    // Smoothly scale node on hover
    const targetScale = node.isHovered ? 1.3 : 1.0;
    const currentScale = node.group.scale.x;
    const nextScale = currentScale + (targetScale - currentScale) * 0.15;
    node.group.scale.set(nextScale, nextScale, nextScale);

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
      node.sprite.position.y = 2.0 + Math.sin(time * 2.0 + node.group.position.x) * 0.08;
    }
    
    const dist = gamePlayer.position.distanceTo(node.group.position);
    if (dist < minDistance) {
      minDistance = dist;
      closestNode = node;
    }
  });
  
  // Animate exit portal and check for collision to warp back to list view
  if (gamePortalGroup && gamePortalVortex && gamePortalRing && gamePlayer) {
    gamePortalVortex.rotation.z += 0.015;
    const scalePulse = 1.0 + Math.sin(performance.now() * 0.003) * 0.04;
    gamePortalRing.scale.set(scalePulse, scalePulse, 1.0);
    
    if (gamePortalSprite) {
      gamePortalSprite.lookAt(gameCamera.position);
    }
    
    const portalDist = gamePlayer.position.distanceTo(gamePortalGroup.position);
    if (portalDist < 3.2 && is3DMode) {
      // Set position back to origin to prevent double triggering
      gamePlayer.position.set(0, 0.5, 0);
      gamePlayerTargetPos = null;
      
      const exitBtn = document.getElementById("exit-3d-btn") || document.getElementById("view-mode-btn");
      if (exitBtn) {
        exitBtn.click();
      }
    }
  }
  
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
    
    // Update bottom-left location HUD text
    const locText = document.getElementById("current-location-text");
    if (locText) {
      const displayVal = currentLang === 'vi' ? closestNode.def.name : closestNode.def.nameEn;
      if (locText.textContent !== displayVal) {
        locText.textContent = displayVal;
      }
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
  
  if (gameStars && gameStars.geometry && gameStars.geometry.attributes.position) {
    const pos = gameStars.geometry.attributes.position.array;
    for (let i = 2; i < pos.length; i += 3) {
      const speed = transitionLoadingActive ? 12.0 : 0.15;
      pos[i] -= speed;
      if (pos[i] < -200) {
        pos[i] = 200;
        pos[i-2] = (Math.random() - 0.5) * 200;
        pos[i-1] = (Math.random() - 0.5) * 150 + 20;
      }
    }
    gameStars.geometry.attributes.position.needsUpdate = true;
  }

  // Smoothly interpolate camera radius towards target
  gameCameraRadius += (gameCameraTargetRadius - gameCameraRadius) * 0.15;

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
    if (node.sprite) {
      const colorHex = '#' + node.def.color.toString(16).padStart(6, '0');
      const newText = currentLang === 'vi' ? node.def.name : node.def.nameEn;
      const texture = createTextTexture(newText, colorHex);
      node.sprite.material.map = texture;
      node.sprite.material.needsUpdate = true;
    }
  });
  
  if (gamePortalSprite) {
    const portalText = currentLang === 'vi' ? 'CỔNG THOÁT' : 'EXIT PORTAL';
    const texture = createTextTexture(portalText, '#f43f5e');
    gamePortalSprite.material.map = texture;
    gamePortalSprite.material.needsUpdate = true;
  }
}

function triggerSpaceTransition(callback, isExit = false) {
  const loader = document.getElementById("transition-loader");
  const joystick = document.getElementById("joystick-zone");
  const hud = document.getElementById("instructions-hud");
  const interaction = document.getElementById("interaction-hud");
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

  // If exiting, make transition background solid to cover up object disappearance
  if (isExit) {
    loader.style.backgroundColor = "rgba(5, 8, 22, 0.96)";
  } else {
    loader.style.backgroundColor = "transparent";
  }

  // Show loader overlay
  loader.classList.remove("hidden");
  // Force reflow
  loader.offsetHeight;
  loader.style.opacity = "1";
  
  // Fade out 3D models so only stars show in Three.js
  if (gamePlayer) gamePlayer.visible = false;
  if (gameUnderGlobe) gameUnderGlobe.visible = false;
  if (gamePortalGroup) gamePortalGroup.visible = false;
  gameNodes.forEach(node => {
    if (node.group) node.group.visible = false;
  });
  
  if (joystick) joystick.style.opacity = "0";
  if (hud) hud.style.opacity = "0";
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
        const text = document.getElementById("view-mode-text");
        
        if (text) {
          text.textContent = currentLang === "vi" ? "🎮 KHÔNG GIAN 3D" : "🎮 3D WORKSPACE";
          text.setAttribute("data-vi", "🎮 KHÔNG GIAN 3D");
          text.setAttribute("data-en", "🎮 3D WORKSPACE");
        }
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
          if (callback) callback();
        }, 800);
      } else {
        // Fade out transition overlay (Enter flow)
        loader.style.opacity = "0";
        setTimeout(() => {
          loader.classList.add("hidden");
          transitionLoadingActive = false;
          
          // Show space station 3D world elements
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
              if (locationHud) locationHud.style.bottom = "11rem";
            } else {
              joystickZone.style.display = "none";
              if (locationHud) locationHud.style.bottom = "2rem";
            }
          }
          if (hud) hud.style.opacity = "1";
          
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
    // Keep 3D game hidden while the first-load bootloader overlay is active
    if (document.getElementById("bootloader-overlay")) {
      mainContent.classList.remove("hidden");
      gameContainer.classList.add("hidden");
      canvasBg.style.display = "block";
      if (mainNav) mainNav.classList.remove("hidden");
      return;
    }

    if (is3DMode) {
      text.textContent = currentLang === "vi" ? "📄 CHẾ ĐỘ THƯỜNG" : "📄 LIST VIEW";
      text.setAttribute("data-vi", "📄 CHẾ ĐỘ THƯỜNG");
      text.setAttribute("data-en", "📄 LIST VIEW");
      if (mainNav) mainNav.classList.add("hidden");
      
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
            if (locationHud) locationHud.style.bottom = "11rem";
          } else {
            joystickZone.style.display = "none";
            if (locationHud) locationHud.style.bottom = "2rem";
          }
        }
        const hud = document.getElementById("instructions-hud");
        if (hud) hud.style.opacity = "1";
      }
    } else {
      if (!skipTransition) {
        triggerSpaceTransition(null, true);
      } else {
        text.textContent = currentLang === "vi" ? "🎮 KHÔNG GIAN 3D" : "🎮 3D WORKSPACE";
        text.setAttribute("data-vi", "🎮 KHÔNG GIAN 3D");
        text.setAttribute("data-en", "🎮 3D WORKSPACE");
        if (mainNav) mainNav.classList.remove("hidden");
        
        mainContent.style.opacity = "";
        mainContent.classList.remove("hidden");
        gameContainer.classList.add("hidden");
        canvasBg.style.display = "block";
        
        stopGame3D();
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

  // Portal Crack Button - Direct entry to 3D Space Station
  const portalBtn = document.getElementById("portal-crack-btn");
  if (portalBtn) {
    portalBtn.addEventListener("click", () => {
      if (!is3DMode) {
        is3DMode = true;
        localStorage.setItem("view-mode-3d", is3DMode);
        updateToggleUI(false);
        if (typeof playBeep === 'function') {
          playBeep(1200, 0.15, 'sine', 0.08);
          setTimeout(() => playBeep(1500, 0.1, 'sine', 0.05), 150);
          setTimeout(() => playBeep(1800, 0.08, 'sine', 0.03), 300);
        }
      } else {
        const gameContainer = document.getElementById("game-container");
        if (gameContainer) gameContainer.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }
  
  const savedMode = localStorage.getItem("view-mode-3d");
  if (savedMode !== null) {
    is3DMode = savedMode === "true";
  } else {
    is3DMode = true; // Enabled by default
  }
  
  updateToggleUI(true);
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

  // Initialize floating AI chatbot
  initSpaceChatbot();

  function initSpaceChatbot() {
    const chatbotToggle = document.getElementById("chatbot-toggle");
    const chatbotWindow = document.getElementById("chatbot-window");
    const chatbotClose = document.getElementById("chatbot-close");
    const chatbotInput = document.getElementById("chatbot-input");
    const chatbotSend = document.getElementById("chatbot-send");
    const chatbotMessages = document.getElementById("chatbot-messages");

    if (!chatbotToggle || !chatbotWindow || !chatbotClose || !chatbotInput || !chatbotSend || !chatbotMessages) return;

    let chatHistory = [];
    let isWindowOpen = false;
    let isLoading = false;

    // Toggle Chat Window
    chatbotToggle.addEventListener("click", () => {
      isWindowOpen = !isWindowOpen;
      if (isWindowOpen) {
        chatbotWindow.classList.remove("scale-0");
        chatbotWindow.classList.add("scale-100");
        if (!isLoading) chatbotInput.focus();
        if (typeof playBeep === "function") {
          playBeep(880, 0.08, "sine", 0.02);
        }
      } else {
        chatbotWindow.classList.remove("scale-100");
        chatbotWindow.classList.add("scale-0");
        if (typeof playBeep === "function") {
          playBeep(600, 0.08, "triangle", 0.02);
        }
      }
    });

    // Close Chat Window
    chatbotClose.addEventListener("click", (e) => {
      e.stopPropagation();
      isWindowOpen = false;
      chatbotWindow.classList.remove("scale-100");
      chatbotWindow.classList.add("scale-0");
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
    if (chatbotSuggestions) {
      chatbotSuggestions.querySelectorAll(".chatbot-suggest-btn").forEach(btn => {
        btn.addEventListener("click", () => {
          if (isLoading) return;
          chatbotInput.value = btn.innerText;
          if (chatbotSuggestions) {
            chatbotSuggestions.style.display = "none";
          }
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
        chatbotSuggestions.style.display = "none";
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
        const responseText = await askGemini(query, chatHistory);
        
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
        appendMessage("bot", (currentLang === "vi" 
          ? "Đã xảy ra lỗi kết nối với hệ thống AI của trạm: " 
          : "Connection error with the station AI system: ") + err.message);
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
      const apiKey = 'AIzaSyDMAfA0lZN2Sczruue7nLvdvmtYnWInHiM';
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
      
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
          text: `Bạn là Trợ lý AI (Cyber-Assistant) tại Trạm Không Gian Hồ sơ cá nhân của Nguyễn Thanh Hiền & Nguyễn Anh Quý (Web Developer & Laravel).
Nhiệm vụ của bạn là hỗ trợ và tư vấn nhiệt tình cho khách truy cập về thông tin cá nhân, kỹ năng, và các dự án của Thanh Hiền và Anh Quý.
Hãy giữ giọng điệu thân thiện, chuyên nghiệp, thông minh và mang chút âm hưởng khoa học viễn tưởng/vũ trụ (ví dụ: dùng các từ như 'Trạm điều khiển', 'Quỹ đạo', 'Hệ thống', v.v. khi phù hợp).
Thông tin hồ sơ của Nguyễn Thanh Hiền để bạn tham khảo trả lời:
- Vai trò: Thực tập sinh Web Developer & Laravel.
- Nơi ở: Thủ Đức, TP.HCM.
- Dạng làm việc: Thực tập / Fulltime.
- Học vấn: Sinh viên Công nghệ thông tin trường Cao đẳng Công nghệ Thủ Đức (TDC). Năm 1 (2024-2025) đạt GPA 2.71, học lập trình C#, Java, MySQL.
- Kỹ năng (Khoang Công Nghệ):
  1. Frontend & UI/UX: HTML/CSS, TailwindCSS, JavaScript, Responsive Design, thiết kế giao diện cao cấp.
  2. Backend & Kiến trúc: PHP (OOP), MySQL (PDO), Service-Repository Pattern.
  3. Mobile & API: Dart (Flutter, Riverpod, Clean Architecture), RESTful API, tích hợp Gemini AI và cổng thanh toán PayOS/VietQR.
  4. Bảo mật: 2FA TOTP, Bcrypt password hashing, Prepared Statements (chống SQL Injection), vô hiệu hóa CSRF.
- Các Dự Án Thực Tế:
  1. Website Bán Hàng Điện Tử (Đồng Phát Triển): Hệ thống mua sắm Laravel & MySQL. Tích hợp Service-Repository, 2FA, OAuth2, thanh toán tự động PayOS, chatbot Gemini AI, Flutter Mobile App (Riverpod). Đạt điểm đồ án xuất sắc 8.0/10, triển khai Docker/Apache. Link chạy thử: https://dienmaypro.nguyenanhquy.id.vn/. Github: https://github.com/eHin-cloud/TrienKhaiPM.git
  2. Website TMĐT Nhóm G (Laravel): Đồ án môn học Back-end Web 2 xây dựng bằng Laravel, MySQL, phối hợp qua Github (merge code). Link chạy thử: https://tmdtgroupg.nthanhhien.id.vn/. Github: https://github.com/AQuyGib/ThuongMaiDienTu
  3. Hồ Sơ Năng Lực 3D Tương Tác: Đồ án Front-end Web 2 (trang web portfolio 3D hiện tại). Sử dụng Three.js, HTML, CSS, JS thuần, tối ưu 60 FPS. Link chạy thử: https://nthanhhien.id.vn/. Github: https://github.com/eHin-cloud/FE2_Project
Thông tin liên lạc của Nguyễn Thanh Hiền:
- SĐT/Hotline: 0396 519 196
- Email: thenghien2006@gmail.com
- GitHub: github.com/eHin-cloud (Link: https://github.com/eHin-cloud)
- Form Liên Hệ: Khách truy cập có thể dùng Form Liên Hệ (Contact Form) ở cuối trang web để gửi lời nhắn trực tiếp tới hòm thư thenghien2006@gmail.com (hệ thống sử dụng Web3Forms để chuyển tiếp). Hãy hướng dẫn khách sử dụng form này nếu họ muốn gửi tin nhắn nhanh.
- Cộng tác viên phát triển dự án cùng Hiền là Nguyễn Anh Quý (nguyquy67@gmail.com, github.com/AQuyGib).
Hãy tự động phát hiện ngôn ngữ của câu hỏi và phản hồi bằng chính ngôn ngữ đó (Hỏi tiếng Việt trả lời tiếng Việt, hỏi tiếng Anh trả lời tiếng Anh). Trả lời ngắn gọn (khoảng 2-3 câu), tập trung vào câu hỏi và không bịa đặt thông tin không có trong hồ sơ.`
        }]
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents,
          systemInstruction
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMsg = `HTTP ${response.status}`;
        try {
          const errJson = JSON.parse(errorText);
          if (errJson.error && errJson.error.message) {
            errorMsg += `: ${errJson.error.message}`;
          }
        } catch (e) {
          errorMsg += `: ${errorText}`;
        }
        throw new Error(errorMsg);
      }

      const data = await response.json();
      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts) {
        if (data.candidates && data.candidates[0] && data.candidates[0].finishReason) {
          throw new Error(`Blocked by Gemini (Reason: ${data.candidates[0].finishReason})`);
        }
        throw new Error("Invalid response format from Gemini API");
      }
      return data.candidates[0].content.parts[0].text;
    }
  }
});
