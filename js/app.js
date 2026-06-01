// ==========================================================================
// AUDIO SYNTHESIZER UTILITIES (SCI-FI FX ENGINE)
// ==========================================================================
let audioCtx;
let chargingOsc, chargingLFO, chargingGain;

function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

function playBeep(freq = 440, duration = 0.1, type = 'sine', volume = 0.05) {
  try {
    initAudio();
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

  // Attempt to start continuous warp core audio hum
  // It starts quiet/low and pitches up as we load
  document.addEventListener('mouseover', function initSoundOnInteraction() {
    startChargingHum();
    document.removeEventListener('mouseover', initSoundOnInteraction);
  }, { once: true });

  const tick = () => {
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

      // Play click sounds during decryption
      if (progress % 3 === 0) {
        playBeep(800 + Math.random() * 400, 0.02, 'sine', 0.01);
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
    vi: "Lập trình viên Front-End & Chuyên viên Kiểm thử chất lượng (QA). Đam mê xây dựng web tối ưu và đảm bảo trải nghiệm người dùng.",
    en: "Front-End Developer & Quality Assurance Specialist (QA). Passionate about building optimized websites and ensuring user experience."
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
  camera.position.z = 6;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setSize(canvas.clientWidth, canvas.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // Lights
  const pointLight = new THREE.PointLight(0x915eff, 2.5, 100);
  pointLight.position.set(5, 3, 5);
  scene.add(pointLight);

  const ambient = new THREE.AmbientLight(0x06b6d4, 0.2);
  scene.add(ambient);

  // Dotted Globe Sphere
  const geom = new THREE.SphereGeometry(2.0, 24, 24);
  const mat = new THREE.MeshBasicMaterial({
    color: 0x06b6d4,
    wireframe: true,
    transparent: true,
    opacity: 0.35
  });
  const globe = new THREE.Mesh(geom, mat);
  scene.add(globe);

  // Orbit ring
  const ringGeom = new THREE.RingGeometry(2.6, 2.7, 32);
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0x915eff,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.5
  });
  const ring = new THREE.Mesh(ringGeom, ringMat);
  ring.rotation.x = Math.PI / 2.5;
  scene.add(ring);

  const resize = () => {
    const w = canvas.parentElement.clientWidth;
    const h = canvas.parentElement.clientHeight || 350;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  window.addEventListener("resize", resize);
  resize();

  const animate = () => {
    requestAnimationFrame(animate);

    globe.rotation.y += 0.004;
    globe.rotation.x += 0.001;
    ring.rotation.z -= 0.002;

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
  const form = document.getElementById("contact-form");
  if (!form) return;

  // Press Enter to submit form from textarea
  const messageInput = document.getElementById("message");
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

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const message = document.getElementById("message").value.trim();

    const nameErr = document.getElementById("name-error");
    const emailErr = document.getElementById("email-error");
    const msgErr = document.getElementById("message-error");

    let isValid = true;

    // Validate Name
    if (name.length < 3) {
      nameErr.classList.remove("hidden");
      isValid = false;
    } else {
      nameErr.classList.add("hidden");
    }

    // Validate Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      emailErr.classList.remove("hidden");
      isValid = false;
    } else {
      emailErr.classList.add("hidden");
    }

    // Validate Message
    if (message.length < 5) {
      msgErr.classList.remove("hidden");
      isValid = false;
    } else {
      msgErr.classList.add("hidden");
    }

    if (!isValid) {
      playBeep(220, 0.2, 'sawtooth', 0.05); // low buzz fail audio
      return;
    }

    // Submit Success (Send to Formspree if configured, otherwise Mock toast)
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
