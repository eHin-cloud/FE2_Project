// ==========================================================================
// AUDIO SYNTHESIZER UTILITIES
// ==========================================================================
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playBeep(freq = 440, duration = 0.1, type = 'sine', volume = 0.05) {
  try {
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
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
    console.warn("Audio playback context failed to initialize: ", e);
  }
}

function playSuccessChime() {
  playBeep(523.25, 0.15, 'sine', 0.05); // C5
  setTimeout(() => playBeep(659.25, 0.15, 'sine', 0.05), 100); // E5
  setTimeout(() => playBeep(783.99, 0.25, 'sine', 0.05), 200); // G5
  setTimeout(() => playBeep(1046.50, 0.4, 'sine', 0.05), 300); // C6
}

// ==========================================================================
// BOOTLOADER ANIMATOR
// ==========================================================================
function startBootloader() {
  const steps = [
    { text: "INITIALIZING WEBGL PORTFOLIO CORPS...", weight: 10 },
    { text: "INJECTING THREE.JS GRAPHICS PIPELINE...", weight: 15 },
    { text: "MAPPING STARFIELD PARTICLE ARRAYS...", weight: 15 },
    { text: "COMPILING STUDENT BIO AND TDC DATA...", weight: 15 },
    { text: "LOADING LARAVEL BACKEND ENVIRONMENT...", weight: 15 },
    { text: "DEPLOYING MANUAL QA TEST CASE SCHEMAS...", weight: 15 },
    { text: "ASSEMBLING WORKSPACE. SUCCESSFUL COMPILE.", weight: 15 }
  ];

  const statusPercent = document.getElementById("loader-percentage");
  const logTerminal = document.getElementById("loader-terminal-logs");
  const overlay = document.getElementById("bootloader-overlay");
  const startBtn = document.getElementById("loader-start-btn");

  const pathIds = ["wf_header", "wf_sidebar", "wf_workspace", "wf_inner_1", "wf_inner_2"];
  const paths = pathIds.map(id => document.getElementById(id)).filter(Boolean);

  // Initialize paths stroke length
  paths.forEach(path => {
    const len = path.getTotalLength();
    path.style.strokeDasharray = len;
    path.style.strokeDashoffset = len;
  });

  let progress = 0;
  let activeStep = 0;

  const tick = () => {
    progress++;

    // Update Percentage
    if (statusPercent) statusPercent.textContent = `${progress}%`;

    // Trace SVG Mockup Paths
    const ratio = progress / 100;
    paths.forEach(path => {
      const len = path.getTotalLength();
      path.style.strokeDashoffset = len * (1 - ratio);
      if (progress >= 95) {
        path.style.stroke = "rgba(168, 85, 247, 0.85)";
        path.style.filter = "drop-shadow(0 0 5px rgba(168, 85, 247, 0.6))";
      } else {
        path.style.stroke = `rgba(168, 85, 247, ${0.2 + ratio * 0.5})`;
      }
    });

    // Check step status
    let sum = 0;
    for (let i = 0; i < steps.length; i++) {
      sum += steps[i].weight;
      if (progress <= sum) {
        activeStep = i;
        break;
      }
    }

    // Write Terminal Logs
    if (logTerminal) {
      let html = '';
      for (let i = 0; i < activeStep; i++) {
        html += `<div class="text-[#888] font-mono text-xs mb-1">✔ ${steps[i].text}</div>`;
      }
      html += `
        <div class="text-[#915eff] font-mono text-xs mb-1 animate-pulse flex items-center gap-2">
          <svg class="animate-spin w-3 h-3 text-[#915eff]" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          ${steps[activeStep]?.text || "FINALIZING APPLICATION BUILD..."}
        </div>
      `;
      logTerminal.innerHTML = html;
    }

    if (progress < 100) {
      setTimeout(tick, 16);
    } else {
      // Completed loading
      playSuccessChime();
      
      // Update SVG path glow
      paths.forEach(path => {
        path.style.stroke = "#10b981"; // change to emerald success color
        path.style.filter = "drop-shadow(0 0 8px rgba(16, 185, 129, 0.8))";
      });

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

  playBeep(330, 0.1, 'sine', 0.03);
  setTimeout(tick, 300);
}

// ==========================================================================
// TYPING EFFECT
// ==========================================================================
function triggerTypingEffect() {
  const target = document.getElementById("typing-desc");
  if (!target) return;
  const original = "Lập trình viên Front-End & Chuyên viên Kiểm thử chất lượng (QA). Đam mê xây dựng web tối ưu và đảm bảo trải nghiệm người dùng.";
  target.textContent = "";
  let i = 0;
  const type = () => {
    if (i < original.length) {
      target.textContent += original.charAt(i);
      i++;
      setTimeout(type, 25);
    }
  };
  setTimeout(type, 500);
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

    // Submit Success (Mock toast)
    const btn = form.querySelector("button[type='submit']");
    btn.textContent = "Đang gửi...";
    btn.disabled = true;
    playBeep(440, 0.1, 'sine', 0.05);

    setTimeout(() => {
      // Toast notification popup
      const toast = document.createElement("div");
      toast.className = "fixed bottom-5 right-5 bg-[#10b981] text-white py-3 px-6 rounded-xl font-bold z-50 shadow-lg flex items-center gap-2 transform translate-y-20 transition-all duration-300";
      toast.innerHTML = `
        <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"></path></svg>
        Cảm ơn bạn! Tin nhắn đã được gửi thành công.
      `;
      document.body.appendChild(toast);

      // Audio notification
      playSuccessChime();

      // Animate toast in and out
      setTimeout(() => toast.className = toast.className.replace("translate-y-20", "translate-y-0"), 50);
      setTimeout(() => {
        toast.className = toast.className.replace("translate-y-0", "translate-y-20");
        setTimeout(() => toast.remove(), 300);
      }, 4000);

      // Reset form
      form.reset();
      btn.textContent = "Gửi";
      btn.disabled = false;
    }, 1500);
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
